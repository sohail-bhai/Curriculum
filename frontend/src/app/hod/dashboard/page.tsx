'use client'
/**
 * HOD Dashboard
 * Department management interface with subject lifecycle, review queue, and analytics
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import DashboardLayout from '@/components/shared/DashboardLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/Badge'
import Button from '@/components/ui/Button'
import { Input } from '@/components/form'
import {
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Eye,
  Download,
  TrendingUp,
  Plus,
  X,
} from 'lucide-react'
import { subjectsAPI, authAPI } from '@/lib/api'
import toast from 'react-hot-toast'

const statusLabels: Record<string, string> = {
  PENDING: 'Not Started', DRAFT: 'Draft', SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review', REVISION: 'Revision Needed',
  APPROVED: 'Approved', PUBLISHED: 'Published', REJECTED: 'Rejected',
}

export default function HODDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSubject, setNewSubject] = useState({ subject_code: '', subject_title: '', assigned_faculty: '' })
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isAuthenticated) router.replace('/auth/login')
  }, [isAuthenticated, router])

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['hod-subjects'],
    queryFn: () => subjectsAPI.hodList().then(r => r.data?.results ?? r.data ?? []),
    enabled: isAuthenticated,
  })

  const { data: facultyList = [] } = useQuery({
    queryKey: ['faculty-list', user?.department],
    queryFn: () => authAPI.facultyList(user?.department ?? undefined).then(r => r.data?.results ?? r.data ?? []),
    enabled: isAuthenticated && !!user?.department,
  })

  const createMutation = useMutation({
    mutationFn: (data: { subject_code: string; subject_title: string; department: number; assigned_faculty: number }) =>
      subjectsAPI.hodCreate(data),
    onSuccess: () => {
      toast.success('Subject created and assigned!')
      queryClient.invalidateQueries({ queryKey: ['hod-subjects'] })
      setShowAddModal(false)
      setNewSubject({ subject_code: '', subject_title: '', assigned_faculty: '' })
    },
    onError: (err: any) => {
      const detail = err.response?.data
      const msg = typeof detail === 'object'
        ? Object.values(detail).flat().join('. ')
        : detail?.detail || 'Failed to create subject.'
      toast.error(msg)
    },
  })

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.subject_code || !newSubject.subject_title || !newSubject.assigned_faculty) {
      toast.error('All fields are required.')
      return
    }
    createMutation.mutate({
      subject_code: newSubject.subject_code,
      subject_title: newSubject.subject_title,
      department: user!.department!,
      assigned_faculty: Number(newSubject.assigned_faculty),
    })
  }

  // Statistics
  const stats = {
    total: subjects.length,
    approved: subjects.filter((s: any) => s.status === 'APPROVED').length,
    underReview: subjects.filter((s: any) => ['SUBMITTED', 'UNDER_REVIEW'].includes(s.status)).length,
    needingWork: subjects.filter((s: any) => ['DRAFT', 'REVISION'].includes(s.status)).length,
    avgCompletion: subjects.length
      ? Math.round(subjects.reduce((sum: number, s: any) => sum + (s.completion_percentage ?? 0), 0) / subjects.length)
      : 0,
  }

  // Filter subjects
  const filteredSubjects = subjects.filter((subject: any) => {
    const matchesSearch =
      (subject.subject_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subject.subject_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subject.assigned_faculty_name || '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = !filterStatus || subject.status === filterStatus

    return matchesSearch && matchesFilter
  })

  // Status color mapping
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      DRAFT: 'draft',
      PENDING: 'pending',
      SUBMITTED: 'submitted',
      UNDER_REVIEW: 'under-review',
      APPROVED: 'approved',
      PUBLISHED: 'published',
      REVISION: 'revision',
    }
    return statusMap[status] || 'draft'
  }

  if (!isAuthenticated) return null

  return (
    <DashboardLayout
      title="Department Dashboard"
      breadcrumbs={[{ label: 'HOD Dashboard' }]}
      requiredRole="HOD"
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Subjects', value: stats.total, icon: BookOpen, color: 'blue' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'green' },
          { label: 'Awaiting Review', value: stats.underReview, icon: AlertCircle, color: 'amber' },
          { label: 'Needs Revision', value: stats.needingWork, icon: Clock, color: 'red' },
          { label: 'Avg Completion', value: `${stats.avgCompletion}%`, icon: TrendingUp, color: 'purple' },
        ].map((stat, i) => {
          const IconComponent = stat.icon
          const colorMap = {
            blue: 'bg-blue-50 text-blue-700',
            green: 'bg-green-50 text-green-700',
            amber: 'bg-amber-50 text-amber-700',
            red: 'bg-red-50 text-red-700',
            purple: 'bg-purple-50 text-purple-700',
          }

          return (
            <Card key={i} variant="interactive">
              <div className={`flex items-start justify-between p-4 rounded-lg ${colorMap[stat.color as keyof typeof colorMap]}`}>
                <div>
                  <p className="text-xs font-medium opacity-80">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <IconComponent size={24} className="opacity-60" />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            icon={<Search size={16} />}
            placeholder="Search by code, title, or faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={!filterStatus ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setFilterStatus(null)}
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'APPROVED' ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setFilterStatus('APPROVED')}
          >
            Approved
          </Button>
          <Button
            variant={filterStatus === 'UNDER_REVIEW' ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setFilterStatus('UNDER_REVIEW')}
          >
            Review
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => setShowAddModal(true)}
          >
            Add Subject
          </Button>
        </div>
      </div>

      {/* Subjects Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Subject</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Faculty</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Completion</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Submitted</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <BookOpen size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-600 font-medium">No subjects found</p>
                    <p className="text-sm text-gray-500">Try adjusting your search filters</p>
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject: any) => (
                  <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{subject.subject_code}</p>
                        <p className="text-xs text-gray-600">{subject.subject_title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{subject.assigned_faculty_name || '—'}</td>
                    <td className="px-6 py-4">
                      <Badge status={getStatusBadge(subject.status) as any}>
                        {statusLabels[subject.status] || subject.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${subject.completion_percentage ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-8 text-right">
                          {subject.completion_percentage ?? 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {subject.submitted_at
                        ? new Date(subject.submitted_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/hod/subjects/${subject.id}/review`)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="View / Review"
                        >
                          <Eye size={16} className="text-blue-600" />
                        </button>
                        {['SUBMITTED', 'UNDER_REVIEW'].includes(subject.status) && (
                          <button
                            onClick={() => router.push(`/hod/subjects/${subject.id}/review`)}
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                            title="Review & Approve"
                          >
                            <CheckCircle size={16} className="text-green-600" />
                          </button>
                        )}
                        {subject.status === 'APPROVED' && (
                          <button
                            onClick={async () => {
                              try {
                                const response = await subjectsAPI.downloadPDF(subject.id)
                                const blob = new Blob([response.data], { type: 'application/pdf' })
                                const url = window.URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `${subject.subject_code}_syllabus.pdf`
                                a.click()
                                window.URL.revokeObjectURL(url)
                                toast.success('PDF downloaded!')
                              } catch {
                                toast.error('PDF download failed')
                              }
                            }}
                            className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download size={16} className="text-amber-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review Queue Section */}
      {stats.underReview > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Review Queue ({stats.underReview})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects
              .filter((s: any) => ['SUBMITTED', 'UNDER_REVIEW'].includes(s.status))
              .map((subject: any) => (
                <Card key={subject.id} variant="interactive" className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{subject.subject_code}</h3>
                      <p className="text-sm text-gray-600">{subject.subject_title}</p>
                      <p className="text-xs text-gray-500 mt-1">by {subject.assigned_faculty_name || 'Unassigned'}</p>
                    </div>
                    <Badge status={getStatusBadge(subject.status) as any}>
                      {statusLabels[subject.status] || subject.status}
                    </Badge>
                  </div>

                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Completion</span>
                      <span className="font-semibold text-gray-900">{subject.completion_percentage ?? 0}%</span>
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      icon={<Eye size={14} />}
                      onClick={() => router.push(`/hod/subjects/${subject.id}/review`)}
                    >
                      Review
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Add New Subject</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Code *</label>
                <input
                  type="text"
                  value={newSubject.subject_code}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, subject_code: e.target.value }))}
                  placeholder="e.g. 24CSE301"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Title *</label>
                <input
                  type="text"
                  value={newSubject.subject_title}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, subject_title: e.target.value }))}
                  placeholder="e.g. Data Structures and Algorithms"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign to Faculty *</label>
                <select
                  value={newSubject.assigned_faculty}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, assigned_faculty: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                >
                  <option value="">Select faculty member...</option>
                  {facultyList.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.full_name || f.first_name + ' ' + f.last_name} — {f.designation || 'Faculty'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={<Plus size={16} />}
                  loading={createMutation.isPending}
                >
                  Create Subject
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
