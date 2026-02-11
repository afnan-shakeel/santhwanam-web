## Navigation Return Pattern Spec

### Overview

A shared, reusable navigation return mechanism that allows users to be directed back to their origin page after completing an action (form submission, viewing a detail page, etc.). Uses an explicit `returnUrl` query parameter as the primary mechanism with graceful fallbacks.

### How It Works

**Outbound Navigation (Caller)**

When navigating to a form or detail page, the calling page passes its own URL as a `returnUrl` query param:

```
/cash/initiate-handover?returnUrl=%2Funits%2F123%2Fprofile%3Ftab%3Dcash-custody
```

The `returnUrl` must be URL-encoded and can include the full path with query params (active tab, filters, etc.) to preserve the caller's state.

**Return Navigation (Target Page)**

On successful action or back button click, the target page reads `returnUrl` and navigates. The fallback chain is:

1. `returnUrl` query param → navigate there
2. No `returnUrl` → `history.back()`

### Shared Back Button Component

A reusable `BackButtonComponent` that reads `returnUrl` from the current route's query params and executes the fallback chain above. This component is placed on any page that needs an explicit back affordance — form pages, detail views accessed from multiple origins, etc.

It renders as the `<` icon button already present in your UI (visible in the screenshot next to "Member Wallet" heading).

### Which Pages Use This

**Pages that pass `returnUrl` (callers):** Any page that navigates to a shared form or detail view — forum/area/unit/agent profiles, cash custody page, member listings, death claims listings, etc.

**Pages that consume `returnUrl` (targets):** Initiate handover form, record deposit form, death claim detail, member wallet (when accessed from agent view), any page reachable from multiple origins.

### State Preservation

The `returnUrl` should encode enough state so the user lands back exactly where they were. This means including query params for active tab, scroll position if critical, and any active filters. Example:

```
returnUrl=/areas/45/profile?tab=units
```

### Dirty State Guard

Pages with forms should implement Angular's `CanDeactivate` guard. If the user clicks the back button or browser back with unsaved changes, prompt: "You have unsaved changes. Are you sure you want to leave?" This applies regardless of whether navigation is triggered by the shared back button, breadcrumbs, or browser back.

### Post-Action Flow

On successful form submission:
1. Show a toast/snackbar confirming the action ("Handover initiated successfully")
2. Navigate to `returnUrl` (or fallback)

On cancel:
1. Navigate to `returnUrl` (or fallback) immediately, no toast needed

### Security Consideration

Validate `returnUrl` before navigating — ensure it's a relative path (starts with `/`) and belongs to your application. Never allow absolute URLs or external redirects. This prevents open redirect vulnerabilities if the URL is tampered with.

---
