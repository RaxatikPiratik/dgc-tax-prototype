'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

const fallbackProfile = {
  company_name: 'Sunrise Trade',
  business_type: 'IP',
  bin: '123456789012',
  contact_person: 'Aruzhan Sarsenova',
  phone: '+7 777 123 45 67',
  email: 'demo@business.kz',
  address: 'Kyzylorda, Kazakhstan',
}

const fieldLabels = {
  company_name: 'Название компании',
  business_type: 'Тип бизнеса',
  bin: 'БИН',
  contact_person: 'Контактное лицо',
  phone: 'Телефон',
  email: 'Электронная почта',
  address: 'Адрес',
}

function makeLabel(key) {
  return (
    fieldLabels[key] ||
    key
      .replaceAll('_', ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase())
  )
}

function isEditableValue(value) {
  return ['string', 'number', 'boolean'].includes(typeof value) || value === null
}

function getErrorMessage(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'object') {
    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message
    }

    if (typeof error.details === 'string' && error.details.trim()) {
      return error.details
    }

    if (typeof error.hint === 'string' && error.hint.trim()) {
      return error.hint
    }
  }

  if (typeof error === 'string' && error.trim()) {
    return error
  }

  return fallbackMessage
}

export default function BusinessPage() {
  const [businessRecord, setBusinessRecord] = useState(null)
  const [formState, setFormState] = useState(fallbackProfile)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadBusiness() {
      setLoading(true)
      setErrorMessage('')

      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .order('id', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (error) {
          setErrorMessage(
            getErrorMessage(error, 'Не удалось загрузить профиль бизнеса.')
          )
          return
        }

        if (data) {
          setBusinessRecord(data)
          setFormState(data)
        }
      } catch (error) {
        setErrorMessage(
          getErrorMessage(error, 'Не удалось загрузить профиль бизнеса.')
        )
      } finally {
        setLoading(false)
      }
    }

    loadBusiness()
  }, [])

  const editableKeys = useMemo(() => {
    return Object.keys(formState).filter(key => {
      if (['id', 'created_at', 'updated_at'].includes(key)) {
        return false
      }

      return isEditableValue(formState[key])
    })
  }, [formState])

  function handleChange(key, value) {
    setSuccessMessage('')
    setFormState(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  async function handleSave(event) {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    if (!businessRecord?.id) {
      window.localStorage.setItem('dgc-business-draft', JSON.stringify(formState))
      setSuccessMessage('Данные сохранены локально.')
      setIsSaving(false)
      return
    }

    const updatePayload = editableKeys.reduce((accumulator, key) => {
      accumulator[key] = formState[key]
      return accumulator
    }, {})

    const { error } = await supabase
      .from('businesses')
      .update(updatePayload)
      .eq('id', businessRecord.id)

    if (error) {
      setErrorMessage(
        getErrorMessage(error, 'Не удалось обновить профиль бизнеса.')
      )
      setIsSaving(false)
      return
    }

    setBusinessRecord(prev => ({
      ...prev,
      ...updatePayload,
    }))
    setSuccessMessage('Профиль бизнеса успешно обновлен.')
    setIsSaving(false)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,#ffffff_0%,#f5f9ff_58%,#ebf4ff_100%)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
            ПРОФИЛЬ БИЗНЕСА
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-[2rem]">
            Данные компании и налогоплательщика
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
            Проверьте и обновите реквизиты компании перед заполнением налоговых
            форм и отчетности.
          </p>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-7">
        {errorMessage && (
          <div className="mb-5 rounded-[24px] border border-rose-200 bg-rose-50/90 px-5 py-4 text-sm text-rose-700 shadow-[0_8px_24px_rgba(244,63,94,0.08)]">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-5 rounded-[24px] border border-emerald-200 bg-emerald-50/90 px-5 py-4 text-sm text-emerald-700 shadow-[0_8px_24px_rgba(16,185,129,0.08)]">
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-10 text-sm text-slate-500">
            Загрузка профиля бизнеса...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              {editableKeys.map(key => {
                const value = formState[key]
                const isBoolean = typeof value === 'boolean'
                const isNumber = typeof value === 'number'

                return (
                  <div
                    key={key}
                    className={`space-y-2.5 ${key === 'address' ? 'md:col-span-2' : ''}`}
                  >
                    <label className="block text-sm font-medium text-slate-800">
                      {makeLabel(key)}
                    </label>

                    {isBoolean ? (
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-700 transition hover:border-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={event => handleChange(key, event.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span>{value ? 'Включено' : 'Выключено'}</span>
                      </label>
                    ) : (
                      <input
                        type={isNumber ? 'number' : 'text'}
                        value={value ?? ''}
                        onChange={event =>
                          handleChange(
                            key,
                            isNumber ? Number(event.target.value) : event.target.value
                          )
                        }
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Сохранение...' : 'Сохранить данные'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
