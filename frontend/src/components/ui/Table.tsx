import { ReactNode } from 'react'

export interface Column<T> {
  key:       string
  header:    string
  render?:   (row: T) => ReactNode
  className?: string
}

interface TableProps<T extends Record<string, unknown>> {
  columns:      Column<T>[]
  data:         T[]
  keyField:     string
  loading?:     boolean
  emptyIcon?:   ReactNode
  emptyText?:   string
  emptySubText?: string
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-[#f0ece4]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="skeleton h-4" style={{ width: `${50 + (i * 19) % 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function Table<T extends Record<string, unknown>>({
  columns, data, keyField, loading,
  emptyIcon, emptyText = 'No records found', emptySubText,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-[14px] border border-[#e5e1d8] bg-white">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} className={c.className}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} cols={columns.length} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#b0a898]">
                  {emptyIcon && <div className="opacity-30">{emptyIcon}</div>}
                  <p className="text-sm font-medium text-[#8a909e]">{emptyText}</p>
                  {emptySubText && <p className="text-xs text-[#b0a898]">{emptySubText}</p>}
                </div>
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr key={String(row[keyField])}>
                {columns.map(c => (
                  <td key={c.key} className={c.className}>
                    {c.render ? c.render(row) : String(row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
