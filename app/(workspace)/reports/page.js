'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import ContentCard from '@/components/content-card'
import FilterBar from '@/components/filter-bar'
import { supabase } from '@/lib/supabase'

const statusLabels = {
  draft: 'Черновик',
  submitted: 'Отправлен',
}

const filters = [
  'Наименование документа',
  'Номер',
  'Дата',
  'Контрагент',
  'Сотрудник',
  'Статус',
]

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
        setErrorMessage(error.message || 'Не удалось загрузить документы.')
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
    const shouldDelete = window.confirm('Удалить этот документ?')

    if (!shouldDelete) {
      return
    }

    setDeletingId(reportId)
    setErrorMessage('')

    const { error } = await supabase.from('submissions').delete().eq('id', reportId)

    if (error) {
      console.error(error)
      setErrorMessage(error.message || 'Не удалось удалить документ.')
      setDeletingId(null)
      return
    }

    setReports(prevReports => prevReports.filter(report => report.id !== reportId))
    setDeletingId(null)
  }

  return (
    <div className="space-y-5">
      <ContentCard className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[30px] font-semibold tracking-tight text-[#214f79]">
              Исходящие документы
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Просмотр и управление исходящими электронными документами.
            </p>
          </div>

          <Link
            href="/form"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#0f6cab] px-5 text-sm font-semibold text-white transition hover:bg-[#0d5f98]"
          >
            Добавить документ
          </Link>
        </div>
      </ContentCard>

      <FilterBar filters={filters} />

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <ContentCard className="overflow-hidden">
        {loading ? (
          <div className="px-6 py-16 text-sm text-slate-500">
            Загрузка документов...
          </div>
        ) : reports.length === 0 ? (
          <div className="flex min-h-[360px] items-start justify-center px-6 py-14 text-sm text-slate-400">
            Здесь пока нет исходящих документов
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-[#f4f8fb] text-left text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Номер</th>
                  <th className="px-6 py-4 font-medium">Наименование документа</th>
                  <th className="px-6 py-4 font-medium">Дата</th>
                  <th className="px-6 py-4 font-medium">Статус</th>
                  <th className="px-6 py-4 font-medium">Действия</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {reports.map(report => (
                  <tr key={report.id} className="text-slate-700">
                    <td className="px-6 py-4 font-medium text-slate-950">
                      {report.report_templates?.form_code || `DOC-${report.id}`}
                    </td>
                    <td className="px-6 py-4">
                      {report.report_templates?.title_ru || 'Без названия'}
                    </td>
                    <td className="px-6 py-4">
                      {formatDate(report.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(report.status)}`}
                      >
                        {getStatusLabel(report.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
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
      </ContentCard>
    </div>
  )
}
