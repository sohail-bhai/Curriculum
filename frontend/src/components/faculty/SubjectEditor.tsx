'use client'
/**
 * FacultySubjectEditor
 * Modular 6-step syllabus editor with free navigation.
 * Each module saves independently via the API.
 */
import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { subjectsAPI } from '@/lib/api'
import Module1BasicInfo from './modules/Module1BasicInfo'
import Module2Objectives from './modules/Module2Objectives'
import Module3UnitsTopics from './modules/Module3UnitsTopics'
import Module4References from './modules/Module4References'
import Module5Outcomes from './modules/Module5Outcomes'
import Module6SDGSme from './modules/Module6SDGSme'
import { CheckCircle, Circle, Loader2, Send, RotateCcw, Download } from 'lucide-react'

const MODULES = [
  { num: 1, label: 'Basic Info',      icon: '①', description: 'Code, credits, LTPSIC' },
  { num: 2, label: 'Objectives',      icon: '②', description: 'Course objectives' },
  { num: 3, label: 'Units & Topics',  icon: '③', description: 'Content + practicals' },
  { num: 4, label: 'References',      icon: '④', description: 'Textbooks + references' },
  { num: 5, label: 'Outcomes',        icon: '⑤', description: 'COs + articulation' },
  { num: 6, label: 'SDG & SME',       icon: '⑥', description: 'Mapping + SME details' },
]

interface Props {
  subjectId: number
}

export default function FacultySubjectEditor({ subjectId }: Props) {
  const [activeModule, setActiveModule] = useState(1)
  const [savedModules, setSavedModules] = useState<Set<number>>(new Set())
  const queryClient = useQueryClient()

  // Fetch subject header info
  const { data: subject, isLoading: subjectLoading } = useQuery({
    queryKey: ['subject-detail', subjectId],
    queryFn: () => subjectsAPI.facultyDetail(subjectId).then(r => r.data),
  })

  // Submit to HOD mutation
  const submitMutation = useMutation({
    mutationFn: () => subjectsAPI.submit(subjectId),
    onSuccess: () => {
      toast.success('Submitted to HOD successfully!')
      queryClient.invalidateQueries({ queryKey: ['subject-detail', subjectId] })
      queryClient.invalidateQueries({ queryKey: ['faculty-subjects'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Submission failed.')
    },
  })

  // Retract mutation
  const retractMutation = useMutation({
    mutationFn: () => subjectsAPI.retract(subjectId),
    onSuccess: () => {
      toast.success('Submission retracted.')
      queryClient.invalidateQueries({ queryKey: ['subject-detail', subjectId] })
    },
  })

  // Download PDF
  const handleDownload = async () => {
    try {
      const response = await subjectsAPI.downloadPDF(subjectId)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${subject?.subject_code}_syllabus.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch {
      toast.error('PDF generation failed.')
    }
  }

  const handleModuleSaved = useCallback((moduleNum: number) => {
    setSavedModules(prev => new Set([...prev, moduleNum]))
  }, [])

  const handleNext = () => {
    if (activeModule < 6) setActiveModule(activeModule + 1)
  }

  const handleBack = () => {
    if (activeModule > 1) setActiveModule(activeModule - 1)
  }

  if (subjectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    )
  }

  const isEditable = subject?.is_editable_by_faculty
  const isSubmitted = subject?.status === 'SUBMITTED'

  return (
    <div className="flex h-full min-h-screen bg-gray-50">

      {/* LEFT SIDEBAR — Module Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Subject Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="text-xs font-mono text-blue-700 font-semibold tracking-wider">
            {subject?.subject_code}
          </div>
          <div className="text-sm font-semibold text-gray-800 mt-1 leading-tight">
            {subject?.subject_title}
          </div>
          <div className="mt-2">
            <StatusBadge status={subject?.status} />
          </div>
          {/* Completion Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Completion</span>
              <span>{subject?.completion_percentage}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${subject?.completion_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Module Navigation */}
        <nav className="p-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
            Modules
          </div>
          {MODULES.map(mod => (
            <button
              key={mod.num}
              onClick={() => setActiveModule(mod.num)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-left transition-all ${
                activeModule === mod.num
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex-shrink-0">
                {savedModules.has(mod.num) ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300" />
                )}
              </span>
              <div>
                <div className="text-xs font-semibold">{mod.label}</div>
                <div className="text-xs text-gray-400">{mod.description}</div>
              </div>
            </button>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="p-3 border-t border-gray-200 space-y-2">
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>

          {isEditable && (
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors disabled:opacity-50"
            >
              {submitMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit to HOD
            </button>
          )}

          {isSubmitted && (
            <button
              onClick={() => retractMutation.mutate()}
              disabled={retractMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-amber-500 hover:bg-amber-600 rounded-lg text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Retract
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT — Active Module */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-8 max-w-4xl mx-auto"
          >
            {/* Module Header */}
            <div className="mb-6">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                Module {activeModule} of 6
              </div>
              <h2 className="text-2xl font-serif font-bold text-gray-900">
                {MODULES[activeModule - 1].label}
              </h2>
            </div>

            {/* Module Content */}
            {!isEditable && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                ⚠️ This subject is <strong>{subject?.status}</strong> and cannot be edited.
              </div>
            )}

            {activeModule === 1 && (
              <Module1BasicInfo
                subjectId={subjectId}
                readOnly={!isEditable}
                onSaved={() => handleModuleSaved(1)}
                onNext={handleNext}
              />
            )}
            {activeModule === 2 && (
              <Module2Objectives
                subjectId={subjectId}
                readOnly={!isEditable}
                onSaved={() => handleModuleSaved(2)}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {activeModule === 3 && (
              <Module3UnitsTopics
                subjectId={subjectId}
                readOnly={!isEditable}
                onSaved={() => handleModuleSaved(3)}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {activeModule === 4 && (
              <Module4References
                subjectId={subjectId}
                readOnly={!isEditable}
                onSaved={() => handleModuleSaved(4)}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {activeModule === 5 && (
              <Module5Outcomes
                subjectId={subjectId}
                readOnly={!isEditable}
                onSaved={() => handleModuleSaved(5)}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {activeModule === 6 && (
              <Module6SDGSme
                subjectId={subjectId}
                readOnly={!isEditable}
                onSaved={() => handleModuleSaved(6)}
                onBack={handleBack}
                onSubmit={() => submitMutation.mutate()}
                isSubmitting={submitMutation.isPending}
                isEditable={!!isEditable}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const styles: Record<string, string> = {
    PENDING:      'bg-gray-100 text-gray-600',
    DRAFT:        'bg-blue-100 text-blue-700',
    SUBMITTED:    'bg-amber-100 text-amber-700',
    UNDER_REVIEW: 'bg-purple-100 text-purple-700',
    REVISION:     'bg-orange-100 text-orange-700',
    APPROVED:     'bg-green-100 text-green-700',
    PUBLISHED:    'bg-teal-100 text-teal-700',
    REJECTED:     'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status || ''] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace('_', ' ')}
    </span>
  )
}
