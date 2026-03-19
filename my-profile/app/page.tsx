import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f4f4f0] text-black font-sans selection:bg-black selection:text-white p-6 md:p-12 flex items-center justify-center">
      <main className="w-full max-w-5xl flex flex-col gap-10">
        
        {/* Header / Hero Section */}
        <header className="bg-[#FFD166] border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] p-10 md:p-16 rounded-xl flex flex-col items-start gap-6 relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
          <div className="absolute top-4 right-6 text-8xl opacity-20 font-black pointer-events-none">
            &#10033;
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-black">
            김주빈
          </h1>
          <div className="bg-[#EF476F] text-white text-xl md:text-2xl font-bold px-4 py-2 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform -rotate-2">
            한양여자대학교 3학년 재학중 (2026년 기준)
          </div>
        </header>

        {/* Links Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <a
            href="https://velog.io/@kim_ju_bin/posts"
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-[#06D6A0] border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-1.5 hover:translate-y-1.5 transition-all p-10 text-center rounded-xl flex flex-col items-center justify-center"
          >
            <h2 className="text-3xl font-black text-black group-hover:underline decoration-4 underline-offset-4">
              Velog
            </h2>
            <p className="mt-4 text-black font-bold border-t-2 border-black/20 pt-4 w-full">기술 블로그</p>
          </a>

          <a
            href="https://github.com/KIM-JU-BIN"
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-[#118AB2] border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-1.5 hover:translate-y-1.5 transition-all p-10 text-center rounded-xl flex flex-col items-center justify-center"
          >
            <h2 className="text-3xl font-black text-white group-hover:underline decoration-4 underline-offset-4">
              GitHub
            </h2>
            <p className="mt-4 text-white font-bold border-t-2 border-white/30 pt-4 w-full">소스 코드 및 프로젝트</p>
          </a>

          <a
            href="https://www.linkedin.com/in/%EC%A3%BC%EB%B9%88-%EA%B9%80-3ab913387/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-[#A084E8] border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-1.5 hover:translate-y-1.5 transition-all p-10 text-center rounded-xl flex flex-col items-center justify-center"
          >
            <h2 className="text-3xl font-black text-black group-hover:underline decoration-4 underline-offset-4 break-all">
              LinkedIn
            </h2>
            <p className="mt-4 text-black font-bold border-t-2 border-black/20 pt-4 w-full">전문가 경력 및 인맥</p>
          </a>
        </section>

      </main>
    </div>
  );
}
