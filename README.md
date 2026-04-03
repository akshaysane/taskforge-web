# Happy Habits - Web App

React SPA for the Happy Habits family task management platform. Parents manage chores, schedules, and rewards. Children complete tasks, earn points, and unlock achievements.

**Live:** https://app.happyhabits.click

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build:** Vite 8
- **Styling:** TailwindCSS v4 (with Nunito font)
- **Routing:** React Router v7
- **State:** Zustand (auth store with localStorage persistence)
- **HTTP:** Axios (with JWT refresh interceptor)
- **Hosting:** AWS Amplify (auto-deploys on push)

## Features

### Auth
- Landing page with playful branding
- Parent registration (email + password)
- Login with success banner after registration
- JWT token management with automatic refresh

### Home Screen (role-adaptive)

**Parent Dashboard:**
- Today's progress (X/Y chores done, progress bar)
- Pending approvals with approve/reject buttons
- Family member cards (child name, points, chore progress)
- Navigation bar (Home | Chores | Rewards)

**Child View:**
- Points balance + streak cards
- Achievement badges
- Chore checklist with "Done!" buttons
- Leaderboard (ranked by points)
- Available rewards with "Redeem" button
- Redemption history with cancel option

### Chore Management (parent only, `/chores`)
- Chore template list with create/edit/delete
- Schedule list with day-of-week picker (DayPicker component)
- Generate today's chores button
- Inline modals for forms

### Rewards (parent only, `/rewards`)
- Reward catalog with create/edit/delete
- Pending redemptions with fulfill/cancel

### Settings (`/settings`)
- Onboarding: create family for new parents (auto-redirect)
- Add children (name + PIN)
- Member list with edit/remove
- Family name editing

## Local Development

### Prerequisites
- Node.js 20+
- pnpm 10+
- Backend API running at `http://localhost:3000` (see [taskforge](https://github.com/akshaysane/taskforge))

### Setup

```bash
# Clone
git clone https://github.com/akshaysane/taskforge-web.git
cd taskforge-web

# Install
pnpm install

# Start dev server
pnpm dev
```

Open http://localhost:5173

### Environment Variables

Create `.env`:
```bash
VITE_API_URL=http://localhost:3000
```

For production, this is set in Amplify environment variables.

### Commands

```bash
pnpm dev        # Start dev server (hot reload)
pnpm build      # Production build (to dist/)
pnpm preview    # Preview production build
pnpm lint       # ESLint
```

## Deployment

### AWS Amplify (automatic)

The app is connected to GitHub via Amplify. Every push to `main` triggers:
1. Install dependencies (`pnpm install`)
2. Build (`pnpm build`)
3. Deploy to CloudFront CDN

**Build config:** `amplify.yml` in the repo root.

**Environment variables** (set in Amplify console):
- `VITE_API_URL` = `https://api.happyhabits.click`

### Manual Deploy

If you need to trigger a build manually:
```bash
aws amplify start-job \
  --app-id dwy9ljp418so8 \
  --branch-name main \
  --job-type RELEASE \
  --region us-east-1
```

## Architecture

```
src/
  api/
    client.ts          # Axios instance, auth interceptor, refresh logic
    auth.ts            # Register, login, refresh, logout
    chores.ts          # Chores, templates, schedules, points, streaks, achievements
    family.ts          # Family CRUD, member management
    rewards.ts         # Rewards CRUD, redemptions

  store/
    auth.ts            # Zustand: tokens, user, isAuthenticated, login/logout/setFamilyId

  components/
    Header.tsx         # Sticky header with logo, settings gear, logout
    NavBar.tsx         # Tab navigation (Home | Chores | Rewards)
    Layout.tsx         # Centered card wrapper for auth pages
    ProtectedRoute.tsx # Redirects to /login if not authenticated
    PublicRoute.tsx    # Redirects to /home if already authenticated

    # Parent home
    TodayProgress.tsx  # Green progress card
    PendingApprovals.tsx # Approval list with approve/reject
    FamilyMembers.tsx  # Child cards grid

    # Child home
    PointsCard.tsx     # Points balance card
    StreakCard.tsx      # Streak counter card
    ChoreChecklist.tsx # Chore list with Done buttons
    Leaderboard.tsx    # Ranked points list
    AchievementBadges.tsx # Unlocked badge pills
    AvailableRewards.tsx  # Reward list with redeem
    MyRedemptions.tsx     # Redemption history

    # Chore management
    TemplateList.tsx    # Template list with edit/delete
    TemplateModal.tsx   # Create/edit template modal
    ScheduleList.tsx    # Schedule list with day pills
    ScheduleModal.tsx   # Create schedule modal
    DayPicker.tsx       # 7-day toggle pill (bitmask encoding)

    # Rewards management
    RewardList.tsx      # Reward catalog list
    RewardModal.tsx     # Create/edit reward modal
    PendingRedemptions.tsx # Fulfill/cancel redemptions

    # Settings
    FamilySetup.tsx     # Onboarding create family form
    AddChildForm.tsx    # Name + PIN form
    MemberList.tsx      # Member list with edit/remove
    EditMemberModal.tsx # Edit name/PIN modal

  pages/
    Landing.tsx         # Welcome page (/)
    Register.tsx        # Registration form (/register)
    Login.tsx           # Login form (/login)
    Home.tsx            # Role router → ParentHome or ChildHome
    ParentHome.tsx      # Parent dashboard (/home)
    ChildHome.tsx       # Child action view (/home)
    ChoreManagement.tsx # Chore templates + schedules (/chores)
    RewardsManagement.tsx # Reward catalog + redemptions (/rewards)
    Settings.tsx        # Family setup + member management (/settings)

  App.tsx              # React Router setup
  main.tsx             # Entry point
  index.css            # Tailwind imports + theme
```

## Design

- **Visual style:** Playful, family-friendly, emoji-based illustrations
- **Colors:** Green primary (#43a047), blue accent (#1565c0)
- **Typography:** Nunito (Google Font)
- **Layout:** Mobile-first, centered cards, responsive grid on desktop
- **Components:** Rounded-2xl cards, pill buttons, skeleton loading states
