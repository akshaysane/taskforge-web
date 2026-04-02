# ChoreChamps Settings Page Design Spec

## Overview

Parent settings page for creating a family, adding children, and managing members. Includes onboarding auto-redirect for new parents with no family. Accessible via gear icon in header.

## Navigation

- Gear icon (⚙️) added to Header component, next to "Log Out" button
- Links to `/settings` route
- Parent only (protected route)

## Onboarding Flow

When a parent has no `familyId` in their auth store:
1. ParentHome auto-redirects to `/settings`
2. Settings page shows onboarding mode: "Welcome! Let's set up your family"
3. Family name input + "Create Family" button
4. On create: update auth store with new familyId, switch to normal management mode
5. "Go to Dashboard" button appears once family is created

## Settings Page (`/settings`)

### Onboarding Mode (no family)

- Welcome banner with emoji illustration
- Family name text input
- "Create Family" green button
- Calls `POST /api/families` with `{ name }`
- On success: updates auth store `familyId` with the new family id, switches to normal mode

### Normal Mode (has family)

**Family Name section:**
- Displays current family name
- Edit button (✏️) toggles inline edit mode
- Save on button click, calls `PATCH /api/families/:familyId`

**Add Child section:**
- Name input + PIN input (4-6 digits)
- "Add Child" button
- Calls `POST /api/families/:familyId/members` with `{ name, pin }`
- On success: clears form, refreshes member list

**Family Members section:**
- List of all members fetched from `GET /api/families/:familyId/members`
- Each row: name, role badge (parent/child)
- Child rows have: edit (✏️) and remove (🗑) buttons
- Edit opens modal for updating name and resetting PIN
- Remove calls `DELETE /api/families/:familyId/members/:userId`, removes from list
- Parent rows: display only (no edit/remove)

### EditMemberModal

- Title: "Edit Member"
- Fields: Name (text), New PIN (optional, 4-6 digits — only if changing)
- Save/Cancel buttons
- Calls `PATCH /api/families/:familyId/members/:userId`

## Auth Store Update

After creating a family, the auth store needs the new `familyId`. The approach:
- `POST /api/families` returns the family object with `id`
- Update `useAuthStore` user object with `familyId = family.id`
- Add a `setFamilyId` action to the Zustand store

## File Structure

```
src/
  api/
    family.ts                  # Create: createFamily, getFamily, updateFamily, addChild, getMembers, updateMember, removeMember

  store/
    auth.ts                    # Modify: add setFamilyId action

  components/
    Header.tsx                 # Modify: add gear icon linking to /settings
    FamilySetup.tsx            # Create: onboarding create family form
    MemberList.tsx             # Create: member list with role badges and actions
    AddChildForm.tsx           # Create: name + PIN form to add child
    EditMemberModal.tsx        # Create: edit name/PIN modal

  pages/
    Settings.tsx               # Create: settings page (onboarding + normal mode)
    ParentHome.tsx             # Modify: redirect to /settings if no familyId

  App.tsx                      # Modify: add /settings route
```

## API Functions (src/api/family.ts)

```
- createFamily(name) → POST /api/families
- getFamily(familyId) → GET /api/families/:familyId
- updateFamily(familyId, name) → PATCH /api/families/:familyId
- addChild(familyId, { name, pin }) → POST /api/families/:familyId/members
- getMembers(familyId) → GET /api/families/:familyId/members
- updateMember(familyId, userId, input) → PATCH /api/families/:familyId/members/:userId
- removeMember(familyId, userId) → DELETE /api/families/:familyId/members/:userId
```

## Responsive Behavior

Same as other pages: max-w-4xl centered, single column on mobile.
