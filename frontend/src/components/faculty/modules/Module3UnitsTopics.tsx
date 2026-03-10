'use client'
/**
 * Module 3 — Units, Topics & Practical Exercises
 * Complex nested editor: Units → Topics (per unit) + standalone Practicals list.
 */
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { subjectsAPI } from '@/lib/api'
import {
  Plus, Trash2, Save, ChevronLeft, ChevronRight, Loader2,
  ChevronDown, ChevronUp, BookOpen
} from 'lucide-react'

interface Topic {
  title: string
  hours: number
}

interface Unit {
  title: string
  description: string
  topics: Topic[]
}

interface Props {
  subjectId: number
  readOnly: boolean
  onSaved: () => void
  onNext: () => void
  onBack: () => void
}

const EMPTY_TOPIC: Topic = { title: '', hours: 1 }
const EMPTY_UNIT: Unit = { title: '', description: '', topics: [{ ...EMPTY_TOPIC }] }

export default function Module3UnitsTopics({ subjectId, readOnly, onSaved, onNext, onBack }: Props) {
  const queryClient = useQueryClient()
  const [units, setUnits] = useState<Unit[]>([{ ...EMPTY_UNIT }])
  const [practicals, setPracticals] = useState<string[]>([''])
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set([0]))

  const { data, isLoading } = useQuery({
    queryKey: ['module-3', subjectId],
    queryFn: () => subjectsAPI.getModuleData(subjectId, 3).then(r => r.data),
  })

  useEffect(() => {
    if (data) {
      if (data.units?.length > 0) {
        const loadedUnits: Unit[] = data.units.map((u: any) => ({
          title: u.title || '',
          description: u.description || '',
          topics: u.topics?.length > 0
            ? u.topics.map((t: any) => ({ title: t.text || t.title || '', hours: t.hours ?? 1 }))
            : [{ ...EMPTY_TOPIC }],
        }))
        setUnits(loadedUnits)
        setExpandedUnits(new Set(loadedUnits.map((_: Unit, i: number) => i)))
      }
      if (data.practicals?.length > 0) {
        setPracticals(data.practicals.map((p: any) => p.text || p.title || p))
      }
    }
  }, [data])

  // Unit operations
  const addUnit = () => {
    setUnits(prev => [...prev, { ...EMPTY_UNIT, topics: [{ ...EMPTY_TOPIC }] }])
    setExpandedUnits(prev => new Set(Array.from(prev).concat(units.length)))
  }
  const removeUnit = (i: number) => {
    setUnits(prev => prev.filter((_, idx) => idx !== i))
    setExpandedUnits(prev => {
      const next = new Set(prev)
      next.delete(i)
      return next
    })
  }
  const updateUnit = (i: number, field: keyof Unit, value: string) => {
    setUnits(prev => prev.map((u, idx) => idx === i ? { ...u, [field]: value } : u))
  }

  // Topic operations
  const addTopic = (unitIdx: number) => {
    setUnits(prev => prev.map((u, i) =>
      i === unitIdx ? { ...u, topics: [...u.topics, { ...EMPTY_TOPIC }] } : u
    ))
  }
  const removeTopic = (unitIdx: number, topicIdx: number) => {
    setUnits(prev => prev.map((u, i) =>
      i === unitIdx ? { ...u, topics: u.topics.filter((_, j) => j !== topicIdx) } : u
    ))
  }
  const updateTopic = (unitIdx: number, topicIdx: number, field: keyof Topic, value: string | number) => {
    setUnits(prev => prev.map((u, i) =>
      i === unitIdx
        ? { ...u, topics: u.topics.map((t, j) => j === topicIdx ? { ...t, [field]: value } : t) }
        : u
    ))
  }

  // Practical operations
  const addPractical = () => setPracticals(prev => [...prev, ''])
  const removePractical = (i: number) => setPracticals(prev => prev.filter((_, idx) => idx !== i))
  const updatePractical = (i: number, value: string) => {
    setPracticals(prev => prev.map((p, idx) => idx === i ? value : p))
  }

  const toggleUnit = (i: number) => {
    setExpandedUnits(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const mutation = useMutation({
    mutationFn: () =>
      subjectsAPI.saveModule(subjectId, 3, {
        units: units.filter(u => u.title).map((u, i) => ({
          unit_number: i + 1,
          title: u.title,
          hours: u.topics.reduce((sum, t) => sum + (Number(t.hours) || 0), 0),
          topics: u.topics.filter(t => t.title).map(t => t.title),
        })),
        practicals: practicals.filter(Boolean),
      }),
    onSuccess: () => {
      toast.success('Units, topics and practicals saved.')
      queryClient.invalidateQueries({ queryKey: ['module-3', subjectId] })
      onSaved()
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Save failed.'),
  })

  const handleSave = () => mutation.mutate()
  const handleSaveAndNext = () => { mutation.mutate(); setTimeout(onNext, 300) }

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

  const totalHours = units.flatMap(u => u.topics).reduce((sum, t) => sum + (Number(t.hours) || 0), 0)

  return (
    <div className="space-y-6">

      {/* Summary Bar */}
      <div className="flex items-center gap-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span className="text-indigo-800 font-medium">{units.filter(u => u.title).length} Units</span>
        </div>
        <span className="text-indigo-300">|</span>
        <span className="text-indigo-700">{units.flatMap(u => u.topics).filter(t => t.title).length} Topics</span>
        <span className="text-indigo-300">|</span>
        <span className="text-indigo-700">{totalHours} Total Hours</span>
        <span className="text-indigo-300">|</span>
        <span className="text-indigo-700">{practicals.filter(Boolean).length} Practicals</span>
      </div>

      {/* Units */}
      <div className="space-y-4">
        {units.map((unit, unitIdx) => (
          <div key={unitIdx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Unit Header */}
            <div
              className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleUnit(unitIdx)}
            >
              <span className="flex-shrink-0 text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                Unit {unitIdx + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                {unit.title || 'Untitled Unit'}
              </span>
              <span className="text-xs text-gray-500">
                {unit.topics.filter(t => t.title).length} topics
              </span>
              {!readOnly && units.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); removeUnit(unitIdx) }}
                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove unit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {expandedUnits.has(unitIdx) ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>

            {/* Unit Body */}
            {expandedUnits.has(unitIdx) && (
              <div className="p-5 space-y-4">
                {/* Unit Title & Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Unit Title *</label>
                    <input
                      value={unit.title}
                      onChange={e => updateUnit(unitIdx, 'title', e.target.value)}
                      disabled={readOnly}
                      placeholder="e.g., Introduction to Programming Concepts"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                    <input
                      value={unit.description}
                      onChange={e => updateUnit(unitIdx, 'description', e.target.value)}
                      disabled={readOnly}
                      placeholder="Brief description of the unit"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Topics */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Topics</label>
                  <div className="space-y-2">
                    {unit.topics.map((topic, topicIdx) => (
                      <div key={topicIdx} className="flex items-center gap-2">
                        <span className="flex-shrink-0 text-xs text-gray-500 w-8 text-center">
                          {unitIdx + 1}.{topicIdx + 1}
                        </span>
                        <input
                          value={topic.title}
                          onChange={e => updateTopic(unitIdx, topicIdx, 'title', e.target.value)}
                          disabled={readOnly}
                          placeholder="Topic title"
                          className={`flex-1 ${inputCls}`}
                        />
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={topic.hours}
                            onChange={e => updateTopic(unitIdx, topicIdx, 'hours', Number(e.target.value))}
                            disabled={readOnly}
                            className={`w-16 text-center ${inputCls}`}
                            title="Hours"
                          />
                          <span className="text-xs text-gray-500">hrs</span>
                        </div>
                        {!readOnly && unit.topics.length > 1 && (
                          <button
                            onClick={() => removeTopic(unitIdx, topicIdx)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => addTopic(unitIdx)}
                      className="mt-2 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Topic
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Unit Button */}
        {!readOnly && (
          <button
            onClick={addUnit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-indigo-300 rounded-xl text-sm text-indigo-600 hover:text-indigo-800 hover:border-indigo-400 hover:bg-indigo-50 font-medium transition-all"
          >
            <Plus className="w-4 h-4" /> Add Unit
          </button>
        )}
      </div>

      {/* Practical Exercises */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Practical Exercises</h3>
            <p className="text-xs text-gray-500 mt-0.5">Lab exercises and hands-on activities</p>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {practicals.filter(Boolean).length} exercise{practicals.filter(Boolean).length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-2">
          {practicals.map((practical, idx) => (
            <div key={idx} className="flex items-start gap-3 group">
              <span className="flex-shrink-0 mt-2 text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded w-10 text-center">
                P{idx + 1}
              </span>
              <textarea
                value={practical}
                onChange={e => updatePractical(idx, e.target.value)}
                disabled={readOnly}
                placeholder={`Practical exercise ${idx + 1}: e.g., "Implement a linked list with insert, delete and search operations"`}
                rows={2}
                className={`flex-1 ${inputCls} resize-none`}
              />
              {!readOnly && practicals.length > 1 && (
                <button
                  onClick={() => removePractical(idx)}
                  className="flex-shrink-0 mt-1 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <button
            onClick={addPractical}
            className="mt-3 flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-800 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Exercise
          </button>
        )}
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
            <button type="button" onClick={onNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
