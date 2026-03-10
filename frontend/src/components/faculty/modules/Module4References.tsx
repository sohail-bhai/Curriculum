'use client'
/**
 * Module 4 — Textbooks & References
 * Two separate dynamic lists: Textbooks (with ISBN) and References (with URL).
 */
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { subjectsAPI } from '@/lib/api'
import { Plus, Trash2, Save, ChevronLeft, ChevronRight, Loader2, BookOpen, Link as LinkIcon } from 'lucide-react'

interface Textbook {
  title: string
  authors: string
  publisher: string
  year: string
  isbn: string
}

interface Reference {
  title: string
  url: string
}

interface Props {
  subjectId: number
  readOnly: boolean
  onSaved: () => void
  onNext: () => void
  onBack: () => void
}

const EMPTY_TEXTBOOK: Textbook = { title: '', authors: '', publisher: '', year: '', isbn: '' }
const EMPTY_REFERENCE: Reference = { title: '', url: '' }

export default function Module4References({ subjectId, readOnly, onSaved, onNext, onBack }: Props) {
  const queryClient = useQueryClient()
  const [textbooks, setTextbooks] = useState<Textbook[]>([{ ...EMPTY_TEXTBOOK }])
  const [references, setReferences] = useState<Reference[]>([{ ...EMPTY_REFERENCE }])

  const { data, isLoading } = useQuery({
    queryKey: ['module-4', subjectId],
    queryFn: () => subjectsAPI.getModuleData(subjectId, 4).then(r => r.data),
  })

  useEffect(() => {
    if (data) {
      if (data.textbooks?.length > 0) {
        setTextbooks(data.textbooks.map((tb: any) => ({
          title: tb.citation || tb.title || '',
          authors: tb.authors || '',
          publisher: tb.publisher || '',
          year: tb.year || '',
          isbn: tb.isbn || '',
        })))
      }
      if (data.references?.length > 0) {
        setReferences(data.references.map((ref: any) => ({
          title: ref.citation || ref.title || '',
          url: ref.url || '',
        })))
      }
    }
  }, [data])

  // Textbook operations
  const addTextbook = () => setTextbooks(prev => [...prev, { ...EMPTY_TEXTBOOK }])
  const removeTextbook = (i: number) => setTextbooks(prev => prev.filter((_, idx) => idx !== i))
  const updateTextbook = (i: number, field: keyof Textbook, value: string) => {
    setTextbooks(prev => prev.map((tb, idx) => idx === i ? { ...tb, [field]: value } : tb))
  }

  // Reference operations
  const addReference = () => setReferences(prev => [...prev, { ...EMPTY_REFERENCE }])
  const removeReference = (i: number) => setReferences(prev => prev.filter((_, idx) => idx !== i))
  const updateReference = (i: number, field: keyof Reference, value: string) => {
    setReferences(prev => prev.map((ref, idx) => idx === i ? { ...ref, [field]: value } : ref))
  }

  const mutation = useMutation({
    mutationFn: () =>
      subjectsAPI.saveModule(subjectId, 4, {
        textbooks: textbooks.filter(tb => tb.title).map((tb) => ({
          citation: [tb.title, tb.authors, tb.publisher, tb.year].filter(Boolean).join(', '),
          isbn: tb.isbn,
        })),
        references: references.filter(ref => ref.title).map((ref) => ({
          citation: ref.title,
          url: ref.url,
        })),
      }),
    onSuccess: () => {
      toast.success('Textbooks and references saved.')
      queryClient.invalidateQueries({ queryKey: ['module-4', subjectId] })
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

  return (
    <div className="space-y-6">

      {/* Textbooks Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-600" />
            <div>
              <h3 className="text-base font-semibold text-gray-800">Textbooks</h3>
              <p className="text-xs text-gray-500">Primary and supplementary textbooks for the course</p>
            </div>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {textbooks.filter(tb => tb.title).length} book{textbooks.filter(tb => tb.title).length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-4">
          {textbooks.map((tb, idx) => (
            <div key={idx} className="relative p-4 border border-gray-200 rounded-lg bg-gray-50 group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-1 rounded">
                  Book {idx + 1}
                </span>
                {!readOnly && textbooks.length > 1 && (
                  <button
                    onClick={() => removeTextbook(idx)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
                  <input
                    value={tb.title}
                    onChange={e => updateTextbook(idx, 'title', e.target.value)}
                    disabled={readOnly}
                    placeholder="e.g., Introduction to Algorithms"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Authors</label>
                  <input
                    value={tb.authors}
                    onChange={e => updateTextbook(idx, 'authors', e.target.value)}
                    disabled={readOnly}
                    placeholder="e.g., Cormen, Leiserson, Rivest"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Publisher</label>
                  <input
                    value={tb.publisher}
                    onChange={e => updateTextbook(idx, 'publisher', e.target.value)}
                    disabled={readOnly}
                    placeholder="e.g., MIT Press"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Year</label>
                  <input
                    value={tb.year}
                    onChange={e => updateTextbook(idx, 'year', e.target.value)}
                    disabled={readOnly}
                    placeholder="e.g., 2022"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ISBN</label>
                  <input
                    value={tb.isbn}
                    onChange={e => updateTextbook(idx, 'isbn', e.target.value)}
                    disabled={readOnly}
                    placeholder="e.g., 978-0-262-04630-5"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {!readOnly && (
          <button
            onClick={addTextbook}
            className="mt-4 flex items-center gap-1.5 text-sm text-cyan-600 hover:text-cyan-800 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Textbook
          </button>
        )}
      </div>

      {/* References Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-base font-semibold text-gray-800">References & Online Resources</h3>
              <p className="text-xs text-gray-500">Additional reference materials, journals, and web resources</p>
            </div>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {references.filter(r => r.title).length} ref{references.filter(r => r.title).length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-3">
          {references.map((ref, idx) => (
            <div key={idx} className="flex items-start gap-3 group">
              <span className="flex-shrink-0 mt-2 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded w-10 text-center">
                R{idx + 1}
              </span>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="md:col-span-2">
                  <input
                    value={ref.title}
                    onChange={e => updateReference(idx, 'title', e.target.value)}
                    disabled={readOnly}
                    placeholder="Reference title or description"
                    className={inputCls}
                  />
                </div>
                <div>
                  <input
                    value={ref.url}
                    onChange={e => updateReference(idx, 'url', e.target.value)}
                    disabled={readOnly}
                    placeholder="URL (optional)"
                    className={inputCls}
                  />
                </div>
              </div>
              {!readOnly && references.length > 1 && (
                <button
                  onClick={() => removeReference(idx)}
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
            onClick={addReference}
            className="mt-3 flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-800 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Reference
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
