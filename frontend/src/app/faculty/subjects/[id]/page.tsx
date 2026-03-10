'use client'
/**
 * Subject Detail Page
 * Read-only overview of a subject with navigation to edit mode.
 * Fetches real data from the API and displays subject information organized by modules.
 */
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import DashboardLayout from '@/components/shared/DashboardLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/Badge'
import {
  BookOpen, Target, BookMarked, Award, Leaf, Loader2,
  Edit3, Download, ArrowLeft, Clock, User, Hash
} from 'lucide-react'
import { subjectsAPI } from '@/lib/api'
import toast from 'react-hot-toast'

const statusMap: Record<string, string> = {
  PENDING: 'pending',
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under-review',
  REVISION: 'revision',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Not Started', DRAFT: 'Draft', SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review', REVISION: 'Revision Needed',
  APPROVED: 'Approved', PUBLISHED: 'Published', REJECTED: 'Rejected',
}

export default function SubjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { isAuthenticated } = useAuthStore()
  const subjectId = parseInt(params?.id as string)

  useEffect(() => {
    if (!isAuthenticated) router.replace('/auth/login')
  }, [isAuthenticated, router])

  const { data: subject, isLoading, error } = useQuery({
    queryKey: ['subject-detail', subjectId],
    queryFn: () => subjectsAPI.facultyDetail(subjectId).then(r => r.data),
    enabled: !!subjectId && isAuthenticated,
  })

  const handleDownloadPDF = async () => {
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

  if (!isAuthenticated) return null

  if (isLoading) {
    return (
      <DashboardLayout title="Subject Details">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !subject) {
    return (
      <DashboardLayout title="Subject Details">
        <div className="text-center py-16">
          <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Subject Not Found</h3>
          <p className="text-gray-600 mb-6">The subject you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.</p>
          <Button variant="secondary" onClick={() => router.push('/faculty/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const isEditable = subject.is_editable_by_faculty

  return (
    <DashboardLayout
      title={subject.subject_title}
      breadcrumbs={[
        { label: 'My Subjects', href: '/faculty/dashboard' },
        { label: subject.subject_code },
      ]}
    >
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header Card */}
        <Card>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
                  {subject.subject_code}
                </span>
                <Badge status={statusMap[subject.status] as any}>
                  {statusLabels[subject.status] || subject.status}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{subject.subject_title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {subject.assigned_faculty_name && (
                  <span className="flex items-center gap-1.5">
                    <User size={14} /> {subject.assigned_faculty_name}
                  </span>
                )}
                {subject.department_name && (
                  <span className="flex items-center gap-1.5">
                    <Hash size={14} /> {subject.department_name}
                  </span>
                )}
                {subject.updated_at && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} /> Updated {new Date(subject.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                variant="secondary"
                size="md"
                icon={<ArrowLeft size={16} />}
                onClick={() => router.push('/faculty/dashboard')}
              >
                Back
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={<Download size={16} />}
                onClick={handleDownloadPDF}
              >
                PDF
              </Button>
              {isEditable && (
                <Button
                  variant="primary"
                  size="md"
                  icon={<Edit3 size={16} />}
                  onClick={() => router.push(`/faculty/subjects/${subjectId}/edit`)}
                >
                  Edit Subject
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {subject.completion_percentage !== undefined && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Completion Progress</span>
                <span className="text-xs font-bold text-blue-600">{subject.completion_percentage}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${subject.completion_percentage}%` }}
                />
              </div>
            </div>
          )}
        </Card>

        {/* LTPSIC Summary */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-blue-600" /> Basic Information
          </h2>
          <div className="grid grid-cols-6 gap-3 mb-6">
            {[
              { label: 'L', value: subject.lecture_hours, title: 'Lecture' },
              { label: 'T', value: subject.tutorial_hours, title: 'Tutorial' },
              { label: 'P', value: subject.practical_hours, title: 'Practical' },
              { label: 'S', value: subject.studio_hours, title: 'Studio' },
              { label: 'I', value: subject.independent_hours, title: 'Independent' },
              { label: 'C', value: subject.credits, title: 'Credits' },
            ].map(item => (
              <div key={item.label} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs font-bold text-blue-700 mb-1">{item.label}</div>
                <div className="text-lg font-bold text-gray-900">{item.value ?? 'â€”'}</div>
                <div className="text-xs text-gray-500">{item.title}</div>
              </div>
            ))}
          </div>

          {subject.pre_requisite && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-gray-700">Pre-requisite: </span>
              <span className="text-sm text-gray-600">{subject.pre_requisite}</span>
            </div>
          )}
          {subject.co_requisite && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-gray-700">Co-requisite: </span>
              <span className="text-sm text-gray-600">{subject.co_requisite}</span>
            </div>
          )}
          {subject.course_description && (
            <div>
              <span className="text-xs font-semibold text-gray-700">Course Description:</span>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{subject.course_description}</p>
            </div>
          )}
          {!subject.course_description && !subject.pre_requisite && (
            <p className="text-sm text-gray-400 italic">No basic information filled yet.</p>
          )}
        </Card>

        {/* Objectives */}
        {subject.objectives?.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={20} className="text-purple-600" /> Course Objectives
            </h2>
            <ol className="space-y-2">
              {subject.objectives.map((obj: any, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded w-8 text-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700">{obj.text || obj}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* Units & Topics */}
        {subject.units?.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookMarked size={20} className="text-indigo-600" /> Units & Topics
            </h2>
            <div className="space-y-4">
              {subject.units.map((unit: any, i: number) => (
                <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                      Unit {i + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{unit.title}</span>
                  </div>
                  {unit.topics?.length > 0 && (
                    <div className="p-4">
                      <ul className="space-y-1.5">
                        {unit.topics.map((topic: any, j: number) => (
                          <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="text-xs text-gray-400">{i + 1}.{j + 1}</span>
                            <span>{topic.title}</span>
                            {topic.hours > 0 && (
                              <span className="text-xs text-gray-400 ml-auto">{topic.hours}h</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Course Outcomes */}
        {subject.outcomes?.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={20} className="text-emerald-600" /> Course Outcomes
            </h2>
            <div className="space-y-2">
              {subject.outcomes.map((co: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded w-10 text-center mt-0.5">
                    CO{i + 1}
                  </span>
                  <span className="text-sm text-gray-700">{co.text || co}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* SDG Info */}
        {subject.sdg_mappings?.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Leaf size={20} className="text-green-600" /> SDG Mapping
            </h2>
            <div className="space-y-3">
              {subject.sdg_mappings.map((sdg: any, i: number) => (
                <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm font-semibold text-green-800">
                    SDG {sdg.sdg_number}: {sdg.theme}
                  </div>
                  {sdg.justification && (
                    <p className="text-xs text-green-700 mt-1">{sdg.justification}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Empty State - No data filled yet */}
        {!subject.course_description && !subject.objectives?.length && !subject.units?.length && (
          <Card>
            <div className="text-center py-8">
              <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Content Yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                This subject hasn&apos;t been filled in yet. Click &quot;Edit Subject&quot; to start working on it.
              </p>
              {isEditable && (
                <Button
                  variant="primary"
                  icon={<Edit3 size={16} />}
                  onClick={() => router.push(`/faculty/subjects/${subjectId}/edit`)}
                >
                  Start Editing
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
