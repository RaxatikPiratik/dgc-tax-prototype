import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f7fbff_0%,_#eef4ff_52%,_#ffffff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 lg:px-6">
        <header className="flex items-center justify-between rounded-full border border-slate-200 bg-white/85 px-5 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 font-semibold text-white">
              DG
            </div>
            <div>
              <p className="text-sm font-semibold">Налоговый конструктор DGC</p>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Вход
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Открыть
            </Link>
          </nav>
        </header>

        <section className="flex flex-1 items-center py-12">
          <div>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-slate-950">
              Отправляйте налоговую отчетность через пошаговый цифровой процесс вместо ручной бумажной работы.
            </h1>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                Начать
              </Link>
              <Link
                href="/form"
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Открыть налоговый мастер
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
