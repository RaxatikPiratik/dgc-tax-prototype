'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { clearDemoSession, getDemoSession } from '@/lib/demo-auth'

const navigationItems = [
  { href: '/dashboard', label: 'Панель управления' },
  { href: '/business', label: 'Профиль бизнеса' },
  { href: '/reports', label: 'История отчётов' },
  { href: '/form', label: 'Мастер налоговой формы' },
]

export default function WorkspaceShell({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSession(getDemoSession())
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [])

  const isLoadingSession = session === undefined
  const needsLogin = session === null

  useEffect(() => {
    if (needsLogin) {
      router.replace('/login')
    }
  }, [needsLogin, router])

  const pageTitle = useMemo(() => {
    const currentItem = navigationItems.find(item => item.href === pathname)
    return currentItem?.label || 'Рабочее пространство'
  }, [pathname])

  function handleSignOut() {
    clearDemoSession()
    setSession(null)
    router.replace('/login')
  }

  if (isLoadingSession || needsLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
        Загрузка рабочего пространства...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_35%),linear-gradient(180deg,_#eff4ff_0%,_#f7f8fc_38%,_#f8fafc_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 py-4 lg:px-6">
        <aside className="hidden w-72 shrink-0 rounded-[28px] border border-white/70 bg-slate-950 p-6 text-slate-100 shadow-[0_20px_80px_rgba(15,23,42,0.22)] lg:flex lg:flex-col">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-base font-semibold text-slate-950">
              DG
            </div>
            <div>
              <p className="text-sm font-semibold">DGC</p>
              <p className="text-xs text-slate-400">Налоговая отчётность Казахстана</p>
            </div>
          </Link>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Выполнен вход
            </p>
            <p className="mt-3 text-lg font-semibold">
              {session?.name || 'Пользователь'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {session?.email || 'prototype@dgc.kz'}
            </p>
          </div>

          <nav className="mt-8 space-y-2">
            {navigationItems.map(item => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-white text-slate-950'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-2xl border border-white/20 px-4 py-2 font-medium text-white transition hover:bg-white/10"
            >
              Выйти
            </button>
          </div>
        </aside>

        <div className="flex min-h-full flex-1 flex-col">
          <header className="mb-6 rounded-[28px] border border-white/70 bg-white/85 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                  {pageTitle}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:hidden">
                {navigationItems.map(item => {
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-slate-950 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}
