import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getSchedules,
  createSchedule,
  deleteSchedule,
  generateChores,
  getFamilyMembers,
} from '../api/chores'
import type {
  ChoreTemplate,
  ChoreSchedule,
  FamilyMember,
  CreateTemplateInput,
  CreateScheduleInput,
} from '../api/chores'
import Header from '../components/Header'
import NavBar from '../components/NavBar'
import TemplateList from '../components/TemplateList'
import TemplateModal from '../components/TemplateModal'
import ScheduleList from '../components/ScheduleList'
import ScheduleModal from '../components/ScheduleModal'

export default function ChoreManagement() {
  const user = useAuthStore((s) => s.user)
  const familyId = user?.familyId

  const [templates, setTemplates] = useState<ChoreTemplate[]>([])
  const [schedules, setSchedules] = useState<ChoreSchedule[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [loadingSchedules, setLoadingSchedules] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState('')

  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ChoreTemplate | null>(null)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)

  const fetchTemplates = useCallback(async () => {
    if (!familyId) return
    setLoadingTemplates(true)
    try { setTemplates(await getTemplates(familyId)) } catch {}
    finally { setLoadingTemplates(false) }
  }, [familyId])

  const fetchSchedules = useCallback(async () => {
    if (!familyId) return
    setLoadingSchedules(true)
    try { setSchedules(await getSchedules(familyId)) } catch {}
    finally { setLoadingSchedules(false) }
  }, [familyId])

  const fetchMembers = useCallback(async () => {
    if (!familyId) return
    try { setMembers(await getFamilyMembers(familyId)) } catch {}
  }, [familyId])

  useEffect(() => {
    fetchTemplates()
    fetchSchedules()
    fetchMembers()
  }, [fetchTemplates, fetchSchedules, fetchMembers])

  const handleSaveTemplate = async (input: CreateTemplateInput) => {
    if (!familyId) return
    if (editingTemplate) {
      await updateTemplate(familyId, editingTemplate.id, input)
    } else {
      await createTemplate(familyId, input)
    }
    fetchTemplates()
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!familyId) return
    await deleteTemplate(familyId, templateId)
    fetchTemplates()
  }

  const handleSaveSchedule = async (input: CreateScheduleInput) => {
    if (!familyId) return
    await createSchedule(familyId, input)
    fetchSchedules()
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!familyId) return
    await deleteSchedule(familyId, scheduleId)
    fetchSchedules()
  }

  const handleGenerate = async () => {
    if (!familyId) return
    setGenerating(true)
    try {
      const result = await generateChores(familyId)
      setToast(`Created ${result.created} chores, skipped ${result.skipped}`)
      setTimeout(() => setToast(''), 3000)
    } catch {
      setToast('Failed to generate chores')
      setTimeout(() => setToast(''), 3000)
    } finally {
      setGenerating(false)
    }
  }

  if (!familyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-500">Create or join a family first.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      <NavBar />

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {toast && (
          <div className="bg-green-50 text-primary text-sm font-semibold px-4 py-3 rounded-xl text-center">
            {toast}
          </div>
        )}

        <TemplateList
          templates={templates}
          loading={loadingTemplates}
          onNew={() => { setEditingTemplate(null); setTemplateModalOpen(true) }}
          onEdit={(t) => { setEditingTemplate(t); setTemplateModalOpen(true) }}
          onDelete={handleDeleteTemplate}
        />

        <ScheduleList
          schedules={schedules}
          loading={loadingSchedules}
          onNew={() => setScheduleModalOpen(true)}
          onDelete={handleDeleteSchedule}
        />

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 disabled:opacity-50 text-white font-bold py-4 rounded-full text-lg transition-all shadow-md"
        >
          {generating ? 'Generating...' : '⚡ Generate Today\'s Chores'}
        </button>
      </main>

      <TemplateModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSave={handleSaveTemplate}
        template={editingTemplate}
      />

      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSave={handleSaveSchedule}
        templates={templates}
        members={members}
      />
    </div>
  )
}
