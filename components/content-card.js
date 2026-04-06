'use client'

export default function ContentCard({
  children,
  className = '',
  muted = false,
}) {
  return (
    <section
      className={`rounded-[28px] border ${
        muted
          ? 'border-slate-200 bg-slate-50'
          : 'border-slate-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]'
      } ${className}`}
    >
      {children}
    </section>
  )
}
