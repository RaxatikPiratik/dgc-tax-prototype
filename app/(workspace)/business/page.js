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

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('id', { ascending: true })
        .limit(1)

      if (error) {
        console.error(error)
        setErrorMessage('Не удалось загрузить профиль бизнеса.')
        setLoading(false)
        return
      }

      const firstBusiness = data?.[0] || null

      if (firstBusiness) {
        setBusinessRecord(firstBusiness)
        setFormState(firstBusiness)
      }

      setLoading(false)
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
      console.error(error)
      setErrorMessage('Не удалось обновить профиль бизнеса.')
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
    <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
      <section className="rounded-[32px] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
          Профиль бизнеса
        </p>
        <h2 className="mt-4 text-3xl font-semibold">
          Просмотр и редактирование данных налогоплательщика
        </h2>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        {errorMessage && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-10 text-sm text-slate-500">
            Загрузка профиля бизнеса...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              {editableKeys.map(key => {
                const value = formState[key]
                const isBoolean = typeof value === 'boolean'
                const isNumber = typeof value === 'number'

                return (
                  <div key={key} className={key === 'address' ? 'md:col-span-2' : ''}>
                    <label className="mb-2 block text-sm font-medium text-slate-800">
                      {makeLabel(key)}
                    </label>

                    {isBoolean ? (
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={event => handleChange(key, event.target.checked)}
                        />
                        <span>{value ? 'Включено' : 'Выключено'}</span>
                      </label>
                    ) : (
                      <input
                        type={isNumber ? 'number' : 'text'}
                        value={value ?? ''}
                        onChange={event =>
                          handleChange(key, isNumber ? Number(event.target.value) : event.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Сохранение...' : 'Сохранить данные бизнеса'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
