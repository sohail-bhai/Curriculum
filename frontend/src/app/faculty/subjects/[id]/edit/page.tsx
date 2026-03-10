'use client'
import { useParams } from 'next/navigation'
import FacultySubjectEditor from '@/components/faculty/SubjectEditor'

export default function EditSubjectPage() {
  const params = useParams()
  const subjectId = parseInt(params.id as string)
  return <FacultySubjectEditor subjectId={subjectId} />
}
