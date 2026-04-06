'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

const fallbackForms = [
  {
    code: 'Форма 910.00',
    description: 'Налоговая отчетность для соответствующего режима',
  },
  {
    code: 'Форма 200.00',
    description: 'Налоговая отчетность для соответствующего режима',
  },
  {
    code: 'Форма 220.00',
    description: 'Налоговая отчетность для соответствующего режима',
  },
]

function formatDate(value) {
  if (!value) {
    return 'Дата недоступна'
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

  useEffect(() => {
    async function loadDashboardData() {
      const [templatesResponse, submissionsResponse] = await Promise.all([
        supabase
          .from('report_templates')
          .select('id,form_code,title_ru')
          .eq('is_active', true),
        supabase
          .from('submissions')
          .select('id,status,created_at,updated_at')
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      setTemplates(templatesResponse.data || [])
      setSubmissions(submissionsResponse.data || [])
    }

    loadDashboardData()
  }, [])

  const availableForms = useMemo(() => {
    if (templates.length > 0) {
      return templates.map(template => ({
        id: template.id,
        code: template.form_code || 'Форма отчетности',
        description:
          template.title_ru ||
          'Налоговая отчетность для соответствующего режима',
      }))
    }

    return fallbackForms.map(form => ({
      id: form.code,
      code: form.code,
      description: form.description,
    }))
  }, [templates])

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,#ffffff_0%,#f2f8ff_55%,#e3f1ff_100%)] p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)] md:p-8">
        <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-cyan-100/80 blur-2xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Создать новый отчет
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Создать налоговый отчет
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
              Выберите форму и начните пошаговое заполнение с автоматической
              проверкой данных.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/form"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Начать отчет
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              Все отчеты
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">
                Последние отчеты
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Здесь будут появляться последние сохраненные и отправленные
                формы.
              </p>
            </div>
            <Link
              href="/reports"
              className="text-sm font-semibold text-sky-700 transition hover:text-sky-800"
            >
              Все отчеты
            </Link>
          </div>

          {submissions.length === 0 ? (
            <div className="mt-8 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8">
              <p className="text-base font-semibold text-slate-900">
                У вас пока нет отчетов
              </p>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Создайте первый отчет, и он появится здесь.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {submissions.map(report => (
                <div
                  key={report.id}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-950">
                        Отчет №{report.id}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Обновлено {formatDate(report.updated_at || report.created_at)}
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      {getStatusLabel(report.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <h3 className="text-xl font-semibold text-slate-950">
            Данные компании
          </h3>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
            Проверьте и обновите реквизиты компании перед заполнением
            отчетности.
          </p>

          <div className="mt-8 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_100%)] p-5">
            <p className="text-sm font-medium text-slate-600">
              Актуальные реквизиты помогают избежать ошибок при заполнении форм
              и ускоряют создание нового отчета.
            </p>
            <Link
              href="/business"
              className="mt-5 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
            >
              Редактировать данные
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">
              Доступные формы отчетности
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Выберите подходящую форму и переходите к заполнению отчета.
            </p>
          </div>
          <Link
            href="/form"
            className="text-sm font-semibold text-sky-700 transition hover:text-sky-800"
          >
            Создать новый отчет
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {availableForms.map(form => (
            <div
              key={form.id}
              className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-lg font-semibold text-slate-950">{form.code}</p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {form.description}
              </p>
              <Link
                href="/form"
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-[0_10px_25px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.1)]"
              >
                Выбрать
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
