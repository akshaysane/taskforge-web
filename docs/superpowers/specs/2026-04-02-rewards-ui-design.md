# ChoreChamps Rewards UI Design Spec

## Overview

Rewards management for parents (catalog CRUD + fulfill/cancel redemptions) and reward redemption for children (browse + redeem from home screen). Follows existing patterns: NavBar, list+modal, stacked layout.

## Parent View — Rewards Page (`/rewards`)

Accessible via NavBar (enable the "Rewards" tab). Same layout as ChoreManagement page.

### Reward Catalog Section

- Header: "🎁 Rewards" with "+ New" button
- List of active rewards: name, icon, pointCost badge
- Each row has edit (✏️) and delete (🗑) buttons
- Delete calls soft-delete API
- Edit opens RewardModal pre-filled
- Empty state: "No rewards yet — create one for your kids"

### RewardModal (create/edit)

- Fields: Name (required), Point Cost (number, required, min 1), Icon (optional emoji), Description (optional)
- Save/Cancel buttons

### Pending Redemptions Section

- Header: "⏳ Pending Redemptions"
- List of pending redemptions: child name, reward name, points spent, fulfill (✅) and cancel (❌) buttons
- Fulfill calls `PATCH /redemptions/:id/fulfill`
- Cancel calls `PATCH /redemptions/:id/cancel` (refunds points)
- Empty state: "No pending redemptions 🎉"

## Child View — Rewards on ChildHome

Add two new sections to the bottom of ChildHome (below leaderboard):

### Available Rewards Section

- Header: "🎁 Rewards"
- List of active rewards: name, icon, point cost
- "Redeem" button on each — disabled if child's balance < pointCost, shows "Need X more pts"
- Redeem calls `POST /redemptions` with the rewardId
- On success: refresh points balance and redemptions list

### My Redemptions Section

- Header: "📦 My Redemptions"
- List of child's redemptions (recent, newest first)
- Status badges: 🟡 pending, ✅ fulfilled, ❌ cancelled
- Cancel button on pending redemptions (refunds points)
- Empty state: "No redemptions yet"

## File Structure

```
src/
  api/
    rewards.ts                 # Create: reward + redemption API functions

  components/
    RewardList.tsx             # Create: reward catalog list with edit/delete
    RewardModal.tsx            # Create: create/edit reward form modal
    PendingRedemptions.tsx     # Create: pending redemptions with fulfill/cancel (parent)
    AvailableRewards.tsx       # Create: reward list with redeem button (child)
    MyRedemptions.tsx          # Create: child's redemption history with cancel

  pages/
    RewardsManagement.tsx      # Create: parent rewards page
    ChildHome.tsx              # Modify: add AvailableRewards + MyRedemptions sections

  components/
    NavBar.tsx                 # Modify: enable Rewards tab

  App.tsx                      # Modify: add /rewards route
```

## API Functions (src/api/rewards.ts)

```
Reward CRUD:
- getRewards(familyId) → GET /api/families/:familyId/rewards
- createReward(familyId, input) → POST /api/families/:familyId/rewards
- updateReward(familyId, rewardId, input) → PATCH /api/families/:familyId/rewards/:rewardId
- deleteReward(familyId, rewardId) → DELETE /api/families/:familyId/rewards/:rewardId

Redemptions:
- redeemReward(familyId, rewardId) → POST /api/families/:familyId/redemptions
- getRedemptions(familyId) → GET /api/families/:familyId/redemptions
- fulfillRedemption(familyId, redemptionId) → PATCH .../fulfill
- cancelRedemption(familyId, redemptionId) → PATCH .../cancel
```

## Responsive Behavior

Same as ChoreManagement: mobile full-width, desktop max-w-4xl centered, modals centered with backdrop.
