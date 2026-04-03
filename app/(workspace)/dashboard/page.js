'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

function formatDate(value) {
  if (!value) {
    return 'Недоступно'
  }

  return new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getStatusLabel(status) {
  if (status === 'submitted') {
    return 'Отправлен'
  }

  if (status === 'draft') {
    return 'Черновик'
  }

  return status || 'Черновик'
}

export default function DashboardPage() {
  const [templates, setTemplates] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [businessCount, setBusinessCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      const [templatesResponse, submissionsResponse, businessesResponse] = await Promise.all([
        supabase.from('report_templates').select('*').eq('is_active', true),
        supabase
          .from('submissions')
          .select('id,status,created_at,updated_at,submitted_at,report_template_id')
          .order('created_at', { ascending: false }),
        supabase.from('businesses').select('id'),
      ])

      setTemplates(templatesResponse.data || [])
      setSubmissions(submissionsResponse.data || [])
      setBusinessCount((businessesResponse.data || []).length)
      setLoading(false)
    }

    loadDashboardData()
  }, [])

  const latestSubmission = submissions[0]

  const stats = useMemo(
    () => [
      {
        label: 'Активные шаблоны',
        value: templates.length,
      },
      {
        label: 'Сохраненные отчеты',
        value: submissions.length,
      },
      {
        label: 'Записи о бизнесе',
        value: businessCount,
      },
    ],
    [businessCount, submissions.length, templates.length]
  )

  const shortcuts = [
    {
      href: '/form',
      title: 'Открыть мастер налоговой формы',
    },
    {
      href: '/business',
      title: 'Редактировать профиль бизнеса',
    },
    {
      href: '/reports',
      title: 'Просмотреть историю отчетов',
    },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">
              Управляйте профилями, готовьте отчеты и отслеживайте отправки из одной панели управления.
            </h2>
          </div>

          <div className="rounded-[28px] bg-slate-950 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Последняя активность
            </p>
            <p className="mt-4 text-lg font-semibold">
              {latestSubmission ? `Отчет №${latestSubmission.id}` : 'Пока нет сохраненных отчетов'}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              {latestSubmission
                ? `Статус: ${getStatusLabel(latestSubmission.status)}`
                : 'Нет активности'}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {latestSubmission
                ? `Обновлено ${formatDate(latestSubmission.updated_at || latestSubmission.created_at)}`
                : 'Недоступно'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">
              {loading ? '...' : stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {shortcuts.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_70px_rgba(15,23,42,0.1)]"
          >
            <p className="text-lg font-semibold text-slate-950">{item.title}</p>
            <p className="mt-6 text-sm font-medium text-sky-700">
              Открыть страницу
            </p>
          </Link>
        ))}
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">
              Доступные шаблоны отчетов
            </h3>
          </div>
          <Link
            href="/form"
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Начать отчет
          </Link>
        </div>

        <div className="mt-5 grid gap-4">
          {templates.map(template => (
            <div
              key={template.id}
              className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-lg font-semibold text-slate-950">
                  {template.form_code}
                </p>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                  {template.period_type}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {template.title_ru}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
