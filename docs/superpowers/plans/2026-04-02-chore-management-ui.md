# Chore Management UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the parent chore management page with CRUD for templates and schedules, a day picker component, inline modals, a generate button, and a navigation bar.

**Architecture:** New `/chores` route with ChoreManagement page composed of TemplateList, ScheduleList, and their modals. NavBar component added to parent pages. API module extended with template/schedule/generate functions. DayPicker encodes/decodes the same bitmask format as the backend.

**Tech Stack:** React 19, TypeScript, TailwindCSS v4, Axios, React Router v7

---

## File Map

```
src/
  api/
    chores.ts                  # Modify: add template, schedule, generate API functions + types

  components/
    NavBar.tsx                 # Create: bottom/top nav bar (Home | Chores | Rewards)
    DayPicker.tsx              # Create: 7-day toggle pill component
    TemplateList.tsx            # Create: template list with edit/delete
    TemplateModal.tsx           # Create: create/edit template form modal
    ScheduleList.tsx            # Create: schedule list with edit/delete
    ScheduleModal.tsx           # Create: create/edit schedule form modal

  pages/
    ChoreManagement.tsx        # Create: chore management page
    ParentHome.tsx             # Modify: add NavBar

  App.tsx                      # Modify: add /chores route
```

---

## Task 1: API Functions for Templates, Schedules, and Generate

**Files:**
- Modify: `src/api/chores.ts`

- [ ] **Step 1: Add types and functions to chores.ts**

Add these interfaces and functions to the bottom of `src/api/chores.ts`:

```typescript
// --- Template types ---

export interface ChoreTemplate {
  id: string
  name: string
  description: string | null
  icon: string | null
  points: number
  requiresApproval: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTemplateInput {
  name: string
  description?: string
  icon?: string
  points?: number
  requiresApproval?: boolean
}

// --- Schedule types ---

export interface ChoreSchedule {
  id: string
  daysOfWeek: number
  effectiveFrom: string
  effectiveUntil: string | null
  isActive: boolean
  choreTemplate: { id: string; name: string; points: number }
  assignedTo: { id: string; name: string }
}

export interface CreateScheduleInput {
  choreTemplateId: string
  assignedToId: string
  daysOfWeek: number
  effectiveFrom: string
  effectiveUntil?: string
}

// --- Generate types ---

export interface GenerateResult {
  created: number
  skipped: number
}

// --- Template API ---

export async function getTemplates(familyId: string): Promise<ChoreTemplate[]> {
  const { data } = await apiClient.get<ChoreTemplate[]>(
    `/api/families/${familyId}/chore-templates`,
  )
  return data
}

export async function createTemplate(
  familyId: string,
  input: CreateTemplateInput,
): Promise<ChoreTemplate> {
  const { data } = await apiClient.post<ChoreTemplate>(
    `/api/families/${familyId}/chore-templates`,
    input,
  )
  return data
}

export async function updateTemplate(
  familyId: string,
  templateId: string,
  input: Partial<CreateTemplateInput>,
): Promise<ChoreTemplate> {
  const { data } = await apiClient.patch<ChoreTemplate>(
    `/api/families/${familyId}/chore-templates/${templateId}`,
    input,
  )
  return data
}

export async function deleteTemplate(
  familyId: string,
  templateId: string,
): Promise<void> {
  await apiClient.delete(`/api/families/${familyId}/chore-templates/${templateId}`)
}

// --- Schedule API ---

export async function getSchedules(familyId: string): Promise<ChoreSchedule[]> {
  const { data } = await apiClient.get<ChoreSchedule[]>(
    `/api/families/${familyId}/chore-schedules`,
  )
  return data
}

export async function createSchedule(
  familyId: string,
  input: CreateScheduleInput,
): Promise<ChoreSchedule> {
  const { data } = await apiClient.post<ChoreSchedule>(
    `/api/families/${familyId}/chore-schedules`,
    input,
  )
  return data
}

export async function updateSchedule(
  familyId: string,
  scheduleId: string,
  input: { daysOfWeek?: number; effectiveUntil?: string; isActive?: boolean },
): Promise<ChoreSchedule> {
  const { data } = await apiClient.patch<ChoreSchedule>(
    `/api/families/${familyId}/chore-schedules/${scheduleId}`,
    input,
  )
  return data
}

export async function deleteSchedule(
  familyId: string,
  scheduleId: string,
): Promise<void> {
  await apiClient.delete(`/api/families/${familyId}/chore-schedules/${scheduleId}`)
}

// --- Generate API ---

export async function generateChores(familyId: string): Promise<GenerateResult> {
  const { data } = await apiClient.post<GenerateResult>(
    `/api/families/${familyId}/chores/generate`,
  )
  return data
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/api/chores.ts
git commit -m "feat: add template, schedule, and generate API functions"
```

---

## Task 2: NavBar Component

**Files:**
- Create: `src/components/NavBar.tsx`

- [ ] **Step 1: Create NavBar**

Create `src/components/NavBar.tsx`:

```tsx
import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { label: 'Home', path: '/home', icon: '🏠' },
  { label: 'Chores', path: '/chores', icon: '📋' },
  { label: 'Rewards', path: '/rewards', icon: '🎁', disabled: true },
]

export default function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="max-w-4xl mx-auto px-4 mt-4 mb-2">
      <div className="flex bg-gray-100 rounded-2xl p-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => !tab.disabled && navigate(tab.path)}
              disabled={tab.disabled}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-colors ${
                isActive
                  ? 'bg-accent text-white shadow-sm'
                  : tab.disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/NavBar.tsx
git commit -m "feat: add NavBar component with Home, Chores, Rewards tabs"
```

---

## Task 3: DayPicker Component

**Files:**
- Create: `src/components/DayPicker.tsx`

- [ ] **Step 1: Create DayPicker**

Create `src/components/DayPicker.tsx`:

```tsx
const DAYS = [
  { label: 'M', bit: 1 },
  { label: 'T', bit: 2 },
  { label: 'W', bit: 4 },
  { label: 'T', bit: 8 },
  { label: 'F', bit: 16 },
  { label: 'S', bit: 32 },
  { label: 'S', bit: 64 },
]

interface DayPickerProps {
  value: number
  onChange: (value: number) => void
  readonly?: boolean
}

export default function DayPicker({ value, onChange, readonly }: DayPickerProps) {
  const toggle = (bit: number) => {
    if (readonly) return
    onChange(value ^ bit)
  }

  return (
    <div className="flex gap-1.5">
      {DAYS.map((day) => {
        const isActive = (value & day.bit) !== 0
        return (
          <button
            key={day.bit}
            type="button"
            onClick={() => toggle(day.bit)}
            disabled={readonly}
            className={`w-9 h-9 rounded-full text-xs font-bold transition-colors ${
              isActive
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            } ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {day.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/DayPicker.tsx
git commit -m "feat: add DayPicker component with bitmask encoding"
```

---

## Task 4: TemplateList and TemplateModal

**Files:**
- Create: `src/components/TemplateList.tsx`
- Create: `src/components/TemplateModal.tsx`

- [ ] **Step 1: Create TemplateModal**

Create `src/components/TemplateModal.tsx`:

```tsx
import { useState, useEffect } from 'react'
import type { ChoreTemplate, CreateTemplateInput } from '../api/chores'

interface TemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (input: CreateTemplateInput) => Promise<void>
  template?: ChoreTemplate | null
}

export default function TemplateModal({ isOpen, onClose, onSave, template }: TemplateModalProps) {
  const [name, setName] = useState('')
  const [points, setPoints] = useState(0)
  const [icon, setIcon] = useState('')
  const [requiresApproval, setRequiresApproval] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (template) {
      setName(template.name)
      setPoints(template.points)
      setIcon(template.icon || '')
      setRequiresApproval(template.requiresApproval)
    } else {
      setName('')
      setPoints(0)
      setIcon('')
      setRequiresApproval(true)
    }
    setError('')
  }, [template, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        points,
        icon: icon.trim() || undefined,
        requiresApproval,
      })
      onClose()
    } catch {
      setError('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-extrabold text-accent mb-4">
          {template ? 'Edit Template' : 'New Template'}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Chore name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Points"
              min={0}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="flex-1 bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Icon (emoji)"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-24 bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="font-medium text-gray-600">Requires parent approval</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 rounded-full transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-full transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create TemplateList**

Create `src/components/TemplateList.tsx`:

```tsx
import type { ChoreTemplate } from '../api/chores'

interface TemplateListProps {
  templates: ChoreTemplate[]
  loading: boolean
  onEdit: (template: ChoreTemplate) => void
  onDelete: (templateId: string) => void
  onNew: () => void
}

export default function TemplateList({
  templates,
  loading,
  onEdit,
  onDelete,
  onNew,
}: TemplateListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-10 bg-gray-100 rounded-xl" />
          <div className="h-10 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-accent">📋 Templates</h3>
        <button
          onClick={onNew}
          className="bg-primary hover:bg-primary-dark text-white text-xs font-bold py-1.5 px-4 rounded-full transition-colors"
        >
          + New
        </button>
      </div>

      {templates.length === 0 ? (
        <p className="text-gray-400 text-sm">No templates yet — create one to get started</p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center gap-2">
                <span>{t.icon || '📝'}</span>
                <span className="font-semibold text-sm">{t.name}</span>
                <span className="text-primary text-xs font-bold">{t.points}pts</span>
                {t.requiresApproval && (
                  <span className="text-orange-400 text-xs">✓ approval</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(t)}
                  className="text-sm hover:scale-110 transition-transform"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(t.id)}
                  className="text-sm hover:scale-110 transition-transform"
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/TemplateModal.tsx src/components/TemplateList.tsx
git commit -m "feat: add TemplateList and TemplateModal components"
```

---

## Task 5: ScheduleList and ScheduleModal

**Files:**
- Create: `src/components/ScheduleList.tsx`
- Create: `src/components/ScheduleModal.tsx`

- [ ] **Step 1: Create ScheduleModal**

Create `src/components/ScheduleModal.tsx`:

```tsx
import { useState, useEffect } from 'react'
import type { ChoreTemplate, FamilyMember, CreateScheduleInput } from '../api/chores'
import DayPicker from './DayPicker'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (input: CreateScheduleInput) => Promise<void>
  templates: ChoreTemplate[]
  members: FamilyMember[]
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onSave,
  templates,
  members,
}: ScheduleModalProps) {
  const [templateId, setTemplateId] = useState('')
  const [childId, setChildId] = useState('')
  const [daysOfWeek, setDaysOfWeek] = useState(0)
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const children = members.filter((m) => m.role === 'child')

  useEffect(() => {
    setTemplateId(templates[0]?.id || '')
    setChildId(children[0]?.id || '')
    setDaysOfWeek(0)
    setEffectiveFrom(new Date().toISOString().split('T')[0])
    setError('')
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateId || !childId) {
      setError('Please select a template and child')
      return
    }
    if (daysOfWeek === 0) {
      setError('Please select at least one day')
      return
    }
    setSaving(true)
    try {
      await onSave({
        choreTemplateId: templateId,
        assignedToId: childId,
        daysOfWeek,
        effectiveFrom,
      })
      onClose()
    } catch {
      setError('Failed to create schedule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-extrabold text-accent mb-4">New Schedule</h2>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon || '📝'} {t.name} ({t.points}pts)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Assign To</label>
            <select
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Days</label>
            <DayPicker value={daysOfWeek} onChange={setDaysOfWeek} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Effective From</label>
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 rounded-full transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-full transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ScheduleList**

Create `src/components/ScheduleList.tsx`:

```tsx
import type { ChoreSchedule } from '../api/chores'
import DayPicker from './DayPicker'

interface ScheduleListProps {
  schedules: ChoreSchedule[]
  loading: boolean
  onDelete: (scheduleId: string) => void
  onNew: () => void
}

export default function ScheduleList({
  schedules,
  loading,
  onDelete,
  onNew,
}: ScheduleListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-accent">📅 Schedules</h3>
        <button
          onClick={onNew}
          className="bg-primary hover:bg-primary-dark text-white text-xs font-bold py-1.5 px-4 rounded-full transition-colors"
        >
          + New
        </button>
      </div>

      {schedules.length === 0 ? (
        <p className="text-gray-400 text-sm">No schedules yet — assign chores to your kids</p>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <div
              key={s.id}
              className="py-3 px-4 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm">
                  <span className="font-semibold">{s.assignedTo.name}</span>
                  <span className="text-gray-400"> → </span>
                  <span className="font-semibold">{s.choreTemplate.name}</span>
                  <span className="text-primary text-xs font-bold ml-2">{s.choreTemplate.points}pts</span>
                </div>
                <button
                  onClick={() => onDelete(s.id)}
                  className="text-sm hover:scale-110 transition-transform"
                  title="Delete"
                >
                  🗑
                </button>
              </div>
              <DayPicker value={s.daysOfWeek} onChange={() => {}} readonly />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/ScheduleModal.tsx src/components/ScheduleList.tsx
git commit -m "feat: add ScheduleList and ScheduleModal components"
```

---

## Task 6: ChoreManagement Page

**Files:**
- Create: `src/pages/ChoreManagement.tsx`

- [ ] **Step 1: Create ChoreManagement page**

Create `src/pages/ChoreManagement.tsx`:

```tsx
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
    try {
      setTemplates(await getTemplates(familyId))
    } catch {
      // ignore
    } finally {
      setLoadingTemplates(false)
    }
  }, [familyId])

  const fetchSchedules = useCallback(async () => {
    if (!familyId) return
    setLoadingSchedules(true)
    try {
      setSchedules(await getSchedules(familyId))
    } catch {
      // ignore
    } finally {
      setLoadingSchedules(false)
    }
  }, [familyId])

  const fetchMembers = useCallback(async () => {
    if (!familyId) return
    try {
      setMembers(await getFamilyMembers(familyId))
    } catch {
      // ignore
    }
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
          onNew={() => {
            setEditingTemplate(null)
            setTemplateModalOpen(true)
          }}
          onEdit={(t) => {
            setEditingTemplate(t)
            setTemplateModalOpen(true)
          }}
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
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/ChoreManagement.tsx
git commit -m "feat: add ChoreManagement page with templates, schedules, and generate"
```

---

## Task 7: Add NavBar to ParentHome + Wire Routes

**Files:**
- Modify: `src/pages/ParentHome.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add NavBar to ParentHome**

In `src/pages/ParentHome.tsx`, add the import:

```typescript
import NavBar from '../components/NavBar'
```

Add `<NavBar />` right after `<Header />` in both the "no family" return and the main return. So after:
```tsx
<Header />
```
Add:
```tsx
<NavBar />
```

Do this in both places where `<Header />` appears in the file.

- [ ] **Step 2: Add /chores route to App.tsx**

In `src/App.tsx`, add the import:

```typescript
import ChoreManagement from './pages/ChoreManagement'
```

Add a new route inside the `<Route element={<ProtectedRoute />}>` block:

```tsx
<Route element={<ProtectedRoute />}>
  <Route path="/home" element={<Home />} />
  <Route path="/chores" element={<ChoreManagement />} />
</Route>
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/pages/ParentHome.tsx src/App.tsx
git commit -m "feat: add NavBar to ParentHome and wire /chores route"
```

---

## Task 8: Smoke Test

- [ ] **Step 1: Start backend and frontend**

Backend: `cd /home/akshaysane/git/taskforge && pnpm dev`
Frontend: `cd /home/akshaysane/git/taskforge-web && pnpm dev`

- [ ] **Step 2: Seed the database**

`cd /home/akshaysane/git/taskforge && pnpm db:seed`

- [ ] **Step 3: Test the flow**

1. Log in as parent@demo.com / password123
2. Home should show parent dashboard with NavBar (Home | Chores | Rewards)
3. Click "Chores" tab → ChoreManagement page
4. Should see existing templates from seed data
5. Click "+ New" on Templates → modal opens, create a template
6. Click "+ New" on Schedules → modal opens, select template/child/days, create
7. Click "⚡ Generate Today's Chores" → toast shows created/skipped count
8. Navigate back to Home → today's chores should reflect the generated instances

- [ ] **Step 4: Fix any issues and commit**

```bash
git add -A
git commit -m "fix: address smoke test findings"
```
