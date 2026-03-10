'use client'
/**
 * Module 2 — Course Objectives
 * Dynamic list of ordered course objectives with CRUD operations.
 */
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { subjectsAPI } from '@/lib/api'
import { Plus, Trash2, Save, ChevronLeft, ChevronRight, Loader2, GripVertical } from 'lucide-react'

interface Props {
  subjectId: number
  readOnly: boolean
  onSaved: () => void
  onNext: () => void
  onBack: () => void
}

export default function Module2Objectives({ subjectId, readOnly, onSaved, onNext, onBack }: Props) {
  const queryClient = useQueryClient()
  const [objectives, setObjectives] = useState<string[]>([''])

  const { data, isLoading } = useQuery({
    queryKey: ['module-2', subjectId],
    queryFn: () => subjectsAPI.getModuleData(subjectId, 2).then(r => r.data),
  })

  useEffect(() => {
    if (data?.objectives) {
      const texts = data.objectives.map((obj: any) => obj.text || obj)
      setObjectives(texts.length > 0 ? texts : [''])
    }
  }, [data])

  const addObjective = () => setObjectives(prev => [...prev, ''])

  const removeObjective = (index: number) => {
    setObjectives(prev => prev.filter((_, i) => i !== index))
  }

  const updateObjective = (index: number, value: string) => {
    setObjectives(prev => prev.map((o, i) => (i === index ? value : o)))
  }

  const mutation = useMutation({
    mutationFn: () =>
      subjectsAPI.saveModule(subjectId, 2, {
        objectives: objectives.filter(Boolean),
      }),
    onSuccess: () => {
      toast.success('Course objectives saved.')
      queryClient.invalidateQueries({ queryKey: ['module-2', subjectId] })
      onSaved()
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Save failed.'),
  })

  const handleSave = () => mutation.mutate()

  const handleSaveAndNext = () => {
    mutation.mutate()
    setTimeout(onNext, 300)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
      </div>
    )
  }

  const inputCls = `w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${readOnly ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`

  return (
    <div className="space-y-6">
      {/* Objectives List */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Course Learning Objectives</h3>
            <p className="text-xs text-gray-500 mt-1">
              Define what the course aims to achieve. Objectives should be clear, measurable, and aligned with program goals.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {objectives.filter(Boolean).length} objective{objectives.filter(Boolean).length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-3">
          {objectives.map((objective, index) => (
            <div key={index} className="flex items-start gap-3 group">
              {/* Order Number */}
              <span className="flex-shrink-0 mt-2 text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded w-10 text-center">
                {index + 1}
              </span>

              {/* Objective Text */}
              <textarea
                value={objective}
                onChange={e => updateObjective(index, e.target.value)}
                disabled={readOnly}
                placeholder={`Objective ${index + 1}: e.g., "Students will understand the fundamental concepts of..."`}
                rows={2}
                className={`flex-1 ${inputCls} resize-none`}
              />

              {/* Remove Button */}
              {!readOnly && objectives.length > 1 && (
                <button
                  onClick={() => removeObjective(index)}
                  className="flex-shrink-0 mt-1 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove objective"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Button */}
        {!readOnly && (
          <button
            onClick={addObjective}
            className="mt-4 flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Objective
          </button>
        )}
      </div>

      {/* Tips Card */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-purple-800 mb-2">Tips for Writing Objectives</h4>
        <ul className="text-xs text-purple-700 space-y-1 list-disc list-inside">
          <li>Use action verbs (Understand, Apply, Analyze, Design, Evaluate)</li>
          <li>Keep objectives specific and measurable</li>
          <li>Align with program learning outcomes (PLOs)</li>
          <li>Typically 4-6 objectives per course</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <div className="flex gap-3">
          {!readOnly && (
            <>
              <button
                onClick={handleSave}
                disabled={mutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
              <button
                onClick={handleSaveAndNext}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Save & Next <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          {readOnly && (
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
