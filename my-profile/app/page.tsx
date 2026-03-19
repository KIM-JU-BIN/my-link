export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950 px-6 py-12">
      <main className="flex flex-col items-center text-center max-w-2xl gap-8">
        <section className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
            홍길동
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            안녕하세요, 바이브 코딩을 배우고 있는 대학생입니다.
          </p>
        </section>

        <hr className="w-full border-zinc-200 dark:border-zinc-800" />

        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            학습 중인 롤모델: 윤창식 개발자
          </h2>
          <div className="text-left bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
              제가 영감을 얻고 있는 <strong>윤창식 개발자</strong>님은 &quot;바이브 코딩&quot;의 철학을 전파하며 개발 생태계에 긍정적인 영향력을 미치고 계신 분입니다. 
            </p>
            <ul className="mt-4 space-y-2 text-zinc-600 dark:text-zinc-400 list-disc list-inside">
              <li>실전 중심의 코딩 교육 및 멘토링</li>
              <li>효율적이고 직관적인 개발 방법론 제시</li>
              <li>커뮤니티를 통한 지식 공유와 성장에 기여</li>
            </ul>
            <p className="mt-4 text-zinc-700 dark:text-zinc-300">
              윤창식 개발자님의 가르침을 바탕으로, 단순한 코딩을 넘어 사용자에게 가치를 전달하는 개발자가 되기 위해 노력하고 있습니다.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
