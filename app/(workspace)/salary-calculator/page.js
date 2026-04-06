'use client'

import { useMemo, useState } from 'react'

const taxpayerModes = [
  { id: 'ip', label: 'За ИП' },
  { id: 'employee', label: 'За работника в штате' },
  { id: 'contractor', label: 'За работника на ГПХ' },
]

const topSelectOptions = {
  calculationType: ['Прямой расчёт', 'Обратный расчёт'],
  taxpayerCategory: ['ИП', 'ТОО'],
  regime: ['Упрощённая', 'Общеустановленная'],
}

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

const ipStatuses = [
  'Пенсионер',
  'Инвалид',
  'Получатель ОПВ',
  'Многодетная мать',
  'Студент',
  'Освобожден от ОПВР',
]

const employeeDeductions = ['30 МРП', '882 МРП', '5000 МРП']

const employeeStatuses = [
  'Пенсионер',
  'Инвалид',
  'Получатель ОПВ',
  'Сотрудник участника Астана Хаб',
  'Студент',
  'Многодетная мать',
  'Сотрудник участника МФЦА',
  'Освобожден от ОПВР',
]

const contractorStatuses = [
  'Пенсионер',
  'Инвалид',
  'Получатель ОПВ',
  'Сотрудник участника Астана Хаб',
  'Студент',
  'Многодетная мать',
  'Сотрудник участника МФЦА',
]

const citizenshipOptions = ['Гражданин РК', 'Иностранец']

function SectionTitle({ children }) {
  return (
    <div className="rounded-2xl bg-sky-50 px-4 py-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-800">
        {children}
      </h3>
    </div>
  )
}

function LabeledSelect({ label, value, options, onChange }) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function NumericInput({ value, onChange, placeholder = '0' }) {
  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white"
    />
  )
}

function CheckboxPill({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
      />
      <span>{label}</span>
    </label>
  )
}

function ModeToggle({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
        active
          ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-[0_10px_25px_rgba(14,116,144,0.08)]'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
      }`}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-md border ${
          active
            ? 'border-sky-500 bg-sky-500 text-white'
            : 'border-slate-300 bg-slate-50'
        }`}
      >
        {active ? (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
            <path
              d="M3.5 8.25 6.5 11l6-6.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span>{label}</span>
    </button>
  )
}

function EmployeeIncomeRow({ row, onChange, onRemove, removable }) {
  return (
    <div className="grid gap-3 md:grid-cols-[1.15fr_0.85fr_auto]">
      <LabeledSelect
        label="Вид начисления"
        value={row.type}
        options={['Зарплата']}
        onChange={value => onChange(row.id, 'type', value)}
      />
      <label className="space-y-2">
        <span className="block text-sm font-medium text-slate-700">Сумма</span>
        <NumericInput
          value={row.amount}
          onChange={value => onChange(row.id, 'amount', value)}
        />
      </label>
      <div className="flex items-end">
        <button
          type="button"
          onClick={() => onRemove(row.id)}
          disabled={!removable}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Удалить начисление"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
            <path
              d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

function InfoNote() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-slate-600">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-sky-700 shadow-[0_4px_10px_rgba(14,116,144,0.08)]">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
          <path
            d="M10 6.75h.01M8.9 9.25H10v4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
      <p>Выберите налог, чтобы увидеть реквизиты платёжного поручения</p>
    </div>
  )
}

export default function SalaryCalculatorPage() {
  const currentDate = new Date()
  const currentMonthIndex = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => String(currentYear - 3 + i))
  const [mode, setMode] = useState('ip')
  const [topControls, setTopControls] = useState({
    calculationType: 'Прямой расчёт',
    taxpayerCategory: 'ИП',
    regime: 'Упрощённая',
    unifiedPayment: false,
  })
  const [selectedMonth, setSelectedMonth] = useState(months[currentMonthIndex])
  const [selectedYear, setSelectedYear] = useState(String(currentYear))
  const [ipBase, setIpBase] = useState('0')
  const [employeeRows, setEmployeeRows] = useState([
    { id: 1, type: 'Зарплата', amount: '0' },
  ])
  const [contractorIncome, setContractorIncome] = useState({
    services: '0',
    goods: '0',
  })
  const [highRateIin, setHighRateIin] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState({
    ip: [],
    employee: [],
    contractor: [],
  })
  const [selectedDeductions, setSelectedDeductions] = useState({
    employee: [],
    contractor: [],
  })
  const [citizenship, setCitizenship] = useState({
    employee: 'Гражданин РК',
    contractor: 'Гражданин РК',
  })

  const activeStatuses = useMemo(() => {
    if (mode === 'ip') {
      return ipStatuses
    }

    if (mode === 'employee') {
      return employeeStatuses
    }

    return contractorStatuses
  }, [mode])

  const reportingPeriod = useMemo(
    () => `${selectedMonth} ${selectedYear}`,
    [selectedMonth, selectedYear]
  )

  const periodCode = useMemo(() => {
    return `${selectedYear}-${String(months.indexOf(selectedMonth) + 1).padStart(2, '0')}`
  }, [selectedMonth, selectedYear])

  function updateTopControl(key, value) {
    setTopControls(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  function toggleStatus(currentMode, status) {
    setSelectedStatuses(prev => {
      const current = prev[currentMode]
      const next = current.includes(status)
        ? current.filter(item => item !== status)
        : [...current, status]

      return {
        ...prev,
        [currentMode]: next,
      }
    })
  }

  function toggleDeduction(currentMode, deduction) {
    setSelectedDeductions(prev => {
      const current = prev[currentMode]
      const next = current.includes(deduction)
        ? current.filter(item => item !== deduction)
        : [...current, deduction]

      return {
        ...prev,
        [currentMode]: next,
      }
    })
  }

  function addEmployeeRow() {
    setEmployeeRows(prev => [
      ...prev,
      { id: Date.now(), type: 'Зарплата', amount: '0' },
    ])
  }

  function updateEmployeeRow(id, key, value) {
    setEmployeeRows(prev =>
      prev.map(row => (row.id === id ? { ...row, [key]: value } : row))
    )
  }

  function removeEmployeeRow(id) {
    setEmployeeRows(prev => {
      if (prev.length === 1) {
        return prev
      }

      return prev.filter(row => row.id !== id)
    })
  }

  function handleCalculate() {
    console.log('salary calculator state', {
      mode,
      topControls,
      selectedMonth,
      selectedYear,
      reportingPeriod,
      periodCode,
      ipBase,
      employeeRows,
      contractorIncome,
      highRateIin,
      selectedStatuses,
      selectedDeductions,
      citizenship,
    })
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,#ffffff_0%,#f5f9ff_58%,#ebf4ff_100%)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
          КАЛЬКУЛЯТОР ЗП
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-[2rem]">
          Расчёт заработной платы и налогов
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          Выберите тип налогоплательщика, укажите доходы и параметры расчёта,
          чтобы подготовить основу для дальнейшего расчёта удержаний и платежей.
        </p>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-8">
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <LabeledSelect
              label="Тип расчёта"
              value={topControls.calculationType}
              options={topSelectOptions.calculationType}
              onChange={value => updateTopControl('calculationType', value)}
            />
            <LabeledSelect
              label="Категория"
              value={topControls.taxpayerCategory}
              options={topSelectOptions.taxpayerCategory}
              onChange={value => updateTopControl('taxpayerCategory', value)}
            />
            <LabeledSelect
              label="Режим"
              value={topControls.regime}
              options={topSelectOptions.regime}
              onChange={value => updateTopControl('regime', value)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
            <LabeledSelect
              label="Год"
              value={selectedYear}
              options={years}
              onChange={setSelectedYear}
            />
            <LabeledSelect
              label="Месяц"
              value={selectedMonth}
              options={months}
              onChange={setSelectedMonth}
            />
            <div className="flex items-end">
              <CheckboxPill
                label="Единый платёж"
                checked={topControls.unifiedPayment}
                onChange={checked => updateTopControl('unifiedPayment', checked)}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Выбранный период
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {reportingPeriod}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {taxpayerModes.map(item => (
              <ModeToggle
                key={item.id}
                label={item.label}
                active={mode === item.id}
                onClick={() => setMode(item.id)}
              />
            ))}
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <SectionTitle>Доход</SectionTitle>

              {mode === 'ip' ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 md:col-span-2">
                    <span className="block text-sm font-medium text-slate-700">
                      База ОПВ
                    </span>
                    <NumericInput value={ipBase} onChange={setIpBase} />
                  </label>
                </div>
              ) : null}

              {mode === 'employee' ? (
                <div className="space-y-4">
                  <CheckboxPill
                    label="Повышенная ставка ИПН кроме дивидендов"
                    checked={highRateIin}
                    onChange={setHighRateIin}
                  />

                  <div className="space-y-3">
                    {employeeRows.map(row => (
                      <EmployeeIncomeRow
                        key={row.id}
                        row={row}
                        onChange={updateEmployeeRow}
                        onRemove={removeEmployeeRow}
                        removable={employeeRows.length > 1}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addEmployeeRow}
                    className="text-sm font-semibold text-sky-700 transition hover:text-sky-800"
                  >
                    + Начисление
                  </button>
                </div>
              ) : null}

              {mode === 'contractor' ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="block text-sm font-medium text-slate-700">
                      Доходы ГПХ (услуги)
                    </span>
                    <NumericInput
                      value={contractorIncome.services}
                      onChange={value =>
                        setContractorIncome(prev => ({ ...prev, services: value }))
                      }
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="block text-sm font-medium text-slate-700">
                      Доходы ГПХ (товары)
                    </span>
                    <NumericInput
                      value={contractorIncome.goods}
                      onChange={value =>
                        setContractorIncome(prev => ({ ...prev, goods: value }))
                      }
                    />
                  </label>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <SectionTitle>Вычеты</SectionTitle>
              {mode === 'ip' ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  Для расчёта за ИП дополнительные вычеты в этой версии не применяются.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {employeeDeductions.map(item => (
                    <CheckboxPill
                      key={item}
                      label={item}
                      checked={selectedDeductions[mode].includes(item)}
                      onChange={() => toggleDeduction(mode, item)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <SectionTitle>Социальные статусы</SectionTitle>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {activeStatuses.map(item => (
                  <CheckboxPill
                    key={item}
                    label={item}
                    checked={selectedStatuses[mode].includes(item)}
                    onChange={() => toggleStatus(mode, item)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <SectionTitle>Гражданство</SectionTitle>
              {mode === 'ip' ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  Для расчёта за ИП отдельный выбор гражданства не требуется.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {citizenshipOptions.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setCitizenship(prev => ({
                          ...prev,
                          [mode]: item,
                        }))
                      }
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                        citizenship[mode] === item
                          ? 'border-sky-500 bg-sky-50 text-sky-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={handleCalculate}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 sm:w-fit"
              >
                Рассчитать
              </button>
              <InfoNote />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
