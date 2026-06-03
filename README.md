# My Link — 개발자를 위한 링크 아카이빙 서비스

> **Development in One Link.**  
> GitHub, 블로그, 포트폴리오까지. 개발자의 모든 링크를 한 페이지에 담아보세요.

바이브코딩(Vibe Coding) 강의 실습을 통해 구현한 개인 링크 아카이빙 및 프로필 공유 서비스입니다.  
Google 계정으로 로그인하면 나만의 링크 페이지(`/나의닉네임`)를 만들고, 누구에게나 공유할 수 있습니다.

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🔐 Google 소셜 로그인 | Firebase Authentication을 통한 Google 계정 로그인/로그아웃 |
| 📝 프로필 인라인 편집 | 이름, 한 줄 소개를 클릭하여 즉시 수정 (낙관적 업데이트 적용) |
| 🔗 링크 CRUD | 링크 추가 · 수정 · 삭제 (제목, URL, Favicon 자동 추출) |
| 🌐 퍼블릭 프로필 페이지 | `/{displayName}` 경로로 누구나 열람 가능한 공개 링크 페이지 |
| 🛡️ Firestore 보안 규칙 | 공개 읽기 / 본인만 쓰기 · 필드 단위 유효성 검증 |
| 🎨 다크/라이트 테마 | next-themes 기반 테마 전환 지원 |

---

## 🛠️ 기술 스택

### Core
- **[Next.js](https://nextjs.org/) v16** — App Router 기반 React 프레임워크
- **[React](https://react.dev/) v19** — 컴포넌트 기반 UI 라이브러리
- **[TypeScript](https://www.typescriptlang.org/) v5** — 타입 안전성 확보

### Design & UI
- **[Tailwind CSS](https://tailwindcss.com/) v4** — 유틸리티 클래스 기반 스타일링
- **[shadcn/ui](https://ui.shadcn.com/) + [Base UI](https://base-ui.com/)** — 재사용 가능한 고품질 컴포넌트
- **[Tabler Icons React](https://tabler.io/icons)** — 직관적인 아이콘 라이브러리
- **[next-themes](https://github.com/pacocoursey/next-themes)** — 다크/라이트 모드 테마 전환

### Backend & Database
- **[Firebase](https://firebase.google.com/) v12**
  - **Firestore** — NoSQL 실시간 데이터베이스 (링크 및 프로필 저장)
  - **Authentication** — Google OAuth 2.0 소셜 로그인

### 상태 관리 & 데이터 페칭
- **[TanStack Query](https://tanstack.com/query) v5** — 서버 상태 관리 및 캐싱 (낙관적 업데이트)

### 폼 관리 & 유효성 검증
- **[React Hook Form](https://react-hook-form.com/) v7** — 성능 최적화된 폼 상태 관리
- **[Zod](https://zod.dev/) v4** — 스키마 기반 타입 안전 유효성 검사
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** — RHF ↔ Zod 연동

### 알림 (Toast)
- **[Sonner](https://sonner.emilkowal.ski/) v2** — 세련된 토스트 알림

### 개발 도구
- **[ESLint](https://eslint.org/) v9** — 코드 품질 관리
- **[Prettier](https://prettier.io/) v3** — 코드 포맷팅 (tailwindcss 플러그인 포함)

---

## 🗂️ 프로젝트 구조

```
my-link/
├── app/
│   ├── [displayName]/       # 퍼블릭 프로필 페이지 (/닉네임)
│   │   └── page.tsx
│   ├── page.tsx             # 메인 페이지 (마이페이지 / 랜딩)
│   ├── layout.tsx           # 루트 레이아웃
│   ├── providers.tsx        # TanStack Query, Toaster 등 전역 Provider
│   └── globals.css          # 전역 스타일
├── components/
│   ├── header.tsx           # 헤더 (로그인/로그아웃, 테마 전환)
│   └── ui/                  # shadcn/ui 컴포넌트
├── lib/
│   └── firebase.ts          # Firebase 초기화
├── hooks/                   # 커스텀 훅
├── firestore.rules          # Firestore 보안 규칙
└── .env.local               # 환경 변수 (로컬 전용, Git 제외)
```

---

## ⚙️ 시작하기

### 1. 저장소 클론 및 패키지 설치

```bash
git clone https://github.com/<your-username>/my-link.git
cd my-link
npm install
```

### 2. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/) 에서 새 프로젝트를 생성합니다.
2. **Authentication** → **Sign-in method** → Google 로그인을 활성화합니다.
3. **Firestore Database** 를 생성합니다 (테스트 모드로 시작 후 보안 규칙 적용).
4. **프로젝트 설정** → **내 앱** → 웹 앱을 추가하여 SDK 설정 값을 확인합니다.

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 Firebase SDK 설정 값을 입력합니다.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Firestore 보안 규칙 배포

```bash
# Firebase CLI 설치 (최초 1회)
npm install -g firebase-tools

# 로그인 및 초기화
firebase login
firebase init firestore

# 규칙 배포
firebase deploy --only firestore:rules
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 열어 확인하세요.

---

## 📜 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 코드 검사 |
| `npm run format` | Prettier 코드 포맷팅 |
| `npm run typecheck` | TypeScript 타입 검사 |

---

## 🔒 보안 규칙 요약

`firestore.rules` 에 정의된 보안 정책입니다.

| 컬렉션 | 읽기 | 쓰기 |
|--------|------|------|
| `users/{userId}` | 누구나 (공개 프로필) | 본인만 + 허용 필드만 |
| `users/{userId}/links/{linkId}` | 누구나 (공개 링크) | 본인만 + 필드 유효성 검증 |

- `displayName` (닉네임)은 계정 최초 생성 시 1회만 설정되며, 보안 규칙 레벨에서 수정이 차단됩니다.
- 링크 필드 (`title`, `url`, `faviconUrl`, `createdAt`) 유효성 검사가 서버 사이드에서 수행됩니다.

---

## 🚀 배포 (Vercel)

1. [Vercel](https://vercel.com/) 에 GitHub 저장소를 연결합니다.
2. Vercel 프로젝트의 **Environment Variables** 에 `.env.local` 의 환경 변수를 동일하게 등록합니다.
3. Firebase Console → Authentication → **승인된 도메인** 에 Vercel 배포 도메인을 추가합니다.

---

## 📄 라이선스

[MIT License](./LICENSE)
