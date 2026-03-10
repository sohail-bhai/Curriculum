'use client'
/**
 * Module 6 — SDG Mapping & Subject Matter Expert (SME) Details
 * Final module: Map UN Sustainable Development Goals and provide SME information.
 */
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { subjectsAPI } from '@/lib/api'
import { Plus, Trash2, Save, ChevronLeft, Loader2, Send, Leaf } from 'lucide-react'

const SDG_LIST = [
  { num: 1,  label: 'No Poverty' },
  { num: 2,  label: 'Zero Hunger' },
  { num: 3,  label: 'Good Health and Well-Being' },
  { num: 4,  label: 'Quality Education' },
  { num: 5,  label: 'Gender Equality' },
  { num: 6,  label: 'Clean Water and Sanitation' },
  { num: 7,  label: 'Affordable and Clean Energy' },
  { num: 8,  label: 'Decent Work and Economic Growth' },
  { num: 9,  label: 'Industry, Innovation and Infrastructure' },
  { num: 10, label: 'Reduced Inequalities' },
  { num: 11, label: 'Sustainable Cities and Communities' },
  { num: 12, label: 'Responsible Consumption and Production' },
  { num: 13, label: 'Climate Action' },
  { num: 14, label: 'Life Below Water' },
  { num: 15, label: 'Life on Land' },
  { num: 16, label: 'Peace, Justice and Strong Institutions' },
  { num: 17, label: 'Partnerships for the Goals' },
]

interface SDGMapping {
  sdg_number: number
  theme: string
  justification: string
}

interface SMEDetail {
  name: string
  designation: string
  organization: string
  experience: string
  expertise_areas: string
}

interface Props {
  subjectId: number
  readOnly: boolean
  onSaved: () => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
  isEditable: boolean
}

const EMPTY_SDG: SDGMapping = { sdg_number: 4, theme: '', justification: '' }
const EMPTY_SME: SMEDetail = { name: '', designation: '', organization: '', experience: '', expertise_areas: '' }

export default function Module6SDGSme({ subjectId, readOnly, onSaved, onBack, onSubmit, isSubmitting, isEditable }: Props) {
  const queryClient = useQueryClient()
  const [sdgMappings, setSdgMappings] = useState<SDGMapping[]>([{ ...EMPTY_SDG }])
  const [smeDetail, setSmeDetail] = useState<SMEDetail>({ ...EMPTY_SME })
  const [sdgJustification, setSdgJustification] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['module-6', subjectId],
    queryFn: () => subjectsAPI.getModuleData(subjectId, 6).then(r => r.data),
  })

  useEffect(() => {
    if (data) {
      if (data.sdg_mappings?.length > 0) {
        setSdgMappings(data.sdg_mappings.map((m: any) => ({
          sdg_number: m.sdg_number || 4,
          theme: m.sdg_theme || m.theme || '',
          justification: m.statement || m.justification || '',
        })))
      }
      const sme = data.sme || data.sme_detail
      if (sme) {
        setSmeDetail({
          name: sme.faculty_name || sme.name || '',
          designation: sme.designation || '',
          organization: sme.organization || '',
          experience: sme.experience || '',
          expertise_areas: sme.expertise_areas || '',
        })
      }
      if (data.sdg_justification) {
        setSdgJustification(data.sdg_justification)
      }
    }
  }, [data])

  const addSDG = () => setSdgMappings(prev => [...prev, { ...EMPTY_SDG }])
  const removeSDG = (i: number) => setSdgMappings(prev => prev.filter((_, idx) => idx !== i))
  const updateSDG = (i: number, field: keyof SDGMapping, value: string | number) => {
    setSdgMappings(prev => prev.map((m, idx) =>
      idx === i ? { ...m, [field]: value } : m
    ))
  }

  const updateSME = (field: keyof SMEDetail, value: string) => {
    setSmeDetail(prev => ({ ...prev, [field]: value }))
  }

  const mutation = useMutation({
    mutationFn: () =>
      subjectsAPI.saveModule(subjectId, 6, {
        sdg_mappings: sdgMappings.filter(m => m.theme || m.justification).map(m => ({
          sdg_number: String(m.sdg_number),
          sdg_theme: m.theme,
          statement: m.justification,
        })),
        sme: {
          faculty_name: smeDetail.name,
          designation: smeDetail.designation,
          email: '',
          phone: '',
        },
        sdg_justification: sdgJustification,
      }),
    onSuccess: () => {
      toast.success('SDG mapping and SME details saved.')
      queryClient.invalidateQueries({ queryKey: ['module-6', subjectId] })
      onSaved()
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Save failed.'),
  })

  const handleSave = () => mutation.mutate()

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

      {/* SDG Mapping Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="w-5 h-5 text-green-600" />
          <div>
            <h3 className="text-base font-semibold text-gray-800">UN Sustainable Development Goals (SDG) Mapping</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Map how this course contributes to the UN SDGs
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {sdgMappings.map((mapping, idx) => (
            <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-green-50/30 group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                  Mapping {idx + 1}
                </span>
                {!readOnly && sdgMappings.length > 1 && (
                  <button
                    onClick={() => removeSDG(idx)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">SDG Goal *</label>
                  <select
                    value={mapping.sdg_number}
                    onChange={e => updateSDG(idx, 'sdg_number', parseInt(e.target.value))}
                    disabled={readOnly}
                    className={inputCls}
                  >
                    {SDG_LIST.map(sdg => (
                      <option key={sdg.num} value={sdg.num}>
                        SDG {sdg.num}: {sdg.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Theme / Focus Area</label>
                  <input
                    value={mapping.theme}
                    onChange={e => updateSDG(idx, 'theme', e.target.value)}
                    disabled={readOnly}
                    placeholder="e.g., Digital literacy for quality education"
                    className={inputCls}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Justification</label>
                  <textarea
                    value={mapping.justification}
                    onChange={e => updateSDG(idx, 'justification', e.target.value)}
                    disabled={readOnly}
                    placeholder="Explain how this course relates to the selected SDG..."
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {!readOnly && (
          <button
            onClick={addSDG}
            className="mt-4 flex items-center gap-1.5 text-sm text-green-600 hover:text-green-800 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add SDG Mapping
          </button>
        )}
      </div>

      {/* Overall SDG Justification */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Overall SDG Justification Statement
        </label>
        <p className="text-xs text-gray-500 mb-3">
          A holistic statement describing how this course contributes to sustainable development
        </p>
        <textarea
          value={sdgJustification}
          onChange={e => setSdgJustification(e.target.value)}
          disabled={readOnly}
          placeholder="Provide an overarching justification for the SDG alignment of this course..."
          rows={4}
          className={`${inputCls} resize-y`}
        />
      </div>

      {/* SME Details Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-800">Subject Matter Expert (SME) Details</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Information about the external or internal subject matter expert consulted for this syllabus
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
            <input
              value={smeDetail.name}
              onChange={e => updateSME('name', e.target.value)}
              disabled={readOnly}
              placeholder="Dr. / Prof. Full Name"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Designation</label>
            <input
              value={smeDetail.designation}
              onChange={e => updateSME('designation', e.target.value)}
              disabled={readOnly}
              placeholder="e.g., Professor, Senior Researcher"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Organization / Institution</label>
            <input
              value={smeDetail.organization}
              onChange={e => updateSME('organization', e.target.value)}
              disabled={readOnly}
              placeholder="e.g., IIT Delhi, TCS Research"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Years of Experience</label>
            <input
              value={smeDetail.experience}
              onChange={e => updateSME('experience', e.target.value)}
              disabled={readOnly}
              placeholder="e.g., 15+ years"
              className={inputCls}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Areas of Expertise</label>
            <textarea
              value={smeDetail.expertise_areas}
              onChange={e => updateSME('expertise_areas', e.target.value)}
              disabled={readOnly}
              placeholder="List key areas of expertise, separated by commas..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
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
              {isEditable && (
                <button
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit to HOD
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}