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

  if (normalized === 'ИП' || normalized === 'IP' || normalized === 'IE') {
    return 'IE'
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

function getSupabaseErrorMessage(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage
  }

  if (typeof error.message === 'string' && error.message.trim()) {
    if (error.message.includes('Failed to fetch')) {
      return 'Не удалось подключиться к Supabase. Проверьте интернет, URL проекта и настройки доступа.'
    }

    return error.message
  }

  if (typeof error.details === 'string' && error.details.trim()) {
    return error.details
  }

  if (typeof error.hint === 'string' && error.hint.trim()) {
    return error.hint
  }

  return fallbackMessage
}

function logSupabaseError(label, error, response) {
  return {
    label,
    message: getSupabaseErrorMessage(error, 'Supabase request failed.'),
    details: typeof error?.details === 'string' ? error.details : '',
    hint: typeof error?.hint === 'string' ? error.hint : '',
    code: typeof error?.code === 'string' ? error.code : '',
    hasResponse: Boolean(response),
  }
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

const FORM_910_FIELD_ORDER = [
  'tax_year',
  'tax_quarter',
  'taxpayer_name',
  'taxpayer_identifier',
  'income_total',
  'calculated_tax',
  'confirm_accuracy',
]

const FORM_910_SECTION_ORDER = [
  {
    key: 'base',
    title: 'Основные данные',
    codes: ['tax_year', 'tax_quarter', 'taxpayer_name', 'taxpayer_identifier'],
  },
  {
    key: 'income',
    title: 'Доход',
    codes: ['income_total'],
  },
  {
    key: 'calculation',
    title: 'Расчет',
    codes: ['calculated_tax', 'confirm_accuracy'],
  },
]

function isForm910(template) {
  return template?.form_code === '910.00'
}

function parseNumberValue(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const normalized = String(value).replace(',', '.').trim()

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function calculateSimplifiedTax(incomeTotal) {
  const parsedIncome = parseNumberValue(incomeTotal)

  if (parsedIncome === null) {
    return ''
  }

  return (parsedIncome * 0.03).toFixed(2)
}

function getVisibleTemplateFields(template, fields) {
  if (!isForm910(template)) {
    return fields
  }

  const allowedCodes = new Set(FORM_910_FIELD_ORDER)
  const fieldMap = new Map()

  fields.forEach(field => {
    if (!allowedCodes.has(field.code) || fieldMap.has(field.code)) {
      return
    }

    fieldMap.set(field.code, field)
  })

  return FORM_910_FIELD_ORDER.map((code, index) => {
    const field = fieldMap.get(code)

    if (!field) {
      return null
    }

    const section = FORM_910_SECTION_ORDER.find(item => item.codes.includes(code))

    return {
      ...field,
      sort_order: index + 1,
      section_key: section?.key || field.section_key || '',
      section_title: section?.title || field.section_title || '',
      section_sort_order:
        (section ? FORM_910_SECTION_ORDER.findIndex(item => item.key === section.key) + 1 : 0) ||
        field.section_sort_order ||
        0,
    }
  }).filter(Boolean)
}

function groupTemplateFields(template, fields) {
  if (fields.length === 0) {
    return []
  }

  if (isForm910(template)) {
    return FORM_910_SECTION_ORDER.map((section, index) => ({
      key: section.key,
      title: section.title,
      sortOrder: index + 1,
      fields: fields.filter(field => section.codes.includes(field.code)),
    })).filter(section => section.fields.length > 0)
  }

  const grouped = new Map()

  fields.forEach(field => {
    const sectionKey = field.section_key || String(field.report_section_id || 'default')

    if (!grouped.has(sectionKey)) {
      grouped.set(sectionKey, {
        key: sectionKey,
        title: field.section_title || 'Данные формы',
        sortOrder: field.section_sort_order || 0,
        fields: [],
      })
    }

    grouped.get(sectionKey).fields.push(field)
  })

  return Array.from(grouped.values()).sort((a, b) => a.sortOrder - b.sortOrder)
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
  readOnly = false,
}) {
  return (
    <FieldShell label={label} error={error} required={required}>
      <input
        type={type}
        min={type === 'number' ? '0' : undefined}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`h-12 w-full rounded-2xl border px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 ${
          readOnly
            ? 'border-slate-200 bg-slate-100 text-slate-500'
            : 'border-slate-200 bg-slate-50 focus:border-sky-500 focus:bg-white'
        }`}
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

function generateForm910HTML(formData, selectedTemplate) {
  const v = formData.dynamicFieldValues
  const identifier = String(v.taxpayer_identifier || '').padEnd(12, ' ')
  const name = v.taxpayer_name || ''
  const year = v.tax_year || ''
  const quarter = v.tax_quarter || ''
  const income = v.income_total != null && v.income_total !== ''
    ? Number(v.income_total).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0,00'
  const tax = v.calculated_tax != null && v.calculated_tax !== ''
    ? Number(v.calculated_tax).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0,00'
  const businessType = formData.businessType === 'ИП' || formData.businessType === 'IE' ? 'ИП' : 'ТОО'
  const today = new Date().toLocaleDateString('ru-RU')

  const iinBoxes = Array.from({ length: 12 }, (_, i) =>
    `<div class="iin-box">${identifier[i]?.trim() || ''}</div>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Форма 910.00</title>
<style>
  @page { size: A4 portrait; margin: 15mm 15mm 12mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; background: #fff; }
  .form-code { text-align: right; font-size: 8pt; margin-bottom: 2px; }
  .title { text-align: center; font-weight: bold; font-size: 11pt; text-transform: uppercase; margin-bottom: 1px; }
  .subtitle { text-align: center; font-size: 9pt; margin-bottom: 6px; }
  .instructions { font-size: 7.5pt; line-height: 1.4; border: 1px solid #000; padding: 4px 6px; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #000; padding: 3px 5px; font-size: 8.5pt; vertical-align: top; }
  .section-header td { background: #c0c0c0; text-align: center; font-weight: bold; font-size: 9pt; padding: 4px; }
  .row-num { width: 28px; text-align: center; font-weight: bold; vertical-align: middle; font-size: 9pt; }
  .iin-row { display: flex; gap: 2px; margin-top: 5px; }
  .iin-box { width: 20px; height: 20px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10pt; }
  .underline { border-bottom: 1px solid #000; min-height: 18px; font-weight: bold; font-size: 10pt; padding: 1px 2px; margin-top: 4px; }
  .code-col { width: 80px; text-align: center; font-weight: bold; font-size: 8pt; vertical-align: middle; }
  .amount-col { width: 140px; text-align: right; font-weight: bold; font-size: 10.5pt; vertical-align: middle; }
  .bold-val { font-weight: bold; font-size: 10.5pt; }
  .sig-block { margin-top: 14px; border: 1px solid #000; padding: 8px 10px; }
  .footer-note { margin-top: 8px; font-size: 7.5pt; text-align: center; color: #444; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="form-code">форма 910.00 стр. 1</div>
<div class="title">Упрощённая декларация для субъектов малого бизнеса</div>
<div class="subtitle">(Форма 910.00)</div>
<div class="instructions">
  Прочитайте Правила составления налоговой отчётности «Упрощённая декларация для субъектов малого бизнеса».<br>
  ВНИМАНИЕ! Заполнять шариковой или перьевой ручкой, ЧЁРНЫМИ или СИНИМИ чернилами, ЗАГЛАВНЫМИ ПЕЧАТНЫМИ символами.
</div>

<table>
  <tr class="section-header"><td colspan="2">Раздел. Общая информация о налогоплательщике (налоговом агенте)</td></tr>

  <tr>
    <td class="row-num">1</td>
    <td>
      <div style="font-size:8pt">ИИН (БИН)</div>
      <div class="iin-row">${iinBoxes}</div>
    </td>
  </tr>

  <tr>
    <td class="row-num">2</td>
    <td>
      <div style="font-size:8pt">Фамилия, имя, отчество (при его наличии) или наименование налогоплательщика</div>
      <div class="underline">${name}</div>
    </td>
  </tr>

  <tr>
    <td class="row-num">3</td>
    <td>
      <div style="font-size:8pt">Налоговый период, за который представляется налоговая отчётность:</div>
      <div style="margin-top:5px;display:flex;gap:30px;align-items:center">
        <span>Год:&nbsp;<span class="bold-val">${year}</span></span>
        <span>Квартал:&nbsp;<span class="bold-val">${quarter}</span></span>
      </div>
    </td>
  </tr>

  <tr>
    <td class="row-num">4</td>
    <td>
      <div style="font-size:8pt">Отдельные категории налогоплательщика (укажите X в соответствующей ячейке):</div>
      <div style="margin-top:4px;display:flex;gap:20px">
        <span><strong>[&nbsp;&nbsp;]</strong>&nbsp;A — ведёт бухгалтерский учёт</span>
        <span><strong>[&nbsp;&nbsp;]</strong>&nbsp;B — не ведёт бухгалтерский учёт</span>
      </div>
    </td>
  </tr>

  <tr>
    <td class="row-num">5</td>
    <td>
      <div style="font-size:8pt">Плательщик единого платежа (укажите X в ячейке):</div>
      <div style="margin-top:4px"><strong>[&nbsp;&nbsp;]</strong></div>
    </td>
  </tr>

  <tr>
    <td class="row-num">6</td>
    <td>
      <div style="font-size:8pt">Вид декларации (укажите X в соответствующей ячейке):</div>
      <div style="margin-top:4px;display:flex;gap:20px">
        <span><strong>[X]</strong>&nbsp;первоначальная</span>
        <span><strong>[&nbsp;&nbsp;]</strong>&nbsp;очередная</span>
        <span><strong>[&nbsp;&nbsp;]</strong>&nbsp;дополнительная</span>
        <span><strong>[&nbsp;&nbsp;]</strong>&nbsp;ликвидационная</span>
      </div>
    </td>
  </tr>

  <tr>
    <td class="row-num">9</td>
    <td>
      <div style="font-size:8pt">Тип налогоплательщика:</div>
      <div style="margin-top:4px"><span class="bold-val">${businessType}</span></div>
    </td>
  </tr>

  <tr class="section-header"><td colspan="2">Раздел 2. Исчисление налогов и обязательных платежей в бюджет</td></tr>

  <tr>
    <td class="code-col">910.00.001</td>
    <td>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:8.5pt">Доход, учитываемый при исчислении налога</span>
        <span class="amount-col">${income}&nbsp;₸</span>
      </div>
    </td>
  </tr>

  <tr>
    <td class="code-col">910.00.002</td>
    <td>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:8.5pt">Ставка налога (%)</span>
        <span class="amount-col">3%</span>
      </div>
    </td>
  </tr>

  <tr>
    <td class="code-col">910.00.003</td>
    <td>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:8.5pt">Исчисленная сумма налога (910.00.001 × 3%)</span>
        <span class="amount-col" style="font-size:12pt">${tax}&nbsp;₸</span>
      </div>
    </td>
  </tr>

  <tr class="section-header"><td colspan="2">Раздел 3. Ответственность налогоплательщика</td></tr>

  <tr>
    <td class="row-num">1</td>
    <td style="font-size:8.5pt">
      Я подтверждаю достоверность и полноту сведений, указанных в настоящей налоговой отчётности.
    </td>
  </tr>
</table>

<div class="sig-block">
  <div style="font-size:8.5pt">Налогоплательщик (представитель):</div>
  <div style="display:flex;justify-content:space-between;margin-top:24px;gap:40px">
    <div>
      <div style="border-bottom:1px solid #000;width:220px;min-height:18px"></div>
      <div style="font-size:7.5pt;margin-top:2px">подпись</div>
    </div>
    <div>
      <div style="border-bottom:1px solid #000;width:180px;min-height:18px"></div>
      <div style="font-size:7.5pt;margin-top:2px">Ф.И.О. (при наличии)</div>
    </div>
    <div>
      <div style="font-size:8.5pt">Дата:&nbsp;<strong>${today}</strong></div>
    </div>
  </div>
</div>

<div class="footer-note">Форма 910.00 сформирована автоматически — DGC Tax App</div>
</body>
</html>`
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
        const nextErrorMessage = getSupabaseErrorMessage(
          error,
          'Не удалось загрузить налоговые режимы. Можно использовать форму с ограниченным набором вариантов.'
        )
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

  const visibleTemplateFields = useMemo(
    () => getVisibleTemplateFields(selectedTemplate, templateFields),
    [selectedTemplate, templateFields]
  )

  const groupedTemplateFields = useMemo(
    () => groupTemplateFields(selectedTemplate, visibleTemplateFields),
    [selectedTemplate, visibleTemplateFields]
  )

  const numericSummary = useMemo(() => {
    if (formData.dynamicFieldValues.calculated_tax) {
      const calculatedTax = Number(formData.dynamicFieldValues.calculated_tax)
      return Number.isFinite(calculatedTax) ? calculatedTax : 0
    }

    return visibleTemplateFields.reduce((total, field) => {
      if (field.data_type !== 'number') {
        return total
      }

      const value = Number(formData.dynamicFieldValues[field.code])
      return total + (Number.isFinite(value) ? value : 0)
    }, 0)
  }, [formData.dynamicFieldValues, visibleTemplateFields])

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
        ...(isForm910(selectedTemplate) && field.code === 'income_total'
          ? { calculated_tax: calculateSimplifiedTax(value) }
          : {}),
      },
      dynamicFieldErrors: {
        ...prev.dynamicFieldErrors,
        [field.code]: '',
        ...(isForm910(selectedTemplate) && field.code === 'income_total'
          ? { calculated_tax: '' }
          : {}),
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
        prev || 'Не удалось загрузить разделы формы из Supabase.'
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
    const sectionsResponse = await supabase
      .from('report_sections')
      .select('*')
      .eq('report_template_id', templateId)

    if (sectionsResponse.error) {
      setErrorMessage(prev =>
        prev || 'Не удалось загрузить данные формы из Supabase.'
      )
      return []
    }

    const sections = sectionsResponse.data || []

    if (sections.length === 0) {
      return []
    }

    const sectionOrder = new Map(
      sections.map((section, index) => [section.id, section.sort_order ?? index + 1])
    )

    const { data, error } = await supabase
      .from('report_fields')
      .select('*')
      .in(
        'report_section_id',
        sections.map(section => section.id)
      )
      .order('sort_order', { ascending: true })

    if (error) {
      setErrorMessage(prev => prev || 'Не удалось загрузить данные формы из Supabase.')
      return []
    }

    return (data || [])
      .sort((a, b) => {
        const sectionDiff =
          (sectionOrder.get(a.report_section_id) || 0) -
          (sectionOrder.get(b.report_section_id) || 0)

        if (sectionDiff !== 0) {
          return sectionDiff
        }

        return (a.sort_order || 0) - (b.sort_order || 0)
      })
      .map(field => {
        const section = sections.find(item => item.id === field.report_section_id)

        return {
          ...field,
          section_key: String(field.report_section_id || ''),
          section_title:
            section?.title_ru ||
            section?.title ||
            section?.name_ru ||
            section?.name ||
            'Данные формы',
          section_sort_order: sectionOrder.get(field.report_section_id) || 0,
        }
      })
  }
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
        if (isForm910(template)) {
          nextValues.calculated_tax = calculateSimplifiedTax(nextValues.income_total)
        }


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

  function validateDynamicFields() {
    const nextErrors = {}

    visibleTemplateFields.forEach(field => {
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
        const numberValue = parseNumberValue(value)

        if (numberValue === null) {
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

  function handleDownloadForm() {
    const html = generateForm910HTML(formData, selectedTemplate)
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
      setErrorMessage('Браузер заблокировал всплывающее окно. Разрешите popup для этого сайта.')
      return
    }
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 400)
  }

  function handleFinish() {
    handleDownloadForm()
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
        readOnly={isForm910(selectedTemplate) && field.code === 'calculated_tax'}
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

          {selectedTemplate && visibleTemplateFields.length > 0 ? (
            <div className="space-y-5">
              {groupedTemplateFields.map(section => (
                <div
                  key={section.key}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                >
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Раздел
                    </p>
                    <h5 className="mt-2 text-lg font-semibold text-slate-950">
                      {section.title}
                    </h5>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    {section.fields.map(field => renderDynamicField(field))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-700">Форма готова к выгрузке</p>
          <p className="mt-1 text-sm text-emerald-600">
            Проверьте данные ниже и нажмите «Скачать форму 910.00» — откроется
            окно печати, выберите «Сохранить как PDF».
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <SummaryRow label="Тип бизнеса" value={formData.businessType || 'Не выбран'} />
          <SummaryRow label="Налоговый режим" value={formData.taxRegimeName || 'Не выбран'} />
          <SummaryRow label="Период" value={reportingPeriod} />
          <SummaryRow
            label="Форма"
            value={selectedTemplate ? (selectedTemplate.form_code || 'Без кода') : 'Не найдена'}
          />
        </div>

        {selectedTemplate ? (
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Название формы</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {selectedTemplate.title_ru || 'Налоговая форма'}
            </p>
          </div>
        ) : null}

        <div className="space-y-3">
          {visibleTemplateFields.length > 0 ? (
            groupedTemplateFields.map(section => (
              <div key={section.key} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {section.title}
                </p>
                {section.fields.map(field => {
                  const rawValue = formData.dynamicFieldValues[field.code]
                  const displayValue =
                    typeof rawValue === 'boolean'
                      ? rawValue ? 'Да' : 'Нет'
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
                })}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              Для выбранной формы пока нет введённых данных.
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Итоговая сумма налога (3%)</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {numericSummary.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₸
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadForm}
          className="w-full rounded-2xl bg-sky-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          Скачать форму 910.00 (PDF)
        </button>
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
                onClick={handleDownloadForm}
                className="rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Скачать форму 910.00
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
