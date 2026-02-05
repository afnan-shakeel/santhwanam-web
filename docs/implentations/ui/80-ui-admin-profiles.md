# Admin Entity Profiles - UI Design

## Overview

Entity profile pages for Forum, Area, and Unit. These are **entity-centric profiles** (not user profiles) that show organizational entity details with admin information as a section.

### Key Principles

1. **Entity-first**: The profile is about the Forum/Area/Unit, not the admin user
2. **Compact header**: Minimal, professional header with essential info
3. **Quick actions**: Cash management actions for own profile only
4. **Tabbed content**: Subordinates and detailed cash custody in tabs

---

## URL Structure

| Context | Route |
|---------|-------|
| Own profile (logged-in admin) | `/my-profile` |
| Forum Admin viewing an Area | `/areas/:areaId` |
| Area Admin viewing a Unit | `/units/:unitId` |
| Super Admin viewing any | `/forums/:forumId`, `/areas/:areaId`, `/units/:unitId` |

---

## Common Layout Structure

All three entity types share the same layout pattern with entity-specific content.

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                      │
│ - Entity name, code, hierarchy                              │
│ - Admin summary                                             │
├─────────────────────────────────────────────────────────────┤
│ QUICK ACTIONS BAR (own profile only)                        │
│ - Cash balance + action buttons                             │
├─────────────────────────────────────────────────────────────┤
│ TABS                                                        │
│ - Overview | Subordinates | Cash Custody                    │
├─────────────────────────────────────────────────────────────┤
│ TAB CONTENT                                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Header Design (Compact - Option D)

### Own Profile View

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🏢 Ruwi Central Unit                      [Edit] [Actions ▾]│
│  UNIT-001 • Muscat Area → Oman Forum                        │
│  👤 Sarah Ahmed • sarah@email.com              [Reassign]   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  💰 ₹15,000      [📥 Receive Cash (3)]    [↗️ Transfer Cash]│
├─────────────────────────────────────────────────────────────┤
```

### Parent/Super Admin View (Not Own Profile)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🏢 Ruwi Central Unit                      [Edit] [Actions ▾]│
│  UNIT-001 • Muscat Area → Oman Forum                        │
│  👤 Sarah Ahmed • sarah@email.com              [Reassign]   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
```

No quick actions bar when viewing another entity's profile.

---

## Header Components

### Row 1: Entity Title + Actions

```html
<div class="flex items-center justify-between">
  <div class="flex items-center gap-3">
    <span class="text-2xl">🏢</span>  <!-- or custom icon per entity type -->
    <h1 class="text-xl font-semibold text-gray-900">Ruwi Central Unit</h1>
  </div>
  <div class="flex items-center gap-2">
    <button class="btn-secondary">Edit</button>
    <dropdown-menu>Actions ▾</dropdown-menu>
  </div>
</div>
```

### Row 2: Entity Meta + Hierarchy

```html
<div class="flex items-center gap-2 text-sm text-gray-600">
  <span class="font-medium">UNIT-001</span>
  <span>•</span>
  <span>Muscat Area</span>
  <span>→</span>
  <span>Oman Forum</span>
</div>
```

### Row 3: Admin Summary

```html
<div class="flex items-center justify-between">
  <div class="flex items-center gap-2 text-sm text-gray-600">
    <span>👤</span>
    <span class="font-medium text-gray-900">Sarah Ahmed</span>
    <span>•</span>
    <span>sarah@email.com</span>
  </div>
  <button class="btn-link text-sm">Reassign</button>
</div>
```

### Quick Actions Bar (Own Profile Only)

```html
<div class="flex items-center justify-between py-3 px-4 bg-gray-50 border-t border-b">
  <div class="flex items-center gap-2">
    <span class="text-gray-500">💰</span>
    <span class="text-lg font-semibold text-gray-900">₹15,000</span>
    <span class="text-sm text-gray-500">in custody</span>
  </div>
  <div class="flex items-center gap-3">
    <button class="btn-secondary">
      📥 Receive Cash
      <span class="badge badge-warning ml-1">3</span>
    </button>
    <button class="btn-secondary">
      ↗️ Transfer Cash
    </button>
  </div>
</div>
```

---

## Entity-Specific Configurations

### Unit Profile

**Header:**
- Icon: 🏢 (or building icon)
- Hierarchy: `{areaName} → {forumName}`

**Quick Actions (own profile):**
- Cash Balance (from custody)
- Receive Cash → `/cash/pending-receipts`
- Transfer Cash → `/cash/handover/new`

**Tabs:**
1. Overview
2. Agents
3. Cash Custody

**Actions Dropdown:**
- Edit Unit Details
- Reassign Unit Admin
- View Audit Log (future)

---

### Area Profile

**Header:**
- Icon: 📍 (or map-pin icon)
- Hierarchy: `{forumName}`

**Quick Actions (own profile):**
- Cash Balance (from custody)
- Receive Cash → `/cash/pending-receipts`
- Transfer Cash → `/cash/handover/new`

**Tabs:**
1. Overview
2. Units
3. Cash Custody

**Actions Dropdown:**
- Edit Area Details
- Reassign Area Admin
- Create New Unit
- View Audit Log (future)

---

### Forum Profile

**Header:**
- Icon: 🌐 (or globe icon)
- Hierarchy: (none - top level)

**Quick Actions (own profile):**
- Cash Balance (from custody)
- Receive Cash → `/cash/pending-receipts`
- Transfer to Bank → `/cash/handover/new?recipient=bank`
- Pending Approvals → `/approvals/my-approvals`

**Tabs:**
1. Overview
2. Areas
3. Cash Custody

**Actions Dropdown:**
- Edit Forum Details
- Reassign Forum Admin
- Create New Area
- View Audit Log (future)

---

## Tab Content

### Tab 1: Overview

Quick stats relevant to the entity's scope.

#### Unit Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Overview                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Agents      │  │ Members     │  │ Pending     │         │
│  │     8       │  │    156      │  │ Approvals   │         │
│  │             │  │ 152 active  │  │     3       │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  Recent Activity                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ • Agent John Doe registered new member (2 hours ago) │  │
│  │ • Cash handover received from AGT-001 (5 hours ago)  │  │
│  │ • Member MEM-456 suspended (1 day ago)               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Area Overview

```
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Units       │  │ Agents      │  │ Members     │         │
│  │     5       │  │    24       │  │    892      │         │
│  │             │  │             │  │ 876 active  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
```

#### Forum Overview

```
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  │ Areas       │  │ Units       │  │ Agents      │  │ Members     │
│  │     4       │  │    18       │  │    96       │  │   4,250     │
│  │             │  │             │  │             │  │ 4,180 active│
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
│
│  ┌─────────────┐
│  │ Pending     │
│  │ Approvals   │
│  │     5       │
│  └─────────────┘
```

---

### Tab 2: Subordinates (Agents/Units/Areas)

List of child entities with basic management actions.

#### Unit → Agents Tab

```
┌─────────────────────────────────────────────────────────────┐
│ Agents                                          [+ Add Agent]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Search: [________________________]  Status: [All ▾]        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Agent           │ Code       │ Members │ Status │     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ John Doe        │ AGT-001    │ 24      │ Active │ ⋮   │  │
│  │ Jane Smith      │ AGT-002    │ 18      │ Active │ ⋮   │  │
│  │ Bob Wilson      │ AGT-003    │ 31      │ Active │ ⋮   │  │
│  │ Alice Brown     │ AGT-004    │ 12      │ Suspended│ ⋮ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Showing 1-4 of 8                              [1] [2] [>]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Row Actions (⋮):**
- View Profile
- View Members
- Suspend/Activate

#### Area → Units Tab

```
┌─────────────────────────────────────────────────────────────┐
│ Units                                           [+ Add Unit]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Search: [________________________]                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Unit            │ Code       │ Agents │ Members │     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Ruwi Central    │ UNIT-001   │ 8      │ 156     │ ⋮   │  │
│  │ Ruwi East       │ UNIT-002   │ 6      │ 124     │ ⋮   │  │
│  │ Ruwi West       │ UNIT-003   │ 5      │ 98      │ ⋮   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Row Actions (⋮):**
- View Profile
- Reassign Admin

#### Forum → Areas Tab

```
┌─────────────────────────────────────────────────────────────┐
│ Areas                                           [+ Add Area]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Area            │ Code       │ Units │ Members │      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Muscat Area     │ AREA-001   │ 5     │ 892     │ ⋮    │  │
│  │ Salalah Area    │ AREA-002   │ 4     │ 756     │ ⋮    │  │
│  │ Sohar Area      │ AREA-003   │ 3     │ 534     │ ⋮    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Row Actions (⋮):**
- View Profile
- Reassign Admin

---

### Tab 3: Cash Custody

Detailed view of the admin's personal cash custody.

```
┌─────────────────────────────────────────────────────────────┐
│ Cash Custody                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current Balance                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │   💰 ₹15,000                                         │  │
│  │                                                       │  │
│  │   Total Received: ₹125,000                           │  │
│  │   Total Transferred: ₹110,000                        │  │
│  │   Last Transaction: Jan 15, 2025 at 3:45 PM          │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Recent Transactions                        [View All →]    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Date       │ Type     │ From/To      │ Amount │ Status│  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Jan 15     │ Received │ AGT-001      │ +₹5,000│ ✓     │  │
│  │ Jan 14     │ Transfer │ → Area Admin │ -₹8,000│ ✓     │  │
│  │ Jan 14     │ Received │ AGT-003      │ +₹3,000│ ✓     │  │
│  │ Jan 13     │ Received │ AGT-002      │ +₹2,500│ ✓     │  │
│  │ Jan 12     │ Transfer │ → Area Admin │-₹12,000│ ✓     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Note:** This tab shows the admin's **personal custody** only, not aggregated subordinate custody.

---

## Mobile View

### Header (Stacked)

```
┌────────────────────────────┐
│ 🏢 Ruwi Central Unit    ⋮ │
│ UNIT-001                   │
│ Muscat Area → Oman Forum   │
│                            │
│ 👤 Sarah Ahmed             │
│ sarah@email.com            │
├────────────────────────────┤
│ 💰 ₹15,000                 │
│                            │
│ [📥 Receive (3)]           │
│ [↗️ Transfer Cash]         │
├────────────────────────────┤
│ [Overview] [Agents] [Cash] │
└────────────────────────────┘
```

---

## Component Architecture

```
src/app/features/
├── forums/
│   └── forum-profile/
│       ├── forum-profile.component.ts
│       ├── forum-profile.component.html
│       └── forum-profile.component.css
├── areas/
│   └── area-profile/
│       ├── area-profile.component.ts
│       ├── area-profile.component.html
│       └── area-profile.component.css
├── units/
│   └── unit-profile/
│       ├── unit-profile.component.ts
│       ├── unit-profile.component.html
│       └── unit-profile.component.css
└── shared/
    └── components/
        ├── entity-profile-header/
        │   ├── entity-profile-header.component.ts   # Reusable header
        │   └── entity-profile-header.component.html
        ├── quick-actions-bar/
        │   ├── quick-actions-bar.component.ts
        │   └── quick-actions-bar.component.html
        └── entity-stats-card/
            ├── entity-stats-card.component.ts
            └── entity-stats-card.component.html
```

### Shared EntityProfileHeader Component

```typescript
@Component({
  selector: 'app-entity-profile-header',
  templateUrl: './entity-profile-header.component.html'
})
export class EntityProfileHeaderComponent {
  // Inputs
  entityType = input.required<'forum' | 'area' | 'unit'>();
  entityName = input.required<string>();
  entityCode = input.required<string>();
  hierarchy = input<{ areaName?: string; forumName?: string }>();
  
  admin = input.required<{
    name: string;
    email: string;
    phone?: string;
    assignedDate?: string;
  }>();
  
  isOwnProfile = input<boolean>(false);
  
  // Quick actions config (only shown if isOwnProfile)
  cashBalance = input<number | null>(null);
  pendingReceiveCount = input<number>(0);
  pendingApprovalsCount = input<number>(0); // Forum only
  
  // Outputs
  onEdit = output<void>();
  onReassignAdmin = output<void>();
  onReceiveCash = output<void>();
  onTransferCash = output<void>();
  onViewApprovals = output<void>(); // Forum only
  
  // Computed
  entityIcon = computed(() => {
    const icons = { forum: '🌐', area: '📍', unit: '🏢' };
    return icons[this.entityType()];
  });
  
  hierarchyDisplay = computed(() => {
    const h = this.hierarchy();
    if (!h) return null;
    
    if (this.entityType() === 'unit') {
      return `${h.areaName} → ${h.forumName}`;
    }
    if (this.entityType() === 'area') {
      return h.forumName;
    }
    return null;
  });
  
  showQuickActions = computed(() => {
    return this.isOwnProfile() && this.cashBalance() !== null;
  });
}
```

---

## API Endpoints

### Unit Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/units/:unitId` | Get unit details with admin info |
| GET | `/api/units/:unitId/stats` | Get unit statistics |
| GET | `/api/units/:unitId/agents` | Get agents in unit (paginated) |
| GET | `/api/cash/my-custody` | Get logged-in user's custody |
| PUT | `/api/units/:unitId` | Update unit details |

### Area Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/areas/:areaId` | Get area details with admin info |
| GET | `/api/areas/:areaId/stats` | Get area statistics |
| GET | `/api/areas/:areaId/units` | Get units in area (paginated) |
| GET | `/api/cash/my-custody` | Get logged-in user's custody |
| PUT | `/api/areas/:areaId` | Update area details |
| POST | `/api/units` | Create new unit |

### Forum Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/forums/:forumId` | Get forum details with admin info |
| GET | `/api/forums/:forumId/stats` | Get forum statistics |
| GET | `/api/forums/:forumId/areas` | Get areas in forum (paginated) |
| GET | `/api/cash/my-custody` | Get logged-in user's custody |
| GET | `/api/approvals/my-approvals/count` | Get pending approvals count |
| PUT | `/api/forums/:forumId` | Update forum details |
| POST | `/api/areas` | Create new area |

---

## Data Structures

### Entity Profile Response

```typescript
interface UnitProfile {
  unitId: string;
  unitCode: string;
  unitName: string;
  establishedDate: string;
  
  // Hierarchy
  areaId: string;
  areaName: string;
  forumId: string;
  forumName: string;
  
  // Admin
  admin: {
    userId: string;
    name: string;
    email: string;
    phone?: string;
    assignedDate: string;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

interface AreaProfile {
  areaId: string;
  areaCode: string;
  areaName: string;
  establishedDate: string;
  
  // Hierarchy
  forumId: string;
  forumName: string;
  
  // Admin
  admin: {
    userId: string;
    name: string;
    email: string;
    phone?: string;
    assignedDate: string;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

interface ForumProfile {
  forumId: string;
  forumCode: string;
  forumName: string;
  establishedDate: string;
  
  // Admin
  admin: {
    userId: string;
    name: string;
    email: string;
    phone?: string;
    assignedDate: string;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

### Entity Stats Response

```typescript
interface UnitStats {
  totalAgents: number;
  totalMembers: number;
  activeMembers: number;
  suspendedMembers: number;
  pendingApprovals: number;
}

interface AreaStats {
  totalUnits: number;
  totalAgents: number;
  totalMembers: number;
  activeMembers: number;
}

interface ForumStats {
  totalAreas: number;
  totalUnits: number;
  totalAgents: number;
  totalMembers: number;
  activeMembers: number;
  pendingApprovals: number;
}
```

### Cash Custody Response

```typescript
interface CashCustody {
  custodyId: string;
  currentBalance: number;
  totalReceived: number;
  totalTransferred: number;
  lastTransactionAt: string | null;
  
  recentTransactions: {
    date: string;
    type: 'Received' | 'Transferred';
    counterparty: string;
    amount: number;
    status: string;
  }[];
}
```

---

## Permissions

| Action | Unit Admin | Area Admin | Forum Admin | Super Admin |
|--------|------------|------------|-------------|-------------|
| View own profile | ✅ | ✅ | ✅ | ✅ |
| View subordinate profile | ❌ | ✅ Units | ✅ Areas, Units | ✅ All |
| Edit own entity | ✅ | ✅ | ✅ | ✅ |
| Edit subordinate entity | ❌ | ✅ Units | ✅ Areas, Units | ✅ All |
| Reassign own admin | ❌ | ❌ | ❌ | ✅ |
| Reassign subordinate admin | ❌ | ✅ Units | ✅ Areas, Units | ✅ All |
| Create subordinate | ❌ | ✅ Units | ✅ Areas, Units | ✅ All |
| Quick actions | ✅ Own | ✅ Own | ✅ Own | ❌ |

---

## Summary

### 3 Profile Types
1. **Unit Profile** - Tabs: Overview, Agents, Cash Custody
2. **Area Profile** - Tabs: Overview, Units, Cash Custody
3. **Forum Profile** - Tabs: Overview, Areas, Cash Custody

### Header Structure (Compact)
- Row 1: Entity icon + name + action buttons
- Row 2: Entity code + hierarchy breadcrumb
- Row 3: Admin name + email + reassign link
- Quick Actions Bar: Cash balance + action buttons (own profile only)

### Quick Actions
- **Unit/Area**: Receive Cash, Transfer Cash
- **Forum**: Receive Cash, Transfer to Bank, Pending Approvals

### Key Features
- Compact, professional header design
- Quick actions for primary cash management tasks
- Tabbed interface for detailed information
- Reusable shared components
- Mobile-responsive layout