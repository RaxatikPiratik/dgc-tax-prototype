'use client'

import ContentCard from '@/components/content-card'

function FilterField({ label }) {
  return (
    <label className="space-y-2">
      <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-500">
        {label}
      </div>
    </label>
  )
}

export default function FilterBar({ filters }) {
  return (
    <ContentCard className="p-5">
      <div className="grid gap-4 xl:grid-cols-6">
        {filters.map(filter => (
          <FilterField key={filter} label={filter} />
        ))}
      </div>
    </ContentCard>
  )
}
