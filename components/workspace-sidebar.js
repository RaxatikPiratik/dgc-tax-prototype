'use client'

import Link from 'next/link'

function SidebarIcon({ active = false }) {
  return (
    <span
      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
        active
          ? 'border-white/20 bg-white text-[#0f5f9b]'
          : 'border-white/10 bg-white/10 text-white'
      }`}
      aria-hidden="true"
    >
      <span className="grid h-4 w-4 grid-cols-2 gap-0.5">
        <span className="rounded-[2px] bg-current" />
        <span className="rounded-[2px] bg-current" />
        <span className="rounded-[2px] bg-current" />
        <span className="rounded-[2px] bg-current" />
      </span>
    </span>
  )
}

function Chevron({ open = false }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7.5 10 12.5 15 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SidebarItem({ item, pathname, depth = 0 }) {
  const active = item.match?.(pathname) || pathname === item.href
  const hasChildren = Boolean(item.children?.length)
  const showChevron = hasChildren && !item.hideChevron
  const shouldOpen =
    hasChildren &&
    (active ||
      item.children.some(
        child => child.match?.(pathname) || pathname === child.href
      ))

  const classes = `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
    depth > 0
      ? active
        ? 'bg-white/18 text-white'
        : 'text-sky-100/80 hover:bg-white/8 hover:text-white'
      : active
        ? 'bg-white text-[#0f5f9b] shadow-[0_12px_30px_rgba(4,28,53,0.2)]'
        : 'text-white/88 hover:bg-white/10 hover:text-white'
  }`

  const content = (
    <>
      {depth === 0 ? <SidebarIcon active={active} /> : <span className="w-5" />}
      <span className="flex-1 text-left leading-5">{item.label}</span>
      {item.badge ? (
        <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0f5f9b]">
          {item.badge}
        </span>
      ) : null}
      {showChevron ? <Chevron open={shouldOpen} /> : null}
    </>
  )

  return (
    <div className={depth > 0 ? 'pl-3' : ''}>
      {item.href ? (
        <Link href={item.href} className={classes}>
          {content}
        </Link>
      ) : (
        <div className={classes}>{content}</div>
      )}

      {shouldOpen ? (
        <div className="mt-1 space-y-1">
          {item.children.map(child => (
            <SidebarItem
              key={child.label}
              item={child}
              pathname={pathname}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function WorkspaceSidebar({
  pathname,
  navigation,
  onSignOut,
}) {
  return (
    <aside className="flex h-full w-full flex-col rounded-[30px] bg-[linear-gradient(180deg,#0e6baa_0%,#0d5b93_54%,#0a4c7c_100%)] text-white shadow-[0_24px_70px_rgba(15,79,128,0.28)]">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-lg font-bold">
            DG
          </span>
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-white/75">
              DGC
            </p>
            <p className="text-base font-semibold">Бизнес-кабинет</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-1.5">
          {navigation.map(item => (
            <SidebarItem key={item.label} item={item} pathname={pathname} />
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10 px-5 py-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#0f5f9b]"
          >
            РУС
          </button>
          <button
            type="button"
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/85"
          >
            ҚАЗ
          </button>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="mt-5 w-full rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Выйти
        </button>
      </div>
    </aside>
  )
}
