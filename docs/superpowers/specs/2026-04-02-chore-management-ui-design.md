# ChoreChamps Chore Management UI Design Spec

## Overview

Parent-only chore management page with CRUD for templates and schedules, plus a generate button to create today's chore instances. Accessible via a new navigation bar. Uses inline modals for create/edit forms.

## Navigation

Bottom tab bar (mobile) / top pill nav (desktop) added to parent views:
- **Home** — existing parent dashboard (`/home`)
- **Chores** — chore management (`/chores`)
- **Rewards** — placeholder, disabled for now

Children do not see the nav bar — they stay on their home screen only.

The nav bar component is shared and rendered in ParentHome and ChoreManagement pages.

## Routes

- `/chores` — ChoreManagement page, parent only (ProtectedRoute + parent role check)

## Chores Page (`/chores`)

Single page, stacked sections, same responsive max-width as parent home.

### Templates Section

- Header: "📋 Templates" with "+ New" button
- List of active templates, each row shows: icon, name, points badge, requiresApproval indicator
- Each row has edit (✏️) and delete (🗑) action buttons
- Delete calls soft-delete API, removes from list
- Edit opens template modal pre-filled
- Empty state: "No templates yet — create one to get started"

### Schedules Section

- Header: "📅 Schedules" with "+ New" button
- List of active schedules, each row shows: template name, "→", child name, day pills (M T W T F S S with active days highlighted)
- Each row has edit (✏️) and delete (🗑) action buttons
- Empty state: "No schedules yet — assign chores to your kids"

### Generate Button

- Full-width green gradient button at bottom: "⚡ Generate Today's Chores"
- Calls `POST /api/families/:familyId/chores/generate`
- On success: shows toast with "Created X chores, skipped Y"
- Loading state: button disabled with spinner

## Modals

### Template Modal (create/edit)

- Title: "New Template" or "Edit Template"
- Fields:
  - Name (text input, required)
  - Points (number input, default 0)
  - Icon (text input, optional — emoji or short text)
  - Requires Approval (checkbox, default true)
- Buttons: Save (green) / Cancel (gray)
- On save: calls create or update API, closes modal, refreshes list
- Validation: name required, points >= 0

### Schedule Modal (create/edit)

- Title: "New Schedule" or "Edit Schedule"
- Fields:
  - Template (dropdown, populated from template list)
  - Assigned To (dropdown, populated from family members filtered to children)
  - Days of Week (DayPicker component — 7 toggleable pill buttons)
  - Effective From (date input)
- Buttons: Save (green) / Cancel (gray)
- On save: encodes selected days to bitmask, calls create API, closes modal, refreshes list
- Edit mode: only shows daysOfWeek and effectiveUntil (can't change template/child)

## DayPicker Component

Seven pill buttons in a row: M T W T F S S. Tapping toggles the day on/off. Active days are highlighted (green background). Returns a bitmask number using the same encoding as the backend (Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64).

## File Structure

```
src/
  components/
    NavBar.tsx              # Create: bottom/top nav (Home | Chores | Rewards)
    TemplateList.tsx         # Create: template list with edit/delete
    TemplateModal.tsx        # Create: create/edit template form modal
    ScheduleList.tsx         # Create: schedule list with edit/delete
    ScheduleModal.tsx        # Create: create/edit schedule form modal
    DayPicker.tsx            # Create: 7-day toggle pill component

  pages/
    ChoreManagement.tsx      # Create: chore management page
    ParentHome.tsx           # Modify: add NavBar component

  api/
    chores.ts               # Modify: add template + schedule CRUD + generate API functions

  App.tsx                   # Modify: add /chores route (protected, parent only)
```

## API Functions to Add (src/api/chores.ts)

```
Template CRUD:
- createTemplate(familyId, input) → POST /api/families/:familyId/chore-templates
- getTemplates(familyId) → GET /api/families/:familyId/chore-templates
- updateTemplate(familyId, templateId, input) → PATCH /api/families/:familyId/chore-templates/:templateId
- deleteTemplate(familyId, templateId) → DELETE /api/families/:familyId/chore-templates/:templateId

Schedule CRUD:
- createSchedule(familyId, input) → POST /api/families/:familyId/chore-schedules
- getSchedules(familyId) → GET /api/families/:familyId/chore-schedules
- updateSchedule(familyId, scheduleId, input) → PATCH /api/families/:familyId/chore-schedules/:scheduleId
- deleteSchedule(familyId, scheduleId) → DELETE /api/families/:familyId/chore-schedules/:scheduleId

Generate:
- generateChores(familyId) → POST /api/families/:familyId/chores/generate
```

## Responsive Behavior

- Mobile (<640px): full-width sections, bottom tab bar, modals take full screen
- Desktop (≥640px): max-w-4xl centered, top pill nav, modals centered with backdrop

## Error Handling

- API errors shown as toast/banner
- Form validation inline (name required, points >= 0, at least one day selected)
- Loading spinners on buttons during API calls
