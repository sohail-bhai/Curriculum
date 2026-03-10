'use client'
/**
 * HOD Dashboard
 * Two panels: Subject Assignment + Review Queue
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { subjectsAPI, coreAPI, authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import {
  Plus, Eye, CheckCircle, MessageSquare,
  Users, BookOpen, Clock, AlertCircle, Loader2
} from 'lucide-react'

const createSubjectSchema = z.object({
  subject_code: z.string().min(2, 'Code required'),
  subject_title: z.string().min(3, 'Title required'),
  curriculum_version: z.number().optional().nullable(),
  assigned_faculty: z.number({ required_error: 'Select a faculty member' }),
})
type CreateSubjectForm = z.infer<typeof createSubjectSchema>

export default function HODDashboard() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [reviewSubjectId, setReviewSubjectId] = useState<number | null>(null)
  const [revisionComment, setRevisionComment] = useState('')
  const [activeTab, setActiveTab] = useState<'assignment' | 'review'>('assignment')

  // Data queries
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['hod-subjects'],
    queryFn: () => subjectsAPI.hodList().then(r => r.data.results || r.data),
  })

  const { data: facultyList = [] } = useQuery({
    queryKey: ['faculty-list', user?.department],
    queryFn: () => authAPI.facultyList(user?.department || undefined).then(r => r.data.results || r.data),
  })

  const { data: cvList = [] } = useQuery({
    queryKey: ['cv-list'],
    queryFn: () => coreAPI.curriculumVersions().then(r => r.data.results || r.data),
  })

  // Create subject mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateSubjectForm) => subjectsAPI.hodCreate({
      ...data,
      department: user?.department,
    }),
    onSuccess: () => {
      toast.success('Subject created and assigned to faculty!')
      queryClient.invalidateQueries({ queryKey: ['hod-subjects'] })
      setShowCreateForm(false)
      reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Creation failed.'),
  })

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: number) => subjectsAPI.hodApprove(id),
    onSuccess: () => {
      toast.success('Subject approved!')
      queryClient.invalidateQueries({ queryKey: ['hod-subjects'] })
      setReviewSubjectId(null)
    },
  })

  // Request revision mutation
  const revisionMutation = useMutation({
    mutationFn: ({ id, comments }: { id: number; comments: string }) =>
      subjectsAPI.hodRequestRevision(id, comments),
    onSuccess: () => {
      toast.success('Revision requested. Faculty notified.')
      queryClient.invalidateQueries({ queryKey: ['hod-subjects'] })
      setReviewSubjectId(null)
      setRevisionComment('')
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSubjectForm>({
    resolver: zodResolver(createSubjectSchema),
  })

  // Stats
  const stats = {
    total: subjects.length,
    pending: subjects.filter((s: any) => s.status === 'PENDING').length,
    submitted: subjects.filter((s: any) => s.status === 'SUBMITTED').length,
    approved: subjects.filter((s: any) => s.status === 'APPROVED').length,
  }

  const submittedSubjects = subjects.filter((s: any) =>
    ['SUBMITTED', 'UNDER_REVIEW'].includes(s.status)
  )

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <h1 className="text-2xl font-serif font-bold text-gray-900">HOD Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {user?.department_name} — {user?.full_name}
        </p>
      </div>

      <div className="px-8 py-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Subjects', value: stats.total, icon: BookOpen, color: 'blue' },
            { label: 'Pending Start', value: stats.pending, icon: Clock, color: 'gray' },
            { label: 'Awaiting Review', value: stats.submitted, icon: AlertCircle, color: 'amber' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'green' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              </div>
              <div className="text-2xl font-bold font-mono text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('assignment')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'assignment' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Subject Assignment
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'review' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Review Queue
            {stats.submitted > 0 && (
              <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {stats.submitted}
              </span>
            )}
          </button>
        </div>

        {/* Panel 1: Subject Assignment */}
        {activeTab === 'assignment' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">All Subjects</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Assign Subject
              </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
              <div className="p-5 border-b border-gray-200 bg-blue-50">
                <h3 className="text-sm font-semibold text-blue-900 mb-4">Create & Assign Subject</h3>
                <form onSubmit={handleSubmit(d => createMutation.mutate(d))}
                  className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Subject Code *</label>
                    <input {...register('subject_code')} placeholder="CS3001" className={inputCls} />
                    {errors.subject_code && <p className="text-red-500 text-xs mt-0.5">{errors.subject_code.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Subject Title *</label>
                    <input {...register('subject_title')} placeholder="Data Structures" className={inputCls} />
                    {errors.subject_title && <p className="text-red-500 text-xs mt-0.5">{errors.subject_title.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Curriculum Version</label>
                    <select {...register('curriculum_version', { valueAsNumber: true })} className={inputCls}>
                      <option value="">Select version</option>
                      {cvList.map((cv: any) => (
                        <option key={cv.id} value={cv.id}>{cv.programme_code} v{cv.version}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Assign to Faculty *</label>
                    <select {...register('assigned_faculty', { valueAsNumber: true })} className={inputCls}>
                      <option value="">Select faculty member</option>
                      {facultyList.map((f: any) => (
                        <option key={f.id} value={f.id}>{f.full_name} — {f.designation}</option>
                      ))}
                    </select>
                    {errors.assigned_faculty && <p className="text-red-500 text-xs mt-0.5">{errors.assigned_faculty.message}</p>}
                  </div>
                  <div className="col-span-2 flex gap-3 justify-end">
                    <button type="button" onClick={() => { setShowCreateForm(false); reset() }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                      Cancel
                    </button>
                    <button type="submit" disabled={createMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
                      {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Create & Assign
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Subjects Table */}
            {subjectsLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin w-6 h-6 text-blue-600" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Code', 'Title', 'Faculty', 'LTPSIC', 'Status', 'Progress', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s: any) => (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-blue-700 font-semibold text-xs">{s.subject_code}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.subject_title}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-gray-400" />
                          {s.assigned_faculty_name || <span className="text-red-400">Unassigned</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.ltpsic}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${s.completion_percentage}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{s.completion_percentage}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <a href={`/hod/subjects/${s.id}/review`}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                            <Eye className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {subjects.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">No subjects yet. Create and assign subjects above.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Panel 2: Review Queue */}
        {activeTab === 'review' && (
          <div className="space-y-4">
            {submittedSubjects.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="font-medium">No subjects pending review</p>
              </div>
            ) : (
              submittedSubjects.map((s: any) => (
                <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-blue-700 font-bold">{s.subject_code}</span>
                        <StatusBadge status={s.status} />
                      </div>
                      <h3 className="font-semibold text-gray-800 mt-1">{s.subject_title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        By {s.assigned_faculty_name} · Submitted {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a href={`/hod/subjects/${s.id}/review`}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 hover:bg-gray-100 rounded-lg text-sm text-gray-700">
                        <Eye className="w-4 h-4" /> View
                      </a>
                      <button onClick={() => setReviewSubjectId(s.id === reviewSubjectId ? null : s.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 hover:bg-gray-100 rounded-lg text-sm text-gray-700">
                        <MessageSquare className="w-4 h-4" /> Review
                      </button>
                    </div>
                  </div>

                  {/* Review Actions */}
                  {reviewSubjectId === s.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Comments (required for revision request)
                          </label>
                          <textarea
                            value={revisionComment}
                            onChange={e => setRevisionComment(e.target.value)}
                            rows={3}
                            placeholder="Provide feedback or revision notes..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => approveMutation.mutate(s.id)}
                          disabled={approveMutation.isPending}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-50"
                        >
                          {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Approve
                        </button>
                        <button
                          onClick={() => revisionMutation.mutate({ id: s.id, comments: revisionComment })}
                          disabled={!revisionComment || revisionMutation.isPending}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm disabled:opacity-50"
                        >
                          Request Revision
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING:      'bg-gray-100 text-gray-600',
    DRAFT:        'bg-blue-100 text-blue-700',
    SUBMITTED:    'bg-amber-100 text-amber-700',
    UNDER_REVIEW: 'bg-purple-100 text-purple-700',
    REVISION:     'bg-orange-100 text-orange-700',
    APPROVED:     'bg-green-100 text-green-700',
    PUBLISHED:    'bg-teal-100 text-teal-700',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
