'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { clearDemoSession, getDemoSession } from '@/lib/demo-auth'
import WorkspaceSidebar from '@/components/workspace-sidebar'
import WorkspaceTopBar from '@/components/workspace-topbar'

const navigationItems = [
  {
    href: '/dashboard',
    label: 'Главная',
  },
  {
    href: '/business',
    label: 'Мои реквизиты',
  },
  {
    href: '/form',
    label: 'Мастер налоговой формы',
  },
  {
    href: '/salary-calculator',
    label: 'Калькулятор ЗП',
  },
  {
    label: 'Налоговый календарь',
  },
  {
    label: 'Шаблоны документов',
  },
  {
    label: 'Онлайн-касса',
  },
]

const pageMeta = {
  '/dashboard': { title: 'Главная', searchValue: 'ЭДО' },
  '/business': { title: 'Мои реквизиты', searchValue: 'Реквизиты' },
  '/reports': { title: 'Исходящие документы', searchValue: 'ЭДО' },
  '/form': { title: 'Мастер налоговой формы', searchValue: 'Форма 910.00' },
  '/salary-calculator': {
    title: 'Калькулятор ЗП',
    searchValue: 'Прямой расчёт',
  },
}

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
    return pageMeta[pathname]?.title || 'Рабочее пространство'
  }, [pathname])

  const searchValue = useMemo(() => {
    return pageMeta[pathname]?.searchValue || 'ЭДО'
  }, [pathname])

  function handleSignOut() {
    clearDemoSession()
    setSession(null)
    router.replace('/login')
  }

  if (isLoadingSession || needsLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eaf2f8] text-sm text-slate-500">
        Загрузка рабочего пространства...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eff5fa_0%,#eef4f9_100%)] text-slate-900">
      <div className="flex min-h-screen gap-5 p-3 lg:p-4">
        <div className="hidden w-[290px] shrink-0 lg:block">
          <WorkspaceSidebar
            pathname={pathname}
            navigation={navigationItems}
            onSignOut={handleSignOut}
          />
        </div>

        <div className="flex min-h-full min-w-0 flex-1 flex-col gap-4">
          <WorkspaceTopBar
            title={pageTitle}
            searchValue={searchValue}
            session={session}
          />

          <main className="flex-1 rounded-[32px] bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)] md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
