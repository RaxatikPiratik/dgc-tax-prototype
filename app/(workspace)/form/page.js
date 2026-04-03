'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

function getSectionTitle(section, index) {
  return (
    section.title_ru ||
    section.label_ru ||
    section.name_ru ||
    section.title ||
    section.label ||
    section.name ||
    `Раздел ${index + 1}`
  )
}

function getFieldLabel(field) {
  return (
    field.label_ru ||
    field.label_kz ||
    field.label ||
    field.name ||
    field.code
  )
}

function getFieldPlaceholder(field) {
  return field.placeholder_ru || field.placeholder || field.hint_ru || field.hint || ''
}

function getReadableSupabaseError(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage
  }

  const details = [error.message, error.details, error.hint].filter(Boolean).join(' ')

  return details || fallbackMessage
}

const DEMO_CREATED_BY = 'c444429b-7caf-4eaa-bd9e-a6383970d8ea'
const DEMO_BUSINESS_ID = 1

export default function FormPage() {
  const [sections, setSections] = useState([])
  const [fields, setFields] = useState([])
  const [reportTemplate, setReportTemplate] = useState(null)
  const [values, setValues] = useState({})
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  useEffect(() => {
    async function fetchFormSchema() {
      setLoading(true)
      setErrorMessage('')

      const [sectionsResponse, fieldsResponse, templateResponse] = await Promise.all([
        supabase.from('report_sections').select('*').order('step_no'),
        supabase.from('report_fields').select('*').order('sort_order'),
        supabase
          .from('report_templates')
          .select('id,form_code,title_ru')
          .eq('form_code', '910.00')
          .limit(1)
          .maybeSingle(),
      ])

      if (sectionsResponse.error || fieldsResponse.error || templateResponse.error) {
        console.error(
          sectionsResponse.error || fieldsResponse.error || templateResponse.error
        )
        setErrorMessage('Не удалось загрузить данные формы из Supabase.')
        setLoading(false)
        return
      }

      setSections(sectionsResponse.data || [])
      setFields(fieldsResponse.data || [])
      setReportTemplate(templateResponse.data || null)
      setLoading(false)
    }

    fetchFormSchema()
  }, [])

  const sectionSteps = useMemo(() => {
    return sections
      .map((section, index) => ({
        ...section,
        title: getSectionTitle(section, index),
        fields: fields.filter(field => field.report_section_id === section.id),
      }))
      .filter(section => section.fields.length > 0)
  }, [sections, fields])

  const currentSection = sectionSteps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === sectionSteps.length - 1

  function handleChange(field, rawValue) {
    setSuccessMessage('')

    const nextValue =
      field.data_type === 'number'
        ? rawValue === ''
          ? ''
          : Number(rawValue)
        : rawValue

    setValues(prev => ({
      ...prev,
      [field.code]: nextValue,
    }))
  }

  function goBack() {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  function goNext() {
    setCurrentStep(prev => Math.min(prev + 1, sectionSteps.length - 1))
  }

  function buildSubmissionValueRow(submissionId, field, value) {
    const baseRow = {
      submission_id: submissionId,
      report_field_id: field.id,
    }

    if (field.data_type === 'number') {
      return {
        ...baseRow,
        value_number: value,
      }
    }

    if (field.data_type === 'boolean') {
      return {
        ...baseRow,
        value_boolean: value,
      }
    }

    return {
      ...baseRow,
      value_text: value,
    }
  }

  async function handleSaveDraft() {
    setIsSavingDraft(true)
    setErrorMessage('')
    setSuccessMessage('')

    if (!reportTemplate?.id) {
      console.error('[handleSaveDraft] Missing required submissions field: report_template_id', {
        reportTemplate,
      })
      setErrorMessage('Не удалось сохранить черновик: не найден обязательный шаблон отчёта.')
      setIsSavingDraft(false)
      return
    }

    const today = new Date().toISOString().slice(0, 10)

    const { data: reportingPeriod, error: reportingPeriodError } = await supabase
      .from('reporting_periods')
      .select('id,year,period_type,period_no,start_date,end_date')
      .lte('start_date', today)
      .gte('end_date', today)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (reportingPeriodError) {
      console.error('[handleSaveDraft] reporting period error', reportingPeriodError)
      setErrorMessage(
        getReadableSupabaseError(
          reportingPeriodError,
          'Не удалось определить отчётный период для сохранения черновика.'
        )
      )
      setIsSavingDraft(false)
      return
    }

    if (!reportingPeriod?.id) {
      console.error('[handleSaveDraft] Missing required submissions field: reporting_period_id', {
        today,
        reportingPeriod,
      })
      setErrorMessage('Не удалось сохранить черновик: не найден действующий отчётный период.')
      setIsSavingDraft(false)
      return
    }

    const submissionPayload = {
      created_by: DEMO_CREATED_BY,
      business_id: DEMO_BUSINESS_ID,
      status: 'draft',
      report_template_id: reportTemplate.id,
      reporting_period_id: reportingPeriod.id,
    }

    console.log('submission payload', submissionPayload)
    console.log('[handleSaveDraft] submissions insert payload:', submissionPayload)

    try {
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .insert(submissionPayload)
        .select('id')
        .single()

      if (submissionError) {
        console.log('submission error', submissionError)
        console.error('[handleSaveDraft] Supabase submission insert error:', submissionError)
        setErrorMessage(
          getReadableSupabaseError(
            submissionError,
            'Не удалось сохранить черновик в таблицу submissions.'
          )
        )
        return
      }

      if (!submission?.id) {
        console.error('[handleSaveDraft] Submission row was not returned after insert.', {
          submission,
        })
        setErrorMessage('Черновик не сохранён: после создания записи не был получен идентификатор.')
        return
      }

      console.log('created submission', submission)

      const submissionRows = fields
        .filter(field => Object.hasOwn(values, field.code))
        .map(field =>
          buildSubmissionValueRow(submission.id, field, values[field.code])
        )

      if (submissionRows.length > 0) {
        console.log('values payload', submissionRows)
        console.log('[handleSaveDraft] submission_values insert payload:', submissionRows)

        const { error: valuesError } = await supabase
          .from('submission_values')
          .insert(submissionRows)

        if (valuesError) {
          console.log('values error', valuesError)
          console.error('[handleSaveDraft] Supabase submission_values insert error:', valuesError)
          setErrorMessage(
            getReadableSupabaseError(
              valuesError,
              'Черновик создан, но не удалось сохранить значения полей.'
            )
          )
          return
        }
      }

      setSuccessMessage('Черновик сохранён')
    } catch (unexpectedError) {
      console.error('[handleSaveDraft] Unexpected error:', unexpectedError)
      setErrorMessage('Произошла непредвиденная ошибка при сохранении черновика.')
    } finally {
      setIsSavingDraft(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-[32px] border border-white/70 bg-white/90 px-6 py-12 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm text-slate-600">Загрузка формы...</p>
      </div>
    )
  }

  if (errorMessage && sectionSteps.length === 0) {
    return (
      <div className="rounded-[32px] border border-white/70 bg-white/90 px-6 py-12 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      </div>
    )
  }

  if (sectionSteps.length === 0) {
    return (
      <div className="rounded-[32px] border border-white/70 bg-white/90 px-6 py-12 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Разделы формы не найдены.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
        <p className="text-sm font-medium text-sky-300">
          Форма {currentStep + 1} из {sectionSteps.length}
        </p>
        <h2 className="mt-3 text-3xl font-semibold">
          Мастер налоговой формы 910.00
        </h2>
      </section>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-950 transition-all"
          style={{
            width: `${((currentStep + 1) / sectionSteps.length) * 100}%`,
          }}
        />
      </div>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-slate-950">
            {currentSection.title}
          </h3>
        </div>

        <div className="space-y-5">
          {currentSection.fields.map(field => (
            <div key={field.id}>
              <label
                className="mb-2 block text-sm font-medium text-slate-800"
                htmlFor={field.code}
              >
                {getFieldLabel(field)}
              </label>

              {field.data_type === 'boolean' ? (
                <label className="flex items-center gap-3 rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700">
                  <input
                    id={field.code}
                    type="checkbox"
                    checked={Boolean(values[field.code])}
                    onChange={event =>
                      handleChange(field, event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span>{getFieldPlaceholder(field) || 'Да / Нет'}</span>
                </label>
              ) : (
                <input
                  id={field.code}
                  type={
                    field.data_type === 'number'
                      ? 'number'
                      : field.data_type === 'date'
                        ? 'date'
                        : 'text'
                  }
                  value={values[field.code] ?? ''}
                  onChange={event => handleChange(field, event.target.value)}
                  placeholder={getFieldPlaceholder(field)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={isFirstStep}
              className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Назад
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="rounded-2xl border border-slate-900 px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingDraft ? 'Сохранение...' : 'Сохранить черновик'}
            </button>
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={isLastStep}
            className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLastStep ? 'Последний раздел' : 'Далее'}
          </button>
        </div>
      </section>
    </div>
  )
}
