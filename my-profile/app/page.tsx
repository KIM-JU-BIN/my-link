import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200 selection:text-blue-900 p-6 md:p-12 lg:p-20 flex justify-center">
      <main className="w-full max-w-4xl flex flex-col gap-12">
        
        {/* Header / Hero Section */}
        <header className="flex flex-col gap-4 text-center items-center justify-center pt-8">
          <div className="inline-block bg-blue-100 text-blue-700 text-sm md:text-base font-semibold px-5 py-1.5 rounded-full mb-2 border border-blue-200 shadow-sm">
            한양여자대학교 3학년 재학중 (2026년 기준)
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900">
            김주빈
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 font-medium mt-2">
            데이터의 가치를 발굴하는 예비 DBA
          </p>
        </header>

        {/* About Me Section */}
        <section className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
            <span className="text-2xl">🔥</span> 나에 대하여
          </h2>
          <div className="space-y-4 text-lg text-slate-600 leading-relaxed">
            <p>
              안녕하세요! 저는 데이터베이스가 가진 무한한 가능성과 질서정연함에 매료되어 <strong>DBA(Database Administrator)</strong>를 꿈꾸고 있는 한양여자대학교 3학년 김주빈입니다.
            </p>
            <p>
              단순히 데이터를 저장하는 것을 넘어, 시스템의 심장인 데이터베이스를 안정적이고 효율적으로 설계하고 운영하는 데이터 전문가가 되기 위해 끊임없이 배우고 있습니다.
              현재는 백엔드와 데이터베이스의 튼튼한 기초를 다지기 위해 <strong>JAVA와 MySQL</strong>을 깊이 있게 공부하고 있습니다.
            </p>
            <p>
              또한 저의 열정을 증명하고 전문 지식을 더욱 탄탄하게 쌓기 위해 <strong>데이터베이스 관련 자격증</strong> 취득도 열심히 준비 중입니다. 
              복잡한 쿼리나 설계 문제에 부딪힐 때마다 오히려 해결 과정을 즐기며, 데이터와 완벽하게 소통하는 법을 하나씩 깨달아가고 있습니다!
            </p>
          </div>
        </section>

        {/* Links Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="https://velog.io/@kim_ju_bin/posts"
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-8 text-center rounded-3xl"
          >
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 shadow-sm">
              📝
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Velog</h2>
            <p className="text-sm text-slate-500">공부한 내용을 기록하는 기술 블로그</p>
          </a>

          <a
            href="https://github.com/KIM-JU-BIN"
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-8 text-center rounded-3xl"
          >
            <div className="w-14 h-14 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300 shadow-sm">
              💻
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">GitHub</h2>
            <p className="text-sm text-slate-500">직접 작성한 소스 코드 및 프로젝트</p>
          </a>

          <a
            href="https://www.linkedin.com/in/%EC%A3%BC%EB%B9%88-%EA%B9%80-3ab913387/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-8 text-center rounded-3xl"
          >
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
              🤝
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2 break-all">LinkedIn</h2>
            <p className="text-sm text-slate-500">전문가 경력 및 직무 인맥 네트워크</p>
          </a>
        </section>

      </main>
    </div>
  );
}
