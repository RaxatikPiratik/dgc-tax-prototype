'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getDemoSession, setDemoSession } from '@/lib/demo-auth'

export default function LoginPage() {
  const router = useRouter()
  const [formState, setFormState] = useState({
    name: 'Aruzhan Sarsenova',
    email: 'demo@dgc.kz',
    password: '123456',
  })

  useEffect(() => {
    if (getDemoSession()) {
      router.replace('/dashboard')
    }
  }, [router])

  function handleChange(key, value) {
    setFormState(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    setDemoSession({
      name: formState.name,
      email: formState.email,
    })

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#edf4ff_0%,_#f8fbff_44%,_#ffffff_100%)] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center lg:px-6">
        <div className="w-full max-w-xl rounded-[36px] border border-slate-200 bg-white p-7 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="mb-8">
            <Link href="/" className="text-sm font-medium text-sky-700 hover:text-sky-800">
              Назад на главную
            </Link>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950">
              Вход
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">
                Полное имя
              </label>
              <input
                value={formState.name}
                onChange={event => handleChange('name', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">
                Электронная почта
              </label>
              <input
                type="email"
                value={formState.email}
                onChange={event => handleChange('email', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">
                Пароль
              </label>
              <input
                type="password"
                value={formState.password}
                onChange={event => handleChange('password', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Войти
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
