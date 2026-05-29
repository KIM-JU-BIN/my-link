import { chromium } from "playwright-core";
import { spawn, execSync } from "child_process";
import http from "http";

const PORT = 3000;
const URL_TO_TEST = `http://localhost:${PORT}`;
let devServerProcess = null;

// 윈도우 환경에서 특정 포트(3000)를 사용 중인 프로세스를 종료하는 함수
function killPortProcess(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`).toString();
    const lines = output.split("\n");
    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      // 프로토콜 로컬주소 외부주소 상태 PID
      if (parts.length >= 5) {
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid) && pid !== "0") {
          pids.add(pid);
        }
      }
    }
    for (const pid of pids) {
      console.log(`포트 ${port}를 점유하고 있는 프로세스(PID: ${pid})를 종료합니다.`);
      execSync(`taskkill /F /PID ${pid}`);
    }
  } catch (err) {
    // 포트를 아무도 사용하지 않는 경우 에러가 나므로 무시함
  }
}

// 헬퍼: Next.js 서버가 준비될 때까지 대기
function waitForServer(url, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        reject(new Error("Next.js 개발 서버 대기 시간 초과"));
        return;
      }

      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            clearInterval(interval);
            resolve();
          }
        })
        .on("error", () => {
          // 서버가 아직 준비 안 됨
        });
    }, 500);
  });
}

async function runTests() {
  console.log("포트 3000 점유 프로세스를 먼저 정리합니다.");
  killPortProcess(PORT);

  console.log("Next.js 개발 서버를 구동합니다...");
  devServerProcess = spawn("npm", ["run", "dev"], {
    shell: true,
    stdio: "inherit",
  });

  console.log("개발 서버 응답 대기 중...");
  await waitForServer(URL_TO_TEST);
  console.log("개발 서버 준비 완료! 브라우저 테스트를 가동합니다.");

  let browser;
  // 윈도우 환경에 맞는 채널들 시도 (msedge -> chrome)
  const channels = ["msedge", "chrome"];
  let launchError = null;

  for (const channel of channels) {
    try {
      console.log(`[Playwright] ${channel} 채널로 브라우저 실행을 시도합니다...`);
      browser = await chromium.launch({
        headless: true,
        channel: channel,
      });
      break;
    } catch (err) {
      launchError = err;
      console.warn(`[Playwright] ${channel} 채널 실행 실패: ${err.message}`);
    }
  }

  if (!browser) {
    throw new Error(`시스템 브라우저를 실행할 수 없습니다. 에러: ${launchError?.message}`);
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`${URL_TO_TEST} 접속 중...`);
    await page.goto(URL_TO_TEST);

    // 1. 초기 렌더링 확인
    console.log("검증 1: 초기 페이지 로딩 및 프로필 영역 확인");
    const mainTitle = await page.locator("h1");
    const mainTitleText = await mainTitle.textContent();
    console.log(`- 메인 프로필 이름: ${mainTitleText}`);

    // "새 링크 추가" 버튼 확인
    const addBtn = page.locator("button:has-text('새 링크 추가')");
    await addBtn.waitFor({ state: "visible", timeout: 5000 });
    console.log("- '새 링크 추가' 버튼 노출 확인 완료");

    // 2. 다이얼로그 오픈 확인
    console.log("검증 2: 다이얼로그 오픈 동작 테스트");
    await addBtn.click();
    
    const dialogTitle = page.locator("h2:has-text('새 링크 추가')");
    await dialogTitle.waitFor({ state: "visible", timeout: 3000 });
    console.log("- 다이얼로그가 올바르게 열렸습니다.");

    // 3. 유효성 검증 테스트
    console.log("검증 3: 입력 필드 유효성 검사 테스트");
    const submitBtn = page.locator("button:has-text('저장')");
    const cancelBtn = page.locator("button:has-text('취소')");
    
    // (a) 제목과 URL 모두 빈 채로 추가하기 클릭
    await submitBtn.click();
    const titleError = page.locator("p:text-is('제목을 입력해주세요')");
    await titleError.waitFor({ state: "visible", timeout: 2000 });
    console.log("  => [성공] 제목 누락 시 '제목을 입력해주세요' 에러 UI 노출");

    // (b) 제목만 채우고 URL은 비워둔 상태로 테스트
    await page.fill("#title", "구글 테스트");
    await submitBtn.click();
    const urlError = page.locator("p:text-is('주소를 입력해주세요')");
    await urlError.waitFor({ state: "visible", timeout: 2000 });
    console.log("  => [성공] URL 누락 시 '주소를 입력해주세요' 에러 UI 노출");

    // (c) 잘못된 URL 형식 입력 시 테스트
    await page.fill("#url", "invalid_url_format");
    await submitBtn.click();
    const formatError = page.locator("p:text-is('올바른 URL 형식이 아닙니다 (예: https://example.com).')");
    await formatError.waitFor({ state: "visible", timeout: 2000 });
    console.log("  => [성공] 잘못된 URL 형식 입력 시 '올바른 URL 형식이 아닙니다 (예: https://example.com).' 에러 UI 노출");

    // 4. 정상 등록 테스트
    console.log("검증 4: 정상적인 새 링크 등록 테스트");
    await page.fill("#title", "Playwright E2E Google");
    await page.fill("#url", "google.com"); // 프로토콜(https)이 붙지 않아도 변환되는지 테스트
    await submitBtn.click();

    // 다이얼로그가 닫혔는지 확인
    await dialogTitle.waitFor({ state: "hidden", timeout: 3000 });
    console.log("- 링크 추가 성공 및 다이얼로그가 올바르게 닫혔습니다.");

    // 목록에 카드가 새로 등록되었는지 확인
    const newCard = page.locator("a:has-text('Playwright E2E Google')");
    await newCard.waitFor({ state: "visible", timeout: 3000 });
    console.log("- [성공] 목록에 'Playwright E2E Google' 카드 노출 확인 완료");

    // 등록된 카드에 구글 파비콘과 https://google.com URL이 정확하게 들어갔는지 속성 검증
    const newCardHref = await newCard.getAttribute("href");
    if (newCardHref === "https://google.com") {
      console.log(`- [성공] 카드의 href 주소가 'https://google.com'으로 올바르게 자동완성 되었습니다.`);
    } else {
      throw new Error(`카드의 URL이 맞지 않습니다: ${newCardHref}`);
    }

    const faviconImg = newCard.locator("img");
    const faviconSrc = await faviconImg.getAttribute("src");
    if (faviconSrc.includes("domain=google.com")) {
      console.log(`- [성공] 카드의 favicon src가 구글 도메인용으로 설정되었습니다: ${faviconSrc}`);
    } else {
      throw new Error(`파비콘 URL이 올바르지 않습니다: ${faviconSrc}`);
    }

    console.log("\n============================================");
    console.log("★ 모든 링크 추가 기능의 E2E 테스트를 성공적으로 통과하였습니다! ★");
    console.log("============================================\n");

  } catch (err) {
    console.error("테스트 실행 중 에러가 발생했습니다:", err);
    throw err;
  } finally {
    console.log("브라우저를 종료합니다...");
    await browser.close();
  }
}

// 메인 실행 흐름
runTests()
  .then(() => {
    console.log("E2E 테스트 성공 종료.");
    if (devServerProcess) {
      console.log("Next.js 개발 서버 프로세스를 정리합니다.");
      killPortProcess(PORT);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error("E2E 테스트 실패 종료.");
    if (devServerProcess) {
      console.log("Next.js 개발 서버 프로세스를 정리합니다.");
      killPortProcess(PORT);
    }
    process.exit(1);
  });
