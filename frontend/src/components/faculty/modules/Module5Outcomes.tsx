'use client'
/**
 * Module 5 — Course Outcomes + Articulation Matrix
 * The most complex module: dynamic CO list drives a CO×PO matrix.
 */
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { subjectsAPI } from '@/lib/api'
import { Plus, Trash2, Save, ChevronLeft, ChevronRight, Loader2, Info } from 'lucide-react'

const PO_LABELS = ['PO1','PO2','PO3','PO4','PO5','PO6','PO7','PO8','PO9','PO10','PO11','PSO1','PSO2']
const PO_FIELDS = ['po1','po2','po3','po4','po5','po6','po7','po8','po9','po10','po11','pso1','pso2']

interface MatrixRow {
  order: number
  [key: string]: number | null | string
}

interface Props {
  subjectId: number
  readOnly: boolean
  onSaved: () => void
  onNext: () => void
  onBack: () => void
}

export default function Module5Outcomes({ subjectId, readOnly, onSaved, onNext, onBack }: Props) {
  const queryClient = useQueryClient()
  const [outcomes, setOutcomes] = useState<string[]>([''])
  const [matrix, setMatrix] = useState<MatrixRow[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['module-5', subjectId],
    queryFn: () => subjectsAPI.getModuleData(subjectId, 5).then(r => r.data),
  })

  useEffect(() => {
    if (data) {
      const cos = data.outcomes?.map((co: any) => co.text) || ['']
      setOutcomes(cos.length > 0 ? cos : [''])
      // Build matrix state from API data
      const matrixState: MatrixRow[] = data.outcomes?.map((_: any, i: number) => {
        const existing = data.matrix?.find((r: any) => r.co_label === `CO${i + 1}`)
        const row: MatrixRow = { order: i + 1 }
        PO_FIELDS.forEach(f => {
          row[f] = existing?.[f] ?? null
        })
        return row
      }) || []
      setMatrix(matrixState)
    }
  }, [data])

  // Sync matrix rows when outcomes change
  useEffect(() => {
    setMatrix(prev => {
      const newMatrix: MatrixRow[] = outcomes.map((_, i) => {
        const existing = prev.find(r => r.order === i + 1)
        return existing || { order: i + 1, ...Object.fromEntries(PO_FIELDS.map(f => [f, null])) }
      })
      return newMatrix
    })
  }, [outcomes.length])

  const addOutcome = () => setOutcomes(prev => [...prev, ''])
  const removeOutcome = (i: number) => {
    setOutcomes(prev => prev.filter((_, idx) => idx !== i))
  }
  const updateOutcome = (i: number, val: string) => {
    setOutcomes(prev => prev.map((o, idx) => idx === i ? val : o))
  }

  const updateMatrixCell = (coOrder: number, field: string, val: string) => {
    setMatrix(prev => prev.map(row =>
      row.order === coOrder
        ? { ...row, [field]: val === '' ? null : parseInt(val) }
        : row
    ))
  }

  const mutation = useMutation({
    mutationFn: () => subjectsAPI.saveModule(subjectId, 5, { outcomes, matrix }),
    onSuccess: () => {
      toast.success('Course outcomes and matrix saved.')
      queryClient.invalidateQueries({ queryKey: ['module-5', subjectId] })
      onSaved()
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Save failed.'),
  })

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin w-6 h-6 text-blue-600" /></div>

  const inputCls = `border border-gray-300 rounded-lg px-3 py-2 text-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500
    ${readOnly ? 'bg-gray-50' : 'bg-white'}`

  const cellValue = (coOrder: number, field: string) =>
    matrix.find(r => r.order === coOrder)?.[field] as number | null | undefined

  return (
    <div className="space-y-6">

      {/* Course Outcomes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Course Outcomes</h3>
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
            <Info className="w-3 h-3" />
            Saving COs rebuilds the matrix
          </div>
        </div>
        <div className="space-y-3">
          {outcomes.map((co, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 mt-2 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded w-10 text-center">
                CO{i + 1}
              </span>
              <textarea
                value={co}
                onChange={e => updateOutcome(i, e.target.value)}
                disabled={readOnly}
                placeholder="Upon completion, students will be able to..."
                rows={2}
                className={`flex-1 ${inputCls} resize-none`}
              />
              {!readOnly && outcomes.length > 1 && (
                <button onClick={() => removeOutcome(i)}
                  className="flex-shrink-0 mt-1 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {!readOnly && (
          <button onClick={addOutcome}
            className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
            <Plus className="w-4 h-4" /> Add CO
          </button>
        )}
      </div>

      {/* Articulation Matrix */}
      {outcomes.filter(Boolean).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Articulation Matrix (CO–PO/PSO)</h3>
          <p className="text-xs text-gray-500 mb-4">
            1 = Low &nbsp;|&nbsp; 2 = Medium &nbsp;|&nbsp; 3 = High &nbsp;|&nbsp; blank = No mapping
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="bg-gray-800 text-white px-3 py-2 text-left rounded-tl-lg w-14">CO</th>
                  {PO_LABELS.map(label => (
                    <th key={label} className="bg-gray-800 text-white px-2 py-2 text-center min-w-[46px]">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {outcomes.filter(Boolean).map((_, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="font-bold text-blue-700 bg-blue-50 px-3 py-1.5 border border-gray-200">
                      CO{i + 1}
                    </td>
                    {PO_FIELDS.map((field, j) => {
                      const val = cellValue(i + 1, field)
                      return (
                        <td key={j} className="border border-gray-200 p-0.5">
                          <select
                            value={val ?? ''}
                            onChange={e => updateMatrixCell(i + 1, field, e.target.value)}
                            disabled={readOnly}
                            className={`w-full text-center text-xs py-1.5 rounded border-0 outline-none focus:ring-1 focus:ring-blue-400
                              ${val === 1 ? 'bg-yellow-100 text-yellow-800'
                                : val === 2 ? 'bg-blue-100 text-blue-800'
                                : val === 3 ? 'bg-green-100 text-green-800'
                                : 'bg-transparent'}`}
                          >
                            <option value="">—</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                          </select>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-2">
        <button onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-3">
          {!readOnly && (
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          )}
          <button onClick={onNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
