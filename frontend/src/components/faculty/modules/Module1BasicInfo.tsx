'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { subjectsAPI } from '@/lib/api'
import { Save, ChevronRight, Loader2 } from 'lucide-react'

const schema = z.object({
  lecture_hours:    z.coerce.number().min(0),
  tutorial_hours:   z.coerce.number().min(0),
  practical_hours:  z.coerce.number().min(0),
  studio_hours:     z.coerce.number().min(0),
  independent_hours:z.coerce.number().min(0),
  credits:          z.coerce.number().min(0),
  pre_requisite:    z.string().optional(),
  co_requisite:     z.string().optional(),
  course_description: z.string().min(1, 'Course description is required'),
})

type FormData = z.infer<typeof schema>

interface Props {
  subjectId: number
  readOnly: boolean
  onSaved: () => void
  onNext: () => void
}

export default function Module1BasicInfo({ subjectId, readOnly, onSaved, onNext }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['module-1', subjectId],
    queryFn: () => subjectsAPI.getModuleData(subjectId, 1).then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      lecture_hours: 0, tutorial_hours: 0, practical_hours: 0,
      studio_hours: 0, independent_hours: 0, credits: 0,
      pre_requisite: '', co_requisite: '', course_description: '',
    },
  })

  useEffect(() => {
    if (data) reset(data)
  }, [data, reset])

  const mutation = useMutation({
    mutationFn: (formData: FormData) => subjectsAPI.saveModule(subjectId, 1, formData),
    onSuccess: () => {
      toast.success('Basic information saved.')
      onSaved()
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Save failed.'),
  })

  const onSubmit = (data: FormData) => mutation.mutate(data)

  if (isLoading) return <LoadingState />

  const inputCls = `w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${readOnly ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`

  const ltpsicFields = [
    { name: 'lecture_hours' as const, label: 'L', title: 'Lecture' },
    { name: 'tutorial_hours' as const, label: 'T', title: 'Tutorial' },
    { name: 'practical_hours' as const, label: 'P', title: 'Practical' },
    { name: 'studio_hours' as const, label: 'S', title: 'Studio' },
    { name: 'independent_hours' as const, label: 'I', title: 'Independent' },
    { name: 'credits' as const, label: 'C', title: 'Credits' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* LTPSIC Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          L – T – P – S – I – C (Hours & Credits)
        </label>
        <div className="grid grid-cols-6 gap-3">
          {ltpsicFields.map(field => (
            <div key={field.name}>
              <label className="block text-center text-xs font-bold text-blue-700 mb-1.5">
                {field.label}
              </label>
              <input
                {...register(field.name)}
                type="number" step="0.5" min="0"
                disabled={readOnly}
                title={field.title}
                className={`${inputCls} text-center`}
              />
              {errors[field.name] && (
                <p className="text-red-500 text-xs mt-0.5 text-center">!</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pre/Co Requisites */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pre-requisite</label>
            <input
              {...register('pre_requisite')}
              placeholder="Subject code or NIL"
              disabled={readOnly}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Co-requisite</label>
            <input
              {...register('co_requisite')}
              placeholder="Subject code or NIL"
              disabled={readOnly}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Course Description */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Course Description <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('course_description')}
          rows={5}
          disabled={readOnly}
          placeholder="Provide a comprehensive description of the course content, scope, and learning approach..."
          className={`${inputCls} resize-y`}
        />
        {errors.course_description && (
          <p className="text-red-500 text-xs mt-1">{errors.course_description.message}</p>
        )}
      </div>

      {/* Action Buttons */}
      {!readOnly && (
        <div className="flex justify-between pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
          <button
            type="button"
            onClick={() => { handleSubmit(onSubmit)(); setTimeout(onNext, 300) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium"
          >
            Save & Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      {readOnly && (
        <div className="flex justify-end">
          <button type="button" onClick={onNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </form>
  )
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1,2,3].map(i => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-3" />
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}
