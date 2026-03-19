import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-red-500 selection:text-white border-x-4 md:border-x-8 border-black">
      
      {/* Top Ticker Tape */}
      <div className="border-b-4 md:border-b-8 border-black bg-yellow-400 p-3 overflow-hidden whitespace-nowrap">
        <p className="font-black text-xl md:text-2xl uppercase tracking-widest inline-block">
          ✦ DATABASE ADMINISTRATOR IN THE MAKING ✦ DATA IS THE NEW OIL ✦
        </p>
      </div>

      <main className="w-full flex flex-col lg:grid lg:grid-cols-12 border-b-4 md:border-b-8 border-black">
        
        {/* Header / Hero Section */}
        <section className="bg-[#FF00FF] p-8 md:p-16 col-span-12 lg:col-span-8 border-b-4 lg:border-b-0 lg:border-r-8 border-black flex flex-col justify-center items-start">
          <div className="bg-white border-4 border-black px-6 py-2 text-xl md:text-3xl font-black mb-8 shadow-[8px_8px_0_0_#000] rotate-[-2deg]">
            한양여자대학교 3학년
          </div>
          <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter text-white drop-shadow-[6px_6px_0_rgba(0,0,0,1)] mix-blend-hard-light leading-none mb-8">
            KIM<br />JUBIN
          </h1>
          <p className="text-2xl md:text-4xl font-bold bg-black text-yellow-400 p-6 border-4 border-white">
            데이터의 가치를 발굴하는 예비 DBA
          </p>
        </section>

        {/* Info Box Sidebar */}
        <aside className="bg-blue-600 p-8 md:p-12 col-span-12 lg:col-span-4 flex flex-col justify-center border-b-4 md:border-b-0 border-black">
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase mb-8 border-b-8 border-black pb-4">FOCUS</h2>
          <ul className="text-2xl md:text-3xl font-bold space-y-6 text-black">
            <li className="bg-white border-4 border-black p-5 shadow-[8px_8px_0_0_#000] rotate-1">👩🏻‍💻 JAVA</li>
            <li className="bg-white border-4 border-black p-5 shadow-[8px_8px_0_0_#000] -rotate-1">🐬 MySQL</li>
            <li className="bg-white border-4 border-black p-5 shadow-[8px_8px_0_0_#000] rotate-1">📜 DB 자격증 준비중</li>
          </ul>
        </aside>

        {/* About Section */}
        <section className="bg-yellow-400 p-8 md:p-20 col-span-12 border-t-4 lg:border-t-8 border-black flex flex-col items-center text-center">
          <h2 className="text-5xl md:text-7xl font-black uppercase mb-12 bg-white border-4 lg:border-8 border-black px-10 py-5 shadow-[12px_12px_0_0_#000] -rotate-2">
            ABOUT ME
          </h2>
          <div className="max-w-5xl text-xl md:text-3xl lg:text-4xl font-bold leading-tight space-y-8 text-black">
            <p className="bg-white p-6 md:p-10 border-4 lg:border-8 border-black shadow-[8px_8px_0_0_#000] md:shadow-[16px_16px_0_0_#000]">
              데이터베이스가 가진 무한한 가능성과 질서정연함에 매료되어 <strong>DBA(Database Administrator)</strong>를 꿈꿉니다.
            </p>
            <p className="bg-white p-6 md:p-10 border-4 lg:border-8 border-black shadow-[8px_8px_0_0_#000] md:shadow-[16px_16px_0_0_#000]">
              단순 데이터 저장을 넘어 시스템의 심장인 데이터베이스를 설계/운영하는 데이터 전문가가 되기 위해 매일 직면하는 어려운 쿼리 문제들도 즐겁게 풀어가고 있습니다.
            </p>
          </div>
        </section>

        {/* Links Grid Section */}
        <section className="col-span-12 grid grid-cols-1 md:grid-cols-3 border-t-4 lg:border-t-8 border-black">
          <a
            href="https://velog.io/@kim_ju_bin/posts"
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-[#00FF00] p-12 md:p-16 text-center border-b-4 md:border-b-0 md:border-r-8 border-black hover:bg-black hover:text-[#00FF00] transition-colors duration-200"
          >
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-6 group-hover:underline">Velog</h3>
            <p className="text-2xl md:text-3xl font-bold">기술 블로그 📝</p>
          </a>
          
          <a
            href="https://github.com/KIM-JU-BIN"
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white p-12 md:p-16 text-center border-b-4 md:border-b-0 md:border-r-8 border-black hover:bg-black hover:text-white transition-colors duration-200"
          >
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-6 group-hover:underline">GitHub</h3>
            <p className="text-2xl md:text-3xl font-bold">소스코드 💻</p>
          </a>

          <a
            href="https://www.linkedin.com/in/%EC%A3%BC%EB%B9%88-%EA%B9%80-3ab913387/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-[#00FFFF] p-12 md:p-16 text-center hover:bg-black hover:text-[#00FFFF] transition-colors duration-200 break-all"
          >
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-6 group-hover:underline">LinkedIn</h3>
            <p className="text-2xl md:text-3xl font-bold">네트워크 🤝</p>
          </a>
        </section>
        
      </main>

      {/* Footer */}
      <footer className="bg-black text-white p-10 text-center text-xl md:text-3xl font-bold uppercase tracking-widest">
        © 2026 KIM JUBIN. DESIGNED WITH BRUTALISM.
      </footer>
    </div>
  );
}
