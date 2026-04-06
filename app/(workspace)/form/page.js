'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

const steps = [
  { id: 1, label: 'Бизнес' },
  { id: 2, label: 'Режим' },
  { id: 3, label: 'Период' },
  { id: 4, label: 'Данные' },
  { id: 5, label: 'Результат' },
]

const months = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

const fallbackTaxRegimes = [
  { id: 'fallback-simplified', name_ru: 'Упрощённый' },
  { id: 'fallback-general', name_ru: 'Общеустановленный' },
]

function getFieldLabel(field) {
  return field.label_ru || field.label || field.code || 'Поле'
}

function getFieldPlaceholder(field) {
  return (
    field.placeholder_ru ||
    field.placeholder ||
    field.hint_ru ||
    field.hint ||
    ''
  )
}

function getFieldOptions(field) {
  if (Array.isArray(field.options)) {
    return field.options
  }

  if (Array.isArray(field.options_ru)) {
    return field.options_ru
  }

  if (typeof field.options === 'string') {
    return field.options
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  }

  if (typeof field.options_ru === 'string') {
    return field.options_ru
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  }

  return []
}

function normalizeBusinessType(value) {
  if (!value) {
    return ''
  }

  const normalized = String(value).trim().toUpperCase()

  if (normalized === 'ИП' || normalized === 'IP') {
    return 'IP'
  }

  if (normalized === 'ТОО' || normalized === 'TOO' || normalized === 'LLP') {
    return 'LLP'
  }

  return normalized
}

function normalizePeriodType(value) {
  if (!value) {
    return ''
  }

  const normalized = String(value).trim().toUpperCase()

  if (normalized === 'QUARTER' || normalized === 'YEAR' || normalized === 'MONTH') {
    return normalized
  }

  return normalized
}

function logSupabaseError(label, error, response) {
  console.error(`${label} raw error object:`, error)
  console.error(`${label} JSON.stringify(error, null, 2):`, JSON.stringify(error, null, 2))
  console.error(`${label} error.message:`, error?.message)
  console.error(`${label} error.details:`, error?.details)
  console.error(`${label} error.hint:`, error?.hint)
  console.error(`${label} error.code:`, error?.code)
  console.error(`${label} error.status:`, error?.status)
  console.error(`${label} full Supabase response:`, response)
}

function isTemplateBusinessTypeMatch(templateBusinessType, selectedBusinessType) {
  if (!templateBusinessType) {
    return true
  }

  const normalizedTemplate = normalizeBusinessType(templateBusinessType)
  const normalizedSelected = normalizeBusinessType(selectedBusinessType)

  return (
    normalizedTemplate === normalizedSelected ||
    normalizedTemplate === 'BOTH' ||
    normalizedTemplate === 'ALL'
  )
}

function compareTemplates(a, b, selectedBusinessType) {
  const aExact = normalizeBusinessType(a.business_type) === normalizeBusinessType(selectedBusinessType)
  const bExact = normalizeBusinessType(b.business_type) === normalizeBusinessType(selectedBusinessType)

  if (aExact !== bExact) {
    return aExact ? -1 : 1
  }

  return 0
}

function getDefaultFieldValue(field) {
  if (field.data_type === 'boolean') {
    return false
  }

  return ''
}

function Stepper({ currentStep }) {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      {steps.map(step => {
        const isActive = currentStep === step.id
        const isCompleted = currentStep > step.id

        return (
          <div
            key={step.id}
            className={`rounded-2xl border px-4 py-3 transition ${
              isActive
                ? 'border-sky-500 bg-sky-50'
                : isCompleted
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  isActive
                    ? 'bg-sky-500 text-white'
                    : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-slate-500'
                }`}
              >
                {step.id}
              </span>
              <span
                className={`text-sm font-medium ${
                  isActive || isCompleted ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FieldShell({ label, children, error, required = false }) {
  return (
    <label className="space-y-2.5">
      <span className="block text-sm font-medium text-slate-800">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      {children}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </label>
  )
}

function SelectField({ label, value, onChange, options, error, required = false }) {
  return (
    <FieldShell label={label} error={error} required={required}>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
      >
        <option value="">Выберите</option>
        {options.map(option => {
          const normalizedOption =
            typeof option === 'string'
              ? { value: option, label: option }
              : {
                  value: String(option.value ?? option.id ?? option.code ?? ''),
                  label: option.label ?? option.name_ru ?? option.name ?? String(option.value ?? ''),
                }

          return (
            <option key={normalizedOption.value} value={normalizedOption.value}>
              {normalizedOption.label}
            </option>
          )
        })}
      </select>
    </FieldShell>
  )
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  error,
  placeholder = '',
  required = false,
}) {
  return (
    <FieldShell label={label} error={error} required={required}>
      <input
        type={type}
        min={type === 'number' ? '0' : undefined}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white"
      />
    </FieldShell>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  )
}

export default function FormPage() {
  const currentDate = new Date()
  const currentMonthIndex = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => String(currentYear - 3 + i))

  const [step, setStep] = useState(1)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [taxRegimes, setTaxRegimes] = useState(fallbackTaxRegimes)
  const [isLoadingRegimes, setIsLoadingRegimes] = useState(true)
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templateFields, setTemplateFields] = useState([])
  const [templateWarning, setTemplateWarning] = useState('')
  const [formData, setFormData] = useState({
    businessType: '',
    taxRegimeId: '',
    taxRegimeName: '',
    year: String(currentYear),
    month: months[currentMonthIndex],
    dynamicFieldValues: {},
    dynamicFieldErrors: {},
  })

  useEffect(() => {
    async function loadRegimes() {
      const selectedBusinessType = normalizeBusinessType(formData.businessType)
      const loadRegimesQueryInput = {
        schema: 'public',
        table: 'tax_regimes',
        select: 'id, code, name_ru, name_kk, allowed_business_type, is_active',
        is_active: true,
        selectedBusinessType,
      }

      setIsLoadingRegimes(true)

      console.log('[loadRegimes] query input:', loadRegimesQueryInput)

      const { data, error } = await supabase
        .schema('public')
        .from('tax_regimes')
        .select('id, code, name_ru, name_kk, allowed_business_type, is_active')
        .eq('is_active', true)

      console.log('[loadRegimes] selected business type:', selectedBusinessType)
      console.log('[loadRegimes] Supabase response:', { data, error })
      console.log('[loadRegimes] returned data:', data)

      if (error) {
        logSupabaseError('[loadRegimes] tax_regimes error', error, { data, error })
        setErrorMessage(prev =>
          prev || 'Не удалось загрузить налоговые режимы. Можно использовать форму с ограниченным набором вариантов.'
        )
        setTaxRegimes(fallbackTaxRegimes)
        setIsLoadingRegimes(false)
        return
      }

      const filteredData = (data || []).filter(item => {
        const allowedBusinessType = normalizeBusinessType(item.allowed_business_type)

        if (!selectedBusinessType) {
          return true
        }

        return (
          allowedBusinessType === selectedBusinessType ||
          allowedBusinessType === 'BOTH'
        )
      })

      const regimes = filteredData.map(item => ({
        ...item,
        id: String(item.id),
        name_ru: item.name_ru || `Режим ${item.id}`,
      }))

      console.log('[loadRegimes] final mapped regimes:', regimes)

      setTaxRegimes(regimes.length > 0 ? regimes : fallbackTaxRegimes)
      setIsLoadingRegimes(false)
    }

    loadRegimes()
  }, [formData.businessType])

  useEffect(() => {
    async function loadTemplateAndFields() {
      if (!formData.businessType || !formData.taxRegimeId || !formData.year || !formData.month) {
        setSelectedTemplate(null)
        setTemplateFields([])
        setTemplateWarning('')
        setFormData(prev => ({
          ...prev,
          dynamicFieldValues: {},
          dynamicFieldErrors: {},
        }))
        return
      }

      setIsLoadingTemplate(true)
      setTemplateWarning('')

      const template = await findMatchingTemplate({
        businessType: formData.businessType,
        taxRegimeId: formData.taxRegimeId,
        periodType: 'QUARTER',
      })

      if (!template) {
        setSelectedTemplate(null)
        setTemplateFields([])
        setTemplateWarning('Подходящая форма не найдена для выбранных параметров.')
        setFormData(prev => ({
          ...prev,
          dynamicFieldValues: {},
          dynamicFieldErrors: {},
        }))
        setIsLoadingTemplate(false)
        return
      }

      setSelectedTemplate(template)

      const fields = await loadTemplateFields(template.id)
      setTemplateFields(fields)

      if (fields.length === 0) {
        setTemplateWarning('Для выбранной формы пока не настроены поля.')
      }

      setFormData(prev => {
        const nextValues = {}

        fields.forEach(field => {
          nextValues[field.code] =
            prev.dynamicFieldValues[field.code] ?? getDefaultFieldValue(field)
        })

        return {
          ...prev,
          dynamicFieldValues: nextValues,
          dynamicFieldErrors: {},
        }
      })

      setIsLoadingTemplate(false)
    }

    loadTemplateAndFields()
  }, [formData.businessType, formData.taxRegimeId, formData.year, formData.month])

  const reportingPeriod = useMemo(() => {
    if (!formData.month || !formData.year) {
      return 'Не выбран'
    }

    return `${formData.month} ${formData.year}`
  }, [formData.month, formData.year])

  const periodCode = useMemo(() => {
    if (!formData.month || !formData.year) {
      return ''
    }

    return `${formData.year}-${String(months.indexOf(formData.month) + 1).padStart(2, '0')}`
  }, [formData.month, formData.year])

  const numericSummary = useMemo(() => {
    return templateFields.reduce((total, field) => {
      if (field.data_type !== 'number') {
        return total
      }

      const value = Number(formData.dynamicFieldValues[field.code])
      return total + (Number.isFinite(value) ? value : 0)
    }, 0)
  }, [formData.dynamicFieldValues, templateFields])

  function updateFormData(key, value) {
    setSuccessMessage('')
    setValidationErrors(prev => ({
      ...prev,
      [key]: '',
    }))
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  function updateDynamicField(field, value) {
    setSuccessMessage('')
    setFormData(prev => ({
      ...prev,
      dynamicFieldValues: {
        ...prev.dynamicFieldValues,
        [field.code]: value,
      },
      dynamicFieldErrors: {
        ...prev.dynamicFieldErrors,
        [field.code]: '',
      },
    }))
  }

  async function findMatchingTemplate({ businessType, taxRegimeId, periodType }) {
    const normalizedTaxRegimeId = Number(taxRegimeId)
    const normalizedPeriodType = normalizePeriodType(periodType)
    const normalizedBusinessType = normalizeBusinessType(businessType)
    const tax_regime_id = Number.isFinite(normalizedTaxRegimeId)
      ? normalizedTaxRegimeId
      : taxRegimeId
    const period_type = normalizedPeriodType
    const business_type = normalizedBusinessType

    console.log('Matching params:', {
      tax_regime_id,
      period_type,
      business_type,
    })

    console.log('[findMatchingTemplate] exact query input:', {
      table: 'report_templates',
      tax_regime_id,
      period_type,
      business_type,
      is_active: true,
    })

    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .eq('tax_regime_id', tax_regime_id)
      .eq('period_type', period_type)
      .eq('business_type', business_type)
      .eq('is_active', true)

    console.log('[findMatchingTemplate] exact Supabase response:', { data, error })

    if (error) {
      logSupabaseError('[findMatchingTemplate] report_templates error', error, { data, error })
      setErrorMessage(prev =>
        prev || 'Не удалось загрузить данные формы из Supabase.'
      )
      return null
    }

    const exactTemplate = (data || [])[0] || null

    if (exactTemplate) {
      console.log('[findMatchingTemplate] chosen template:', exactTemplate)
      return exactTemplate
    }

    console.log('[findMatchingTemplate] BOTH query input:', {
      table: 'report_templates',
      tax_regime_id,
      period_type,
      business_type: 'BOTH',
      is_active: true,
    })

    const fallbackResponse = await supabase
      .from('report_templates')
      .select('*')
      .eq('tax_regime_id', tax_regime_id)
      .eq('period_type', period_type)
      .eq('business_type', 'BOTH')
      .eq('is_active', true)

    console.log('[findMatchingTemplate] BOTH Supabase response:', {
      data: fallbackResponse.data,
      error: fallbackResponse.error,
    })

    if (fallbackResponse.error) {
      logSupabaseError(
        '[findMatchingTemplate] report_templates fallback error',
        fallbackResponse.error,
        fallbackResponse
      )
      setErrorMessage(prev =>
        prev || 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РґР°РЅРЅС‹Рµ С„РѕСЂРјС‹ РёР· Supabase.'
      )
      return null
    }

    const fallbackTemplate = (fallbackResponse.data || [])[0] || null

    if (fallbackTemplate) {
      console.log('Fallback to BOTH template')
    }

    console.log('[findMatchingTemplate] chosen template:', fallbackTemplate)

    return fallbackTemplate
  }

  async function loadTemplateFields(templateId) {
    const { data, error } = await supabase
      .from('report_fields')
      .select('*')
      .eq('report_template_id', templateId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error(error)
      setErrorMessage(prev =>
        prev || 'Не удалось загрузить данные формы из Supabase.'
      )
      return []
    }

    return data || []
  }

  function validateDynamicFields() {
    const nextErrors = {}

    templateFields.forEach(field => {
      const value = formData.dynamicFieldValues[field.code]
      const stringValue = typeof value === 'string' ? value.trim() : value

      if (field.is_required) {
        const isEmpty =
          value === undefined ||
          value === null ||
          stringValue === '' ||
          (field.data_type === 'boolean' && value === false)

        if (isEmpty) {
          nextErrors[field.code] = 'Заполните обязательное поле.'
          return
        }
      }

      if (field.data_type === 'number' && value !== '' && value !== null && value !== undefined) {
        const numberValue = Number(value)

        if (!Number.isFinite(numberValue)) {
          nextErrors[field.code] = 'Введите корректное числовое значение.'
        }
      }
    })

    setFormData(prev => ({
      ...prev,
      dynamicFieldErrors: nextErrors,
    }))

    return Object.keys(nextErrors).length === 0
  }

  function validateStep(currentStep) {
    const nextErrors = {}

    if (currentStep === 1 && !formData.businessType) {
      nextErrors.businessType = 'Выберите тип бизнеса.'
    }

    if (currentStep === 2 && !formData.taxRegimeId) {
      nextErrors.taxRegimeId = 'Выберите налоговый режим.'
    }

    if (currentStep === 3) {
      if (!formData.year) {
        nextErrors.year = 'Выберите год.'
      }

      if (!formData.month) {
        nextErrors.month = 'Выберите месяц.'
      }
    }

    setValidationErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return false
    }

    if (currentStep === 4) {
      return validateDynamicFields()
    }

    return true
  }

  function handleNext() {
    if (!validateStep(step)) {
      return
    }

    setStep(prev => Math.min(prev + 1, steps.length))
  }

  function handleBack() {
    setValidationErrors({})
    setStep(prev => Math.max(prev - 1, 1))
  }

  function handleFinish() {
    setSuccessMessage(
      'Форма подготовлена. Следующим шагом можно подключить сохранение и отправку.'
    )
  }

  function renderDynamicField(field) {
    const label = getFieldLabel(field)
    const placeholder = getFieldPlaceholder(field)
    const error = formData.dynamicFieldErrors[field.code]
    const value = formData.dynamicFieldValues[field.code]
    const required = Boolean(field.is_required)

    if (field.data_type === 'boolean') {
      return (
        <div key={field.id || field.code} className="space-y-2.5">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-700 transition hover:border-slate-300">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={event => updateDynamicField(field, event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span>
              {label}
              {required ? <span className="ml-1 text-rose-500">*</span> : null}
            </span>
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
      )
    }

    if (field.data_type === 'select') {
      return (
        <SelectField
          key={field.id || field.code}
          label={label}
          value={String(value ?? '')}
          onChange={nextValue => updateDynamicField(field, nextValue)}
          options={getFieldOptions(field)}
          error={error}
          required={required}
        />
      )
    }

    const type =
      field.data_type === 'number'
        ? 'number'
        : field.data_type === 'date'
          ? 'date'
          : 'text'

    return (
      <InputField
        key={field.id || field.code}
        label={label}
        type={type}
        value={String(value ?? '')}
        onChange={nextValue => updateDynamicField(field, nextValue)}
        error={error}
        required={required}
        placeholder={placeholder}
      />
    )
  }

  function renderStepContent() {
    if (step === 1) {
      return (
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField
            label="Тип бизнеса"
            value={formData.businessType}
            onChange={value => updateFormData('businessType', value)}
            options={['ИП', 'ТОО']}
            error={validationErrors.businessType}
            required
          />
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField
            label="Режим"
            value={formData.taxRegimeId}
            onChange={value => {
              const selectedRegime = taxRegimes.find(item => String(item.id) === value)
              setSelectedTemplate(null)
              setTemplateFields([])
              setTemplateWarning('')
              updateFormData('taxRegimeId', value)
              updateFormData('taxRegimeName', selectedRegime?.name_ru || '')
            }}
            options={taxRegimes.map(item => ({
              value: String(item.id),
              label: item.name_ru,
            }))}
            error={validationErrors.taxRegimeId}
            required
          />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            {isLoadingRegimes
              ? 'Загрузка налоговых режимов...'
              : 'Выберите режим, который подходит для текущего бизнеса.'}
          </div>
        </div>
      )
    }

    if (step === 3) {
      return (
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <SelectField
              label="Год"
              value={formData.year}
              onChange={value => updateFormData('year', value)}
              options={years}
              error={validationErrors.year}
              required
            />
            <SelectField
              label="Месяц"
              value={formData.month}
              onChange={value => updateFormData('month', value)}
              options={months}
              error={validationErrors.month}
              required
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Выбранный период
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {reportingPeriod}
            </p>
          </div>
        </div>
      )
    }

    if (step === 4) {
      if (isLoadingTemplate) {
        return (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-10 text-sm text-slate-500">
            Загрузка структуры формы...
          </div>
        )
      }

      return (
        <div className="space-y-5">
          {selectedTemplate ? (
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Форма {selectedTemplate.form_code || 'Без кода'}
              </p>
              <h4 className="mt-2 text-xl font-semibold text-slate-950">
                {selectedTemplate.title_ru || selectedTemplate.title || 'Налоговая форма'}
              </h4>
            </div>
          ) : null}

          {templateWarning ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-5 py-4 text-sm text-amber-700">
              {templateWarning}
            </div>
          ) : null}

          {selectedTemplate && templateFields.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {templateFields.map(field => renderDynamicField(field))}
            </div>
          ) : null}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <SummaryRow label="Тип бизнеса" value={formData.businessType || 'Не выбран'} />
          <SummaryRow label="Налоговый режим" value={formData.taxRegimeName || 'Не выбран'} />
          <SummaryRow label="Период" value={reportingPeriod} />
          <SummaryRow
            label="Форма"
            value={
              selectedTemplate
                ? `${selectedTemplate.form_code || 'Без кода'}`
                : 'Не найдена'
            }
          />
        </div>

        {selectedTemplate ? (
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Название формы</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {selectedTemplate.title_ru || selectedTemplate.title || 'Налоговая форма'}
            </p>
          </div>
        ) : null}

        <div className="space-y-3">
          {templateFields.length > 0 ? (
            templateFields.map(field => {
              const rawValue = formData.dynamicFieldValues[field.code]
              const displayValue =
                typeof rawValue === 'boolean'
                  ? rawValue
                    ? 'Да'
                    : 'Нет'
                  : rawValue === '' || rawValue === undefined || rawValue === null
                    ? 'Не заполнено'
                    : String(rawValue)

              return (
                <SummaryRow
                  key={field.id || field.code}
                  label={getFieldLabel(field)}
                  value={displayValue}
                />
              )
            })
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              Для выбранной формы пока нет введённых данных.
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Статус проверки</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              Готово к предварительной валидации
            </p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Итоговое значение</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {numericSummary.toLocaleString('ru-RU')} ₸
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,#ffffff_0%,#f5f9ff_58%,#ebf4ff_100%)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
            МАСТЕР НАЛОГОВОЙ ФОРМЫ
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-[2rem]">
            Создание и заполнение налоговой формы
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
            Пройдите шаги последовательно, чтобы собрать данные для налоговой формы
            и получить итоговый расчёт.
          </p>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50/90 px-5 py-4 text-sm text-rose-700 shadow-[0_8px_24px_rgba(244,63,94,0.08)]">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/90 px-5 py-4 text-sm text-emerald-700 shadow-[0_8px_24px_rgba(16,185,129,0.08)]">
          {successMessage}
        </div>
      ) : null}

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-7">
        <Stepper currentStep={step} />
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-7">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Шаг {step} из {steps.length}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              {steps[step - 1].label}
            </h3>
          </div>

          {renderStepContent()}

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Назад
            </button>

            {step === steps.length ? (
              <button
                type="button"
                onClick={handleFinish}
                className="rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Завершить
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Далее
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
