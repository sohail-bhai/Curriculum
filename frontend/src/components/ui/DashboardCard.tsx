import { ReactNode } from 'react'

interface Props {
  label:     string
  value:     string | number
  icon:      ReactNode
  color?:    'navy' | 'amber' | 'emerald' | 'purple' | 'slate' | 'rose'
  delta?:    string
  note?:     string
}

const COLORS = {
  navy:    { wrap: 'bg-[#dce6f4]',  icon: 'text-[#1e4785]' },
  amber:   { wrap: 'bg-amber-100',  icon: 'text-amber-700' },
  emerald: { wrap: 'bg-emerald-100',icon: 'text-emerald-700' },
  purple:  { wrap: 'bg-purple-100', icon: 'text-purple-700' },
  slate:   { wrap: 'bg-slate-100',  icon: 'text-slate-600' },
  rose:    { wrap: 'bg-rose-100',   icon: 'text-rose-700' },
}

export default function DashboardCard({ label, value, icon, color = 'navy', delta, note }: Props) {
  const { wrap, icon: iconCls } = COLORS[color]
  return (
    <div className="card card-hover p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${wrap}`}>
          <span className={iconCls}>{icon}</span>
        </div>
        {delta && (
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {delta}
          </span>
        )}
      </div>
      <div>
        <p className="font-display text-[28px] font-bold leading-none text-navy-800">{value}</p>
        <p className="text-sm font-medium text-[#4a5060] mt-1.5">{label}</p>
        {note && <p className="text-xs text-[#8a909e] mt-0.5">{note}</p>}
      </div>
    </div>
  )
}
