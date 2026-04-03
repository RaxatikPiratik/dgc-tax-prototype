'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const statusLabels = {
  draft: 'Черновик',
  submitted: 'Отправлен',
}

function formatDate(value) {
  if (!value) {
    return 'Не указана'
  }

  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusLabel(status) {
  return statusLabels[status] || status || 'Неизвестно'
}

function getStatusClasses(status) {
  if (status === 'submitted') {
    return 'bg-emerald-100 text-emerald-700'
  }

  return 'bg-amber-100 text-amber-700'
}

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    async function loadReports() {
      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          status,
          created_at,
          report_templates (
            form_code,
            title_ru
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        setErrorMessage(error.message || 'Не удалось загрузить отчёты.')
        setReports([])
        setLoading(false)
        return
      }

      setReports(data || [])
      setLoading(false)
    }

    loadReports()
  }, [])

  async function handleDelete(reportId) {
    const shouldDelete = window.confirm('Удалить этот отчёт?')

    if (!shouldDelete) {
      return
    }

    setDeletingId(reportId)
    setErrorMessage('')

    const { error } = await supabase.from('submissions').delete().eq('id', reportId)

    if (error) {
      console.error(error)
      setErrorMessage(error.message || 'Не удалось удалить отчёт.')
      setDeletingId(null)
      return
    }

    setReports(prevReports => prevReports.filter(report => report.id !== reportId))
    setDeletingId(null)
  }

  return (
    <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">
            История отчётов
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Все сохранённые и отправленные отчёты.
          </p>
        </div>

        <Link
          href="/form"
          className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Новый отчёт
        </Link>
      </div>

      {errorMessage && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
        {loading ? (
          <div className="bg-slate-50 px-5 py-10 text-sm text-slate-500">
            Загрузка отчётов...
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
            Пока нет отчётов
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Код формы</th>
                  <th className="px-5 py-4 font-medium">Название</th>
                  <th className="px-5 py-4 font-medium">Дата создания</th>
                  <th className="px-5 py-4 font-medium">Статус</th>
                  <th className="px-5 py-4 font-medium">Действия</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {reports.map(report => (
                  <tr key={report.id} className="text-slate-700">
                    <td className="px-5 py-4 font-medium text-slate-950">
                      {report.report_templates?.form_code || 'Без кода'}
                    </td>
                    <td className="px-5 py-4">
                      {report.report_templates?.title_ru || 'Без названия'}
                    </td>
                    <td className="px-5 py-4">
                      {formatDate(report.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(report.status)}`}
                      >
                        {getStatusLabel(report.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href="/form"
                          className="inline-flex rounded-2xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Открыть
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(report.id)}
                          disabled={deletingId === report.id}
                          className="inline-flex rounded-2xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === report.id ? 'Удаление...' : 'Удалить'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
