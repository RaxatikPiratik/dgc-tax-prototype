'use client'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M16 16 21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function TopPill({ children }) {
  return (
    <button
      type="button"
      className="inline-flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
    >
      {children}
    </button>
  )
}

export default function WorkspaceTopBar({ title, session }) {
  const initials =
    session?.name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'DG'

  return (
    <header className="rounded-[28px] border border-white/70 bg-[#f7fbff] px-4 py-4 shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0f6cab] text-white shadow-[0_12px_24px_rgba(15,108,171,0.26)]"
            aria-label="Поиск"
          >
            <SearchIcon />
          </button>

          <div className="flex h-12 min-w-0 flex-1 items-center rounded-2xl border border-slate-200 bg-[#eef4fa] px-5">
            <span className="truncate text-lg font-semibold text-[#295b87]">
              {title}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 xl:flex-nowrap">
          <TopPill>Видео-инструкции</TopPill>

          <div className="flex items-center gap-3 rounded-2xl bg-[#0f6cab] px-3 py-2 text-white shadow-[0_10px_24px_rgba(15,108,171,0.22)]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-sm font-bold">
              {initials}
            </span>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold">
                {session?.name || 'Пользователь'}
              </p>
              <p className="truncate text-xs text-white/75">
                {session?.email || 'demo@dgc.kz'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
