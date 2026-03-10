interface Props {
  value:      number   // 0–100
  showLabel?: boolean
}

export default function ProgressBar({ value, showLabel = true }: Props) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center gap-2.5">
      <div className="progress-track flex-1">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-[#8a909e] tabular-nums w-8 text-right">
          {pct}%
        </span>
      )}
    </div>
  )
}
