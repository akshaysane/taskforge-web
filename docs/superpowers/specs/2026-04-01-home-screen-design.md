# ChoreChamps Home Screen UI Design Spec

## Overview

Role-adaptive home screen for ChoreChamps. Parents see a grid dashboard with today's progress, pending approvals, and family member cards. Children see an action-focused view with points, streak, chore checklist, and leaderboard. All data fetched from the existing Fastify backend APIs.

## Tech Stack

Same as existing web app: React 19, TypeScript, TailwindCSS v4, React Router v7, Zustand, Axios.

## Parent View — Grid Dashboard

Layout: CSS grid, 2-column on tablet/desktop, single column on mobile.

**Top row (2-column grid):**
- **Today's Progress** — Green gradient card. Shows "X / Y chores done" with a progress bar. Counts all family chore instances for today where status is `approved` vs total.
- **Pending Approvals Count** — Orange card. Shows count of chores with status `completed` awaiting approval. Tappable — scrolls to the approval list below.

**Pending Approvals section:**
- List of completed chores needing parent action.
- Each row: child avatar/name, chore title, points value, approve (✅) and reject (❌) buttons.
- Approve calls `PATCH /chores/:choreId/approve`, reject calls `PATCH /chores/:choreId/reject`.
- On action: item removed from list, today's progress updates.
- Empty state: "No chores waiting for approval 🎉"

**Family Members section:**
- Grid of child cards (2-column).
- Each card: child name, avatar, points balance (from points API), today's chore progress (done/total from today's chores filtered by child).
- Tappable — future: navigate to child detail (not in this phase).

## Child View — Action-Focused

Layout: single column, mobile-optimized.

**Top row (2-column grid):**
- **Points Balance** — Green gradient card. Shows ⭐ and current total points.
- **Streak** — Orange gradient card. Shows 🔥 and day count. Hardcoded to 0 for now (no streak API yet).

**My Chores Today:**
- Checklist of today's assigned chores.
- Status icons: ✅ completed/approved (strikethrough, green background), ⏳ awaiting approval (orange background), ⬜ pending (white, has "Done!" button).
- "Done!" button calls `PATCH /chores/:choreId/complete`. On success: chore moves to ✅ or ⏳ depending on `requiresApproval`.
- Shows points value per chore.
- Empty state: "No chores today! 🎉"

**Leaderboard:**
- Ranked list of all family members by points balance (highest first).
- Shows rank number, name, points. Gold/silver/bronze colors for top 3.
- Current user highlighted.

## Shared Components

**Header:**
- Sticky top bar with "🏠 ChoreChamps" logo and "Log Out" button.
- Shared between parent and child views.

## File Structure

```
src/
  api/
    chores.ts                  # Create: chore + points API functions

  pages/
    Home.tsx                   # Modify: route to ParentHome or ChildHome based on role
    ParentHome.tsx             # Create: parent grid dashboard
    ChildHome.tsx              # Create: child action view

  components/
    Header.tsx                 # Create: shared sticky header with logo + logout
    TodayProgress.tsx          # Create: green progress card (parent)
    PendingApprovals.tsx       # Create: approval list with approve/reject (parent)
    FamilyMembers.tsx          # Create: child cards grid (parent)
    PointsCard.tsx             # Create: points balance card (child)
    StreakCard.tsx              # Create: streak display card (child, hardcoded 0)
    ChoreChecklist.tsx         # Create: chore list with Done buttons (child)
    Leaderboard.tsx            # Create: ranked points list (child)
```

## API Integration

New file `src/api/chores.ts` with functions calling the backend:

- `getTodayChores(familyId)` → `GET /api/families/:familyId/chores/today`
- `getPendingApprovals(familyId)` → `GET /api/families/:familyId/chores/pending`
- `completeChore(familyId, choreId)` → `PATCH /api/families/:familyId/chores/:choreId/complete`
- `approveChore(familyId, choreId)` → `PATCH /api/families/:familyId/chores/:choreId/approve`
- `rejectChore(familyId, choreId)` → `PATCH /api/families/:familyId/chores/:choreId/reject`
- `getPointsBalance(familyId, userId)` → `GET /api/families/:familyId/members/:userId/points`
- `getFamilyMembers(familyId)` → `GET /api/families/:familyId/members`

## Data Fetching

Each section fetches independently using `useEffect` on mount. Loading states per section (skeleton/spinner). No global data cache — keep it simple.

After a mutation (complete, approve, reject), refetch the affected data to update the UI.

## Responsive Breakpoints

- **Mobile (<640px):** Single column, all sections stack. Header sticky. Full-width cards.
- **Tablet/Desktop (≥640px):** 2-column grid for stat cards and family member cards. Max-width container (4xl) centered.

## Error Handling

- API errors show toast/banner at top of page.
- Network errors: "Unable to connect to server" message.
- Loading states: skeleton placeholders per section.

## Scope Exclusions

- Streak tracking backend (hardcoded to 0)
- Achievements/badges
- Chore management (create/edit templates, schedules)
- Rewards & redemptions
- Child detail view (tapping family member card)
