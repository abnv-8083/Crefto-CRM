# Crefto CRM — UI Upgrade Implementation Plan

## Executive Summary

After reading all 28 source files, the codebase is in good structural shape (Tailwind v4, lucide-react, consistent component library), but has the following categories of pain points:

1. **Layout inconsistency** — `Layout.jsx` wraps `<Outlet>` in a generic `p-4 md:p-6` div, while `index.css` defines a purpose-built `.page-canvas` class that never gets used. This means the `.page-canvas` responsive padding rules (`28px 32px` on xl, `16px` on mobile) are completely dead code.
2. **`App.css` is dead weight** — Contains Vite scaffold styles (`.hero`, `.ticks`, `#center`) that are never rendered anywhere in the app. These should be deleted.
3. **Sidebar is fully rebuilt in Tailwind but duplicates the `.sidebar` / `.nav-item` CSS classes** — Both coexist silently. The CSS classes go unused.
4. **Filter bars are inconsistently structured** — Some pages (LeadsPage, TasksPage) put filters inside a `<Card padding="p-4">`, others (FollowUpsPage) put the tab selector outside any card. Heights, gap sizes, and border treatments differ.
5. **Page headers are inconsistent** — `PageHeader` component exists and is used most places, but `DashboardPage`, `LeadDetailPage`, `CustomerDetailPage`, and `QuotationDetailPage` hand-roll their own header markup.
6. **Table header/row styles are duplicated** — Every page hand-rolls `px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider` on every `<th>`. The `Table` component exists but isn't used on most pages — pages build their own `<table>` directly.
7. **Missing focus-ring accessibility** — Inline `<input>` and `<select>` elements in filter bars use `focus:ring-2 focus:ring-indigo-500` but lack `focus:border-transparent` in several places. Checkboxes have no explicit accent color.
8. **Hover states on action buttons are too subtle** — `hover:bg-slate-100` is the only signal on icon-only action buttons; no `transition-colors` duration is specified in several spots.
9. **DealsPage summary stats duplicate StatCard** — Four inline stat divs in `DealsPage` and `ReportsPage` manually recreate the `StatCard` component structure instead of using it.
10. **`CalendarPage` calendar cells lack minimum-height consistency on mobile** — `min-h-24` (96px) is fine on desktop but cells collapse on small screens.
11. **`ActivitiesPage` filter chips** — 13 type-filter buttons overflow in a wrapping flex row with no scroll affordance on mobile.
12. **`QuotationDetailPage` print styles** — `print:shadow-none` is the only print accommodation; the full sidebar and topbar still render on print.
13. **Empty `App.css`** — Still imports Vite scaffold variables (`var(--accent)`) that don't exist in Tailwind v4; will produce console warnings.
14. **`Sidebar` uses hardcoded `w-4.5 h-4.5`** — Tailwind v4 supports arbitrary values, so this works, but the icon size is inconsistent with the rest of the app which uses `w-4 h-4` or `w-5 h-5`.
15. **`StatCard` in `ui/index.jsx`** uses the `.card-hover` CSS class, which is defined in `index.css`. This is the one intentional CSS-class crossover. It works correctly and should be preserved.
16. **`Topbar` notification badge** uses `w-4.5 h-4.5` — same arbitrary-value issue as Sidebar.
17. **`SettingsPage` sidebar nav** — Duplicates the `bg-indigo-600 text-white` / `text-slate-600 hover:bg-slate-50` active pattern that the `Tabs` component already handles.
18. **`DashboardPage`** — The greeting uses a hardcoded `"Good morning"`. Should be dynamic based on time of day.
19. **`CustomerDetailPage` tabs** — Hand-rolled tab buttons instead of using the `<Tabs>` component from `ui/index.jsx`.
20. **`FollowUpsPage` tabs** — Same issue; uses hand-rolled tab buttons, not `<Tabs>`.

---

## Edit Order (dependency-first)

```
1. src/App.css                          — delete dead scaffold content
2. src/index.css                        — add missing tokens, fix dead classes
3. src/components/ui/index.jsx          — improve shared components
4. src/components/layout/Layout.jsx     — apply page-canvas, fix content wrapper
5. src/components/layout/Sidebar.jsx    — fix icon sizes, minor polish
6. src/components/layout/Topbar.jsx     — fix badge size, notification dot
7. src/pages/DashboardPage.jsx          — dynamic greeting, use PageHeader
8. src/pages/auth/LoginPage.jsx         — decorative background fix
9. src/pages/auth/RegisterPage.jsx      — consistency with LoginPage
10. src/pages/auth/ForgotPasswordPage.jsx
11. src/pages/leads/LeadsPage.jsx       — filter bar, table, view toggle
12. src/pages/leads/LeadDetailPage.jsx  — header, pipeline, timeline
13. src/pages/customers/CustomersPage.jsx
14. src/pages/customers/CustomerDetailPage.jsx — use Tabs component
15. src/pages/contacts/ContactsPage.jsx
16. src/pages/deals/DealsPage.jsx       — use StatCard, kanban polish
17. src/pages/tasks/TasksPage.jsx       — view toggle, filter bar
18. src/pages/activities/ActivitiesPage.jsx — filter chip scroll
19. src/pages/followups/FollowUpsPage.jsx  — use Tabs component
20. src/pages/quotations/QuotationsPage.jsx
21. src/pages/quotations/QuotationDetailPage.jsx — print styles
22. src/pages/products/ProductsPage.jsx
23. src/pages/calendar/CalendarPage.jsx — mobile cell heights
24. src/pages/reports/ReportsPage.jsx   — use StatCard
25. src/pages/settings/SettingsPage.jsx — use Tabs component
26. src/pages/users/UsersPage.jsx
```

---

## 1. Current Pain Points Per File

### `src/App.css`
- Contains Vite scaffold styles (`.hero`, `.ticks`, `#center`, `#next-steps`, `#docs`, `#spacer`, `.counter`) that are never referenced anywhere in the app.
- References CSS custom properties (`var(--accent)`, `var(--border)`, `var(--shadow)`) that don't exist — will produce console warnings in dev.
- File should be reduced to an empty file (or just a comment) since all real styles live in `index.css`.

### `src/index.css`
- Defines `.page-canvas` but `Layout.jsx` uses a plain `<div className="p-4 md:p-6">` instead — the class is dead.
- Defines `.sidebar`, `.nav-item`, `.topbar`, `.main-content` CSS classes that are completely unused (all layout is in Tailwind classes inside the JSX).
- Missing CSS tokens: no `--radius-*` tokens for consistent border-radius, no `--transition-fast` for button/hover consistency.
- Missing `@media print` rule to hide sidebar and topbar.
- `@keyframes fadeIn` and `@keyframes slideIn` are defined but `animate-slideIn` is never applied anywhere — it's dead but harmless.
- No focus-visible outline override for keyboard navigation beyond what Tailwind provides.

### `src/components/ui/index.jsx`
- `StatCard` hardcodes `.card-hover` CSS class — acceptable but worth documenting.
- `Button` component: `rounded-xl` is used for all sizes. The `xs` size looks chunky with `rounded-xl`; should use `rounded-lg`.
- `Input`/`Select`/`Textarea`: `hover:border-slate-300` hover state is present — good. But `focus:ring-offset-0` is missing; on dark backgrounds the default ring offset shows white.
- `Table` component exists but is not used in any page (pages all hand-roll their `<table>`). The `Table` component should be used, but migrating all pages to it is high-risk — instead, its styles should be updated to match what pages already do, so when pages do adopt it, it's consistent.
- `Tabs` component: the active state uses `bg-white text-slate-800 shadow-sm` on a `bg-slate-100` container. This looks fine but deviates from the `bg-indigo-600 text-white` active style used on most other pages' hand-rolled tabs.
- `PageHeader`: `mb-6` is fixed but some pages need `mb-5` — this creates a 4px inconsistency in vertical rhythm. Should be a prop with default `mb-6`.
- `Avatar`: always uses `from-indigo-500 to-purple-600`. For the Users page the online/offline dot overlay works but the same gradient makes all avatars look identical. A `colorIndex` prop based on name hash would be better — but this is a larger change. Leave as-is for now; just document.
- `EmptyState`: icon container uses `bg-slate-100 rounded-2xl` but `w-16 h-16` is declared. The icon inside is `w-8 h-8 text-slate-300` — the icon is too pale and small. Should be `w-9 h-9 text-slate-400`.
- `Pagination`: when `pages > 5`, only shows pages 1–5 (i.e. `Math.min(5, pages)`). This means page 10+ is unreachable. Should use a smart window (prev/next ± 2) instead.
- `Modal` close button: only `text-slate-400 hover:text-slate-600`. Should add `hover:bg-slate-100` to match action buttons.
- `ScoreBadge`: missing a dot indicator or icon for quick visual scanning.
- `ActivityIcon`: uses emoji — these render differently across OS. Could be replaced with Lucide icons but that's a larger change. Leave as-is.
- `FilterBar`: defined but never used — pages build their own filter bar divs. Can be used to wrap filter areas consistently.

### `src/components/layout/Layout.jsx`
- **Critical:** Wraps `<Outlet>` in `<div className="p-4 md:p-6 animate-fadeIn">`. This overrides the intended `page-canvas` class from `index.css`. The responsive breakpoints differ (`md:p-6` = 24px, vs `page-canvas`'s xl: 28px 32px).
- `<main className="flex-1 overflow-y-auto">` — the overflow is on `main`, not the inner div. The `animate-fadeIn` is applied to the inner div, so the fade applies to every navigation, which is correct.
- Loading spinner uses `animate-pulse` on the logo container, which is different from the `Skeleton` component's shimmer — minor inconsistency.

### `src/components/layout/Sidebar.jsx`
- Icon size: `w-4.5 h-4.5` — arbitrary Tailwind value. Works in v4 but inconsistent. Should be `w-[18px] h-[18px]` or just `w-4 h-4`.
- `ChevronRight` active indicator on nav items is a nice touch but adds visual clutter when all items are visible. It's meaningful only for nested nav — consider removing or making it a subtle dot.
- Mobile close button: `text-slate-400 hover:text-white` has no intermediate state — jump from grey to white. Add `hover:text-slate-200`.
- Company name section and logo section both have `border-b border-slate-700` — creates a double-border feeling at the top. One separator is enough.
- The `isAdmin` import from `useAuth` is destructured but never used in Sidebar — only `user` is used.

### `src/components/layout/Topbar.jsx`
- Notification badge: `w-4.5 h-4.5` — same arbitrary-value issue.
- Search input: `focus:ring-2 focus:ring-indigo-500 focus:border-transparent` is correct. Good.
- QuickAdd button shadow: `shadow-sm shadow-indigo-200` — the `shadow-indigo-200` color utility requires Tailwind v3-style color shadows. In Tailwind v4 this may not work as expected; should use `shadow-indigo-200/50` or inline style.
- User menu dropdown: no `ring-1 ring-slate-100/5` or similar depth cue on the avatar button itself when menu is open. The button just gets `hover:bg-slate-100`. Add `aria-expanded` for accessibility and an active ring.
- The `TrendingUp` icon is imported but never used in Topbar (was likely removed when the logo was moved to Sidebar). Remove it.

---

## 2. Specific JSX/className Changes Per File

---

### `src/App.css` — REPLACE ENTIRE FILE CONTENT

Replace the entire file with:
```css
/* App-level styles live in src/index.css */
```
All `.hero`, `.ticks`, `#center`, `#next-steps`, `#docs`, `#spacer`, `.counter` blocks must be deleted.

---

### `src/index.css` — TOKEN ADDITIONS + DEAD CLASS REMOVAL + PRINT RULE

**Add to `@theme` block** (after existing color tokens):
```css
--radius-sm:   8px;
--radius-md:   10px;
--radius-lg:   12px;
--radius-xl:   16px;
--radius-2xl:  20px;

--shadow-card: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
--shadow-card-hover: 0 6px 20px rgba(0,0,0,0.08);
--shadow-dropdown: 0 10px 40px rgba(0,0,0,0.12);

--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
```

**Remove** the following unused CSS classes entirely (they are fully replaced by Tailwind classes in JSX):
- `.sidebar` block
- `.main-content` block
- `.topbar` block

Keep `.page-canvas`, `.card`, `.card-hover`, `.stat-card`, `.nav-item`, `.table-head`, `.table-row`, `.badge`, `.btn*`, `.input-base`, `.modal-*`, `.kanban-*`, `.timeline-*`, `.section-label`, `.progress-*`, `.empty-state*`, `.skeleton`, `.tooltip`, `.gradient-text`, `.glass-card`, `.truncate-2`, `.has-tooltip`.

**Add print media rule** at end of file:
```css
@media print {
  .sidebar,
  aside,
  header.topbar,
  header[class*="h-16"] {
    display: none !important;
  }
  .main-content,
  main,
  .page-canvas {
    margin: 0 !important;
    padding: 0 !important;
  }
}
```

**Add focus-visible override** for keyboard navigation:
```css
:focus-visible {
  outline: 2px solid #6366F1;
  outline-offset: 2px;
}
button:focus:not(:focus-visible),
input:focus:not(:focus-visible),
select:focus:not(:focus-visible) {
  outline: none;
}
```

---

### `src/components/ui/index.jsx` — TARGETED IMPROVEMENTS

**1. `Button` component — fix xs border-radius:**
```jsx
// Change sizes object:
const sizes = {
  xs: 'text-xs px-2.5 py-1.5 rounded-lg',   // was rounded-xl
  sm: 'text-sm px-3 py-2 rounded-xl',
  md: 'text-sm px-4 py-2.5 rounded-xl',
  lg: 'text-base px-6 py-3 rounded-xl',
};
// Remove rounded-xl from the base className string — let each size own its radius:
className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-200
  ${variants[variant]} ${sizes[size]} ${className}`}
```

**2. `Modal` close button — add hover background:**
```jsx
// Change from:
className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
// to (add focus-visible ring):
className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
```

**3. `EmptyState` — enlarge icon:**
```jsx
// Change icon size:
{Icon && <Icon className="w-9 h-9 text-slate-400" />}
//                           ^^^^ was w-8 h-8 text-slate-300
```

**4. `Pagination` — smart page window instead of `Math.min(5, pages)`:**
```jsx
// Replace the page button generation with:
const pageWindow = () => {
  const delta = 2;
  const range = [];
  for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
    range.push(i);
  }
  return range;
};
// Then in JSX:
{pageWindow().map((p) => (
  <button key={p} onClick={() => onPageChange(p)}
    className={`px-3 py-1.5 text-xs rounded-lg ${p === page ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
    {p}
  </button>
))}
```

**5. `PageHeader` — add optional `spacing` prop:**
```jsx
export const PageHeader = ({ title, subtitle, actions, breadcrumb, spacing = 'mb-6' }) => (
  <div className={`flex items-start justify-between ${spacing}`}>
  ...
```

**6. `Tabs` component — add `variant` prop for `indigo` active state:**
The existing `Tabs` uses `bg-white` active. Many pages want `bg-indigo-600 text-white` active. Add a `variant` prop:
```jsx
export const Tabs = ({ tabs, activeTab, onChange, variant = 'pill' }) => {
  const containerClass = variant === 'pill' ? 'flex gap-1 bg-slate-100 p-1 rounded-xl' : 'flex gap-1 bg-white border border-slate-200 rounded-xl p-1';
  const activeClass = variant === 'pill'
    ? 'bg-white text-slate-800 shadow-sm'
    : 'bg-indigo-600 text-white shadow-sm';
  const inactiveClass = 'text-slate-500 hover:text-slate-700';
  return (
    <div className={containerClass}>
      {tabs.map(tab => (
        <button key={tab.value} onClick={() => onChange(tab.value)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${activeTab === tab.value ? activeClass : inactiveClass}`}>
          {tab.icon && <tab.icon className="w-4 h-4" />}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.value ? (variant === 'pill' ? 'bg-indigo-100 text-indigo-600' : 'bg-white/20 text-white') : 'bg-slate-200 text-slate-500'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
```

**7. `ScoreBadge` — add a small dot for quick visual scanning:**
```jsx
export const ScoreBadge = ({ score }) => {
  const color = score >= 80
    ? 'text-emerald-600 bg-emerald-50'
    : score >= 60
    ? 'text-amber-600 bg-amber-50'
    : 'text-slate-600 bg-slate-100';
  const dotColor = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-slate-400';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {score}
    </span>
  );
};
```

**8. `Card` component — use `border-slate-200` instead of `border-slate-100`** for slightly more visible card edges:
```jsx
export const Card = ({ children, className = '', padding = 'p-5', hover = false }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${padding} ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}>
```

---

### `src/components/layout/Layout.jsx` — APPLY PAGE-CANVAS

```jsx
// Current:
<main className="flex-1 overflow-y-auto">
  <div className="p-4 md:p-6 animate-fadeIn">
    <Outlet />
  </div>
</main>

// Replace with:
<main className="page-canvas animate-fadeIn">
  <Outlet />
</main>
```
This activates the responsive padding from `index.css` (24px default, 28px/32px on xl, 16px on mobile).

The loading state spinner can stay as-is — it's cosmetically fine.

---

### `src/components/layout/Sidebar.jsx` — ICON SIZE + POLISH

**1. Fix icon size** — change `w-4.5 h-4.5` to `w-[18px] h-[18px]`:
```jsx
// In NavLink className Icon:
<Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
```

**2. Remove `ChevronRight` from active items** (adds clutter, not meaningful for flat nav):
```jsx
// Remove this line entirely:
{isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
// Replace with a left-border accent instead — add to active NavLink:
// Add to the isActive branch: 'shadow-md'
```

**3. Mobile close button** — softer hover:
```jsx
// Change from:
className="lg:hidden text-slate-400 hover:text-white"
// To:
className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
```

**4. Remove unused `isAdmin` import** from `useAuth()` destructuring:
```jsx
const { user } = useAuth();
// Remove: const { user, isAdmin } = useAuth();
```

**5. Remove the `TrendingUp` import** — it's used in the logo, keep it. (It IS used in the logo div — confirmed in reading the file.)

**6. Logo section and company section border** — merge them into one combined section:
```jsx
// Wrap logo + company name in a single block with ONE border-b:
<div className="px-4 py-4 border-b border-slate-800">
  {/* Logo row */}
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
        <TrendingUp className="w-5 h-5 text-white" />
      </div>
      <div>
        <span className="text-white font-bold text-lg tracking-tight">Crefto</span>
        <span className="text-indigo-400 text-xs block -mt-1 font-medium">CRM</span>
      </div>
    </div>
    <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
      <X className="w-5 h-5" />
    </button>
  </div>
  {/* Workspace */}
  <div>
    <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest">Workspace</p>
    <p className="text-slate-200 text-sm font-semibold mt-0.5 truncate">
      {user?.company?.name || 'Company'}
    </p>
  </div>
</div>
```
This removes one visual divider and tightens the top section.

---

### `src/components/layout/Topbar.jsx` — BADGE + UNUSED IMPORT

**1. Fix notification badge size** — change `w-4.5 h-4.5` to `min-w-[18px] h-[18px]`:
```jsx
<span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
  {unreadCount > 9 ? '9+' : unreadCount}
</span>
```

**2. Remove unused `TrendingUp` import** (not used anywhere in Topbar JSX — only Sidebar uses it):
```jsx
// Remove TrendingUp from import line:
import { Menu, Search, Bell, Plus, ChevronDown, LogOut, User, Settings, Target, UserCheck, Handshake, CheckSquare, Phone, Contact, X } from 'lucide-react';
```

**3. QuickAdd button** — fix shadow color utility for Tailwind v4 compatibility:
```jsx
// Change from:
className="... shadow-sm shadow-indigo-200"
// To:
className="... shadow-[0_2px_8px_rgba(79,70,229,0.25)]"
```

**4. User menu button** — add `aria-expanded` and visual indicator when open:
```jsx
<button
  onClick={() => setShowUserMenu(!showUserMenu)}
  aria-expanded={showUserMenu}
  className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${showUserMenu ? 'bg-slate-100' : 'hover:bg-slate-100'}`}
>
```

---

### `src/pages/DashboardPage.jsx` — DYNAMIC GREETING + LAYOUT

**1. Dynamic greeting** — replace hardcoded "Good morning":
```jsx
// Before statCards definition, add:
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

// In JSX replace:
// "Good morning, {user?.firstName}! 👋"
// With:
`${getGreeting()}, ${user?.firstName}! 👋`
```

**2. Page wrapper** — add `animate-fadeIn` to the stats grid for entry animation. The wrapper `<div className="space-y-6">` is correct; no change needed.

**3. Stat cards grid** — add `animate-fadeIn` only when not loading:
```jsx
// Change the stat cards grid wrapper:
<div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 ${!loading ? 'animate-fadeIn' : ''}`}>
```

**4. Chart card section headers** — add `border-l-4 border-indigo-500 pl-3` to section title divs for visual hierarchy:
```jsx
// In each "Leads Generated" / "Revenue" chart card header div, change:
<div>
  <h2 className="font-semibold text-slate-800">Leads Generated</h2>
  <p className="text-xs text-slate-400 mt-0.5">Over the selected period</p>
</div>
// To:
<div className="border-l-3 border-indigo-500 pl-3">
  <h2 className="font-semibold text-slate-800">Leads Generated</h2>
  <p className="text-xs text-slate-400 mt-0.5">Over the selected period</p>
</div>
```
Note: `border-l-3` is a Tailwind v4 arbitrary value; use `border-l-[3px]` to be safe.

**5. Widget section (Recent Leads, Activities, Tasks) rows** — these already use `hover:bg-slate-50 transition-colors` — good. Add `group` to the `<div>` and use `group-hover:text-indigo-600` on the name text for Leads and Tasks rows for a subtle hover affordance:
```jsx
// Recent leads row — add group + name hover:
<div key={lead._id} onClick={() => navigate(`/leads/${lead._id}`)}
  className="px-5 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors group">
  <Avatar name={`${lead.firstName} ${lead.lastName}`} size="sm" />
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium text-slate-800 group-hover:text-indigo-600 truncate transition-colors">
      {lead.firstName} {lead.lastName}
    </p>
```

---

### `src/pages/auth/LoginPage.jsx` — POLISH

**1. Background blobs** — add `z-0` to the blob divs and `z-10` to the card to ensure no stacking issues:
```jsx
<div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
  <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
  <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
</div>

<div className="w-full max-w-md relative z-10">
```

**2. Demo credential buttons** — add `transition-all` duration:
```jsx
className="py-2 text-xs font-medium bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 transition-all duration-150 border border-white/10 active:scale-95"
```

**3. Remember me checkbox** — add `accent-indigo-500` for consistent checkbox color:
```jsx
<input type="checkbox" className="rounded accent-indigo-500" />
```

**4. Error alert** — add a warning icon for better accessibility:
```jsx
// Change the error div to include an icon indicator:
<div className="mb-4 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-2">
  <span className="text-base">⚠️</span>
  {error}
</div>
```

---

### `src/pages/auth/RegisterPage.jsx` — CONSISTENCY WITH LOGIN

**1. Last Name input** — missing the left icon padding (`pl-10`) — the input uses `px-4` directly without an icon wrapper. Fix by adding the `User` icon on the right or centering the layout:
```jsx
// Change the Last Name field to use an icon wrapper like First Name:
<div className="relative">
  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
  <input type="text" required value={formData.lastName}
    onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))}
    placeholder="Doe"
    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm" />
</div>
```

**2. Remove the unused `InputField` inner component** — it's defined inside `RegisterPage` but only used once (company) and then abandoned in favor of inline markup. Remove it and make all fields consistent inline markup to match LoginPage's style.

**3. Add `active:scale-95` to the submit button** for tactile press feedback:
```jsx
className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/30 mt-2 disabled:opacity-70 active:scale-95 flex items-center justify-center gap-2"
```

---

### `src/pages/auth/ForgotPasswordPage.jsx` — MINOR POLISH

**1. Back-to-login link in the form** — change from plain anchor to styled button-like anchor with icon:
```jsx
// The Link already has ArrowLeft — just add hover color transition:
<Link to="/login" className="flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-300 text-sm transition-colors">
  <ArrowLeft className="w-4 h-4" /> Back to login
</Link>
```

**2. The success state** — add a subtle `animate-fadeIn` to the success content:
```jsx
<div className="text-center py-4 animate-fadeIn">
```

---

### `src/pages/leads/LeadsPage.jsx` — FILTER BAR + TABLE + KANBAN

**1. Filter card** — the outer card is `padding="p-4"` which is `p-4` (16px). The inner gap-3 spacing is correct. Add `className="mb-5"` (was `mb-4`) for more breathing room.

**2. Search input** — add `focus:border-transparent` which is missing:
```jsx
className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
```

**3. Filter selects** — similarly add `focus:border-transparent`:
```jsx
className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
```

**4. View toggle buttons** — already use `bg-slate-100 p-1 rounded-xl` container, which is good. No change needed.

**5. Table — add hover background on selected rows:**
```jsx
// In the tbody tr:
className={`border-b border-slate-50 cursor-pointer transition-colors ${
  selectedLeads.includes(lead._id) ? 'bg-indigo-50' : 'hover:bg-slate-50'
}`}
```

**6. Bulk actions bar** — add a visual separator using `bg-indigo-50 rounded-xl p-3` instead of the current plain `border-t`:
```jsx
// Change:
<div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 flex-wrap">
// To:
<div className="mt-3 p-3 bg-indigo-50 rounded-xl flex items-center gap-3 flex-wrap">
```

**7. KanbanCard** — add `transition-all` duration for smooth hover:
```jsx
className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 group"
```

**8. KanbanColumn empty state** — improve empty state text:
```jsx
<div className="py-8 text-center">
  <p className="text-xs text-slate-400">No leads here</p>
</div>
```

---

### `src/pages/leads/LeadDetailPage.jsx` — BACK BUTTON + PIPELINE + TIMELINE

**1. Back button** — currently `hover:bg-white` with border. This creates an odd "appears on hover" effect. Fix:
```jsx
className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors"
// Remove hover:bg-white since bg-white is already the default
```

**2. Info card contact grid** — add `group` and hover text on items for clickable affordance (email/phone should be `<a>` tags):
```jsx
// For email:
{ icon: Mail, label: 'Email', value: lead.email, href: `mailto:${lead.email}` },
// For phone:
{ icon: Phone, label: 'Phone', value: lead.phone, href: `tel:${lead.phone}` },

// In the render, change `<p className="text-sm font-medium text-slate-700">` to:
{href ? (
  <a href={href} className="text-sm font-medium text-indigo-600 hover:underline">{value}</a>
) : (
  <p className="text-sm font-medium text-slate-700">{value}</p>
)}
```

**3. Pipeline status buttons** — add visual connection arrows between steps using CSS:
```jsx
// Wrap the status buttons in a relative container and add overflow-x scroll:
<div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
  {LEAD_STATUSES.map((status, i) => (
    <React.Fragment key={status}>
      <button
        onClick={() => !['Converted'].includes(status) && handleStatusChange(status)}
        className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all
          ${lead.status === status
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
            : lead.status === 'Converted' ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer'
          }`}>
        {status}
      </button>
      {i < LEAD_STATUSES.length - 1 && (
        <span className="text-slate-300 flex-shrink-0 text-xs">›</span>
      )}
    </React.Fragment>
  ))}
</div>
```

**4. Activity timeline connector** — the timeline uses `<div className="w-px flex-1 bg-slate-100 mt-2" />`. This is inside a `flex-col` sub-div. The connector should have `min-h-4` to prevent it from collapsing on short content:
```jsx
{i < activities.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-2 min-h-4" />}
```

**5. Quick actions card** — add `transition-all` and `active:scale-95` to quick action buttons:
```jsx
className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition-all text-sm text-slate-600 text-left group"
// And on the icon:
<Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
```

---

### `src/pages/customers/CustomersPage.jsx` — SEARCH + TABLE

**1. Search input** — add `focus:border-transparent`:
```jsx
className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
```

**2. Total Revenue column** — wrap in a `font-semibold text-emerald-600` `<span>`. Already done — no change needed.

**3. Action buttons** — already have `hover:bg-slate-100` and `hover:bg-red-50`. Add `transition-colors` to both:
```jsx
className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
```

**4. PageHeader subtitle** — capitalize "total":
```jsx
subtitle={`${total} total customers`}
// No change needed — already correct.
```

---

### `src/pages/customers/CustomerDetailPage.jsx` — USE TABS COMPONENT

**1. Replace hand-rolled tab buttons with the `<Tabs>` component** (import it at top):
```jsx
import { Card, Button, Badge, StatusBadge, Avatar, formatCurrency, formatDate, timeAgo, ActivityIcon, ConfirmDialog, Skeleton, Tabs } from '../../components/ui';

// Replace the existing tab buttons block:
// FROM:
<div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-5 w-fit">
  {tabs.map(t => (
    <button key={t.key} onClick={() => setActiveTab(t.key)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
      {t.label}
    </button>
  ))}
</div>

// TO (use Tabs with variant="button"):
<div className="mb-5">
  <Tabs
    tabs={tabs.map(t => ({ value: t.key, label: t.label }))}
    activeTab={activeTab}
    onChange={setActiveTab}
    variant="button"
  />
</div>
```

**2. Stats row cards** — these use inline `bg-color rounded-2xl p-4` classes. Wrap with a consistent helper. The current markup is fine — just add `transition-all duration-200 hover:shadow-md` to each stat mini-card:
```jsx
<div key={s.label} className={`${s.bg} rounded-2xl p-4 transition-all duration-200 hover:shadow-md`}>
```

**3. Back button** — same fix as LeadDetailPage: remove `hover:bg-white` (redundant since `bg` is already white-via-border, there's no `bg-` set here), add `bg-white`:
```jsx
className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors"
```

---

### `src/pages/contacts/ContactsPage.jsx` — SEARCH + TABLE

**1. Search input** — add `focus:border-transparent` (same as CustomersPage).

**2. Table rows** — add `group` and `group-hover:text-indigo-600` on the name:
```jsx
<tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
  <td className="px-4 py-3">
    <div className="flex items-center gap-3">
      <Avatar name={`${c.firstName} ${c.lastName}`} size="sm" />
      <p className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">
        {c.firstName} {c.lastName}
      </p>
    </div>
  </td>
```

**3. Linked customer cell** — add `hover:underline` to the linked customer text:
```jsx
<td className="px-4 py-3 text-sm text-indigo-600 hover:underline cursor-pointer">
  {c.linkedCustomer?.name || '—'}
</td>
```

---

### `src/pages/deals/DealsPage.jsx` — USE STATCARD + KANBAN POLISH

**1. Replace 4 inline summary stat divs with `<StatCard>` component** (already imported as `Card`, need to add `StatCard` import):
```jsx
import {
  Card, Button, Badge, StatusBadge, Avatar, PageHeader, EmptyState, Modal,
  Input, Select, Textarea, formatCurrency, formatDate, ConfirmDialog, Skeleton, StatCard
} from '../../components/ui';

// Replace the summaryStats.map block:
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
  <StatCard title="Total Pipeline" value={formatCurrency(totalPipeline)} icon={TrendingUp} color="indigo" />
  <StatCard title="Weighted Pipeline" value={formatCurrency(weightedPipeline)} icon={DollarSign} color="blue" />
  <StatCard title="Won Revenue" value={formatCurrency(wonRevenue)} icon={TrendingUp} color="green" />
  <StatCard title="Conversion Rate" value={`${conversionRate}%`} icon={Handshake} color="purple" />
</div>
```
Note: `StatCard`'s `value` prop auto-calls `.toLocaleString()` when it's a number — since `formatCurrency()` returns a string, pass it directly.

**2. `DealCard`** — `cursor-default` should be `cursor-pointer` since clicks could navigate to a detail page in future; and the hover has `hover:shadow-md hover:border-indigo-200`. Add `duration-200`:
```jsx
className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 group"
```

**3. `KanbanColumn`** — the stage total value display uses `text-sm font-semibold text-slate-600 pl-4`. Change to `text-base font-bold text-slate-700 pl-4` for better readability.

**4. Probability progress bar** — add `title` attribute for accessibility:
```jsx
<div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden" title={`${deal.probability}% probability`}>
  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${deal.probability}%` }} />
</div>
```

---

### `src/pages/tasks/TasksPage.jsx` — FILTER BAR + LIST POLISH

**1. Filter bar** — add a search input (currently missing from tasks). Add to the filter card:
```jsx
// Add at the start of the flex row in the filter card:
<div className="relative flex-1 min-w-40">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
  <input
    type="text"
    placeholder="Search tasks..."
    value={filters.search || ''}
    onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
  />
</div>
```
Also add `search: ''` to the initial `filters` state and include it in the `loadData` call.
Also add `Search` to the lucide-react import.

**2. Task complete button in table** — add `aria-label`:
```jsx
<button onClick={() => handleComplete(task)}
  aria-label={task.status === 'Completed' ? 'Task completed' : 'Mark as complete'}
  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
    ${task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50'}`}>
```

**3. Overdue indicator** — change emoji `⚠️` to a lucide icon for consistency:
```jsx
import { Plus, CheckSquare, Edit3, Trash2, X, Search, AlertCircle } from 'lucide-react';

// In the overdue span:
<span className={`text-xs font-medium flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
  {isOverdue && <AlertCircle className="w-3 h-3" />}
  {formatDate(task.dueDate)}
</span>
```

**4. Kanban task cards** — already have `opacity-0 group-hover:opacity-100` on actions. Add `transition-opacity duration-150`.

---

### `src/pages/activities/ActivitiesPage.jsx` — FILTER CHIP SCROLL

**1. Filter chips container** — currently `flex flex-wrap gap-2`. With 13 type buttons this overflows on mobile. Add horizontal scroll option on small screens:
```jsx
// Change the filter card inner div from:
<div className="flex flex-wrap gap-2">
// To:
<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
  <div className="flex gap-2 flex-nowrap">  {/* inner non-wrapping row */}
    {/* all buttons */}
  </div>
</div>
```
This keeps a single line on mobile with horizontal scroll, and wraps on larger screens.

**2. Activity timeline items** — add `transition-colors` to the hover state of the outer div (even though it's not interactive, for future use):
Currently no click handler on timeline items. Add a subtle left border on hover for visual feedback:
```jsx
// No structural change needed — the current design is clean.
```

**3. Type filter "All" button** — add a count indicator showing total:
```jsx
<button onClick={() => setTypeFilter('')}
  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${!typeFilter ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
  All
  <span className={`text-[10px] px-1 rounded-full ${!typeFilter ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>{total}</span>
</button>
```

---

### `src/pages/followups/FollowUpsPage.jsx` — USE TABS COMPONENT

**1. Replace hand-rolled period tab selector with `<Tabs>` component:**
```jsx
// Add Tabs to imports:
import { ..., Tabs } from '../../components/ui';

// Replace the tabs block:
// FROM:
<div className="mb-4 flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
  {tabs.map(t => (
    <button key={t.value} ...>
      {t.icon && <t.icon className="w-3.5 h-3.5" />}
      {t.label}
    </button>
  ))}
</div>

// TO:
<div className="mb-4">
  <Tabs
    tabs={tabs}
    activeTab={period}
    onChange={setPeriod}
    variant="button"
  />
</div>
```

**2. Follow-up list items** — overdue items have `bg-red-50/30`. Add a left border accent for stronger visual signal:
```jsx
className={`px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors ${isOverdue ? 'bg-red-50/40 border-l-4 border-red-400 -ml-0 pl-4' : ''}`}
```
Note: `border-l-4 border-red-400` will shift content by 4px due to border. Use `border-l-[3px]` and adjust padding: `pl-[17px]`.

Actually simpler: Add a left colored border using an absolutely positioned pseudo-element via a wrapper div approach:
```jsx
<div key={fu._id} className={`relative px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors ${isOverdue ? 'bg-red-50/40' : ''}`}>
  {isOverdue && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-400 rounded-full" />}
  ...
</div>
```

**3. Done/Complete button** — add `active:scale-95` for tactile feedback:
```jsx
className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 active:scale-95 transition-all"
```

---

### `src/pages/quotations/QuotationsPage.jsx` — FORM + TABLE

**1. Table** — currently has no status filter or search. Add a simple search to the filter card before the table:
```jsx
// Add a filter card between PageHeader and the main Card:
<Card padding="p-4" className="mb-4">
  <div className="flex items-center gap-3">
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        placeholder="Search quotations..."
        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  </div>
</Card>
```
Add `Search` to the lucide-react import.

**2. Line items modal form** — the `bg-slate-50/50` item container works well. Add `hover:bg-slate-50` to line item rows:
```jsx
className="border border-slate-200 rounded-xl p-4 bg-white hover:bg-slate-50/50 transition-colors"
// was bg-slate-50/50, change to bg-white with hover for cleaner default
```

**3. Grand Total row** — increase visual weight:
```jsx
<div className="flex justify-end mt-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
  <div className="text-right">
    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Grand Total</p>
    <p className="text-2xl font-bold text-indigo-700 mt-0.5">{formatCurrency(getGrandTotal())}</p>
  </div>
</div>
```

**4. Table status column** — use `StatusBadge` instead of manual `Badge variant={statusColors[q.status]}`:
```jsx
// Change:
<Badge variant={statusColors[q.status] || 'default'}>{q.status}</Badge>
// To:
<StatusBadge status={q.status} />
```
`StatusBadge` already has `Draft`, `Sent`, `Accepted`, `Rejected`, `Expired` in its map.

---

### `src/pages/quotations/QuotationDetailPage.jsx` — PRINT STYLES + LAYOUT

**1. Add comprehensive print styles** — the current `print:shadow-none` is insufficient. Add:
```jsx
// On the outer wrapper div:
<div className="print:block">
  {/* Header — hide on print */}
  <div className="flex items-center justify-between mb-5 print:hidden">
    ...header buttons...
  </div>
  {/* The Card — remove max-width constraint on print */}
  <Card className="max-w-4xl mx-auto print:max-w-none print:shadow-none print:border-0">
```

**2. Action buttons in header** — add `transition-all` to all buttons:
```jsx
// All Button components already get this from the Button component.
// The back button needs it:
className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors"
```

**3. Items table** — the `<thead>` uses `bg-slate-50 rounded-xl` on the `<tr>` but table rows don't support border-radius. Fix:
```jsx
// Change:
<tr className="bg-slate-50 rounded-xl">
  <th className="px-4 py-3 ...">Description</th>
// To — apply radius on the cells instead:
<tr>
  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase bg-slate-50 first:rounded-tl-xl last:rounded-tr-xl">Description</th>
```
Or simpler: wrap the `<thead>` in a parent with `overflow-hidden rounded-xl` — but that's on `<table>`, not `<thead>`. Easiest fix: just remove `rounded-xl` from the `<tr>` (it has no visual effect on a `<tr>` anyway).

**4. Totals section** — add divider with more visual weight:
```jsx
<div className="border-t-2 border-indigo-100 pt-3 mt-2">
  <div className="flex justify-between">
    <span className="font-bold text-slate-800 text-base">Total</span>
    <span className="font-bold text-2xl text-indigo-600">{formatCurrency(quotation.total)}</span>
  </div>
</div>
```

---

### `src/pages/products/ProductsPage.jsx` — TABLE POLISH

**1. Product icon cell** — the `w-9 h-9 rounded-xl bg-indigo-50` icon div is good. Add `transition-colors group-hover:bg-indigo-100` for hover feedback:
```jsx
<tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
  <td className="px-4 py-3">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition-colors flex items-center justify-center flex-shrink-0">
        <Package className="w-4 h-4 text-indigo-500" />
      </div>
```

**2. Active badge** — `p.isActive ? 'Active' : 'Inactive'` already correct. No change.

**3. Search input** — add `focus:border-transparent`.

---

### `src/pages/calendar/CalendarPage.jsx` — MOBILE + LEGEND

**1. Calendar cells** — `min-h-24` (96px) collapses on small screens. Add a responsive minimum:
```jsx
className={`min-h-16 sm:min-h-24 p-1.5 sm:p-2 border-r border-b border-slate-100 transition-colors
  ${day ? 'cursor-pointer hover:bg-slate-50' : 'bg-slate-50/50'}
  ${isSelected ? 'bg-indigo-50' : ''}
`}
```

**2. Event pills in cells** — `text-[10px]` is very small. Increase to `text-xs` and truncate properly:
```jsx
<div key={ev.id} className={`text-[11px] font-medium text-white px-1.5 py-0.5 rounded-md truncate ${ev.color}`}>
  {ev.label} {ev.title}
</div>
```

**3. Today button** — already styled `bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100`. Add `transition-colors`.

**4. Day number circle** — when `isToday`, uses `bg-indigo-600 text-white`. Add a subtle ring:
```jsx
className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1
  ${isToday ? 'bg-indigo-600 text-white ring-2 ring-indigo-300' : 'text-slate-600 hover:bg-slate-100'}`}
```

**5. Event sidebar detail** — add `capitalize` to event type:
```jsx
<p className="text-xs text-slate-400 capitalize">
  {ev.type} • <span ...>{ev.status}</span>
</p>
```

---

### `src/pages/reports/ReportsPage.jsx` — USE STATCARD

**1. Replace 4 inline summary card divs with `<StatCard>`:**
```jsx
// Add StatCard to imports:
import { Card, PageHeader, Skeleton, formatCurrency, StatCard } from '../../components/ui';

// Replace the summary cards grid:
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <StatCard title="Total Revenue" value={loading ? '...' : formatCurrency(summary.totalRevenue)} icon={DollarSign} color="green" />
  <StatCard title="New Leads" value={loading ? '...' : (summary.newLeads || 0)} icon={Target} color="indigo" />
  <StatCard title="New Customers" value={loading ? '...' : (summary.newCustomers || 0)} icon={Users} color="blue" />
  <StatCard title="Won Deals" value={loading ? '...' : (summary.wonDeals || 0)} icon={TrendingUp} color="purple" />
</div>
```

**2. Chart cards** — add consistent section label style (same as Dashboard suggestion: `border-l-[3px] border-indigo-500 pl-3`):
```jsx
// In each chart Card header:
<div className="border-l-[3px] border-indigo-500 pl-3 mb-4">
  <h3 className="font-semibold text-slate-800">Revenue Trend</h3>
  <p className="text-xs text-slate-400">Won deal revenue over time</p>
</div>
```

---

### `src/pages/settings/SettingsPage.jsx` — USE TABS + SIDEBAR POLISH

**1. Sidebar nav** — currently uses hand-rolled `bg-indigo-600 text-white` active buttons. Refactor to use `<Tabs>` with `variant="sidebar"` (vertical layout). However, `Tabs` is horizontal by default. Instead, use the existing `nav-item` CSS class from `index.css` which is already styled perfectly for this use case:

Actually `nav-item` is styled for the dark sidebar. For the light settings sidebar, keep the existing Tailwind classes but extract the repetition into a local constant:

```jsx
// Replace the nav buttons with a cleaner pattern:
{TABS.filter(t => t.key !== 'company' || isAdmin()).map(t => {
  const Icon = t.icon;
  const isActive = activeTab === t.key;
  return (
    <button key={t.key}
      onClick={() => navigate(`/settings/${t.key}`)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
        ${isActive
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
        }`}>
      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
      {t.label}
    </button>
  );
})}
```
Change `hover:bg-slate-50` → `hover:bg-slate-100` for more visible hover feedback.

**2. Password strength indicator** — the 4 progress segments use magic numbers `[6, 8, 10, 12]`. Add labels:
```jsx
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <p className="text-xs font-medium text-slate-500">Password strength</p>
    <p className={`text-xs font-semibold ${
      passwordForm.newPassword.length >= 12 ? 'text-emerald-600' :
      passwordForm.newPassword.length >= 10 ? 'text-emerald-500' :
      passwordForm.newPassword.length >= 8 ? 'text-amber-500' : 'text-red-500'
    }`}>
      {passwordForm.newPassword.length >= 12 ? 'Strong' :
       passwordForm.newPassword.length >= 10 ? 'Good' :
       passwordForm.newPassword.length >= 8 ? 'Fair' : 'Weak'}
    </p>
  </div>
  <div className="flex gap-1">
    ...existing segments...
  </div>
</div>
```

**3. Notification toggles** — these use raw HTML toggle markup. Add `aria-label` to each:
```jsx
<input
  type="checkbox"
  defaultChecked
  aria-label={`Toggle ${item.label} notification`}
  className="sr-only peer"
/>
```

**4. Profile avatar section** — add an "Upload photo" placeholder button (visual only, no functionality):
```jsx
<div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
  <div className="relative">
    <Avatar name={`${user?.firstName} ${user?.lastName}`} size="lg" />
    <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors"
      title="Upload photo (coming soon)" aria-label="Upload profile photo">
      <span className="text-white text-[10px]">✎</span>
    </button>
  </div>
  ...
</div>
```

---

### `src/pages/users/UsersPage.jsx` — TABLE POLISH + INVITE LABEL

**1. Invite button label** — "Invite User" is good but the modal title says "Invite Team Member". Align:
```jsx
actions={<Button onClick={() => setShowModal(true)} icon={Plus}>Invite Member</Button>}
```

**2. Online/offline indicator dot** — currently `w-3 h-3`. Make it slightly larger `w-3.5 h-3.5` and add `ring-1 ring-white` to ensure visibility on any avatar color:
```jsx
<div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-1 ring-white ${u.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
```

**3. Toggle button** — add a tooltip on hover showing the action:
```jsx
<button onClick={() => handleToggle(u)}
  title={u.isActive ? 'Deactivate user' : 'Activate user'}
  className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'hover:bg-amber-50 text-amber-500 hover:text-amber-600' : 'hover:bg-emerald-50 text-emerald-500 hover:text-emerald-600'}`}>
```

**4. Role badge** — `Badge` for `super_admin` and `admin` both use `variant="primary"` (indigo). Differentiate:
```jsx
const roleColors = {
  super_admin: 'purple',   // was 'primary'
  admin: 'primary',
  sales_manager: 'info',
  sales_rep: 'success',
  support_agent: 'warning',
  viewer: 'default'
};
```
The `Badge` component supports `purple` — confirmed.

---

## 3. Design System Tokens to Add/Update in `index.css`

Add to `@theme` block:
```css
/* Radius scale */
--radius-sm:   8px;
--radius-md:   10px;
--radius-lg:   12px;
--radius-xl:   16px;
--radius-2xl:  20px;

/* Elevation tokens */
--shadow-card:       0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
--shadow-card-hover: 0 6px 20px rgba(0,0,0,0.08);
--shadow-dropdown:   0 10px 40px rgba(0,0,0,0.12);
--shadow-modal:      0 20px 60px rgba(0,0,0,0.18);

/* Transition speed tokens */
--transition-fast:   150ms ease;
--transition-normal: 200ms ease;
--transition-slow:   300ms ease;

/* Surface tint colors for kanban/cards */
--color-surface-tint-indigo: rgba(99,102,241,0.06);
--color-surface-tint-emerald: rgba(16,185,129,0.06);
--color-surface-tint-amber: rgba(245,158,11,0.06);
--color-surface-tint-red: rgba(239,68,68,0.06);
```

Update `.card` class:
```css
.card {
  background: #fff;
  border-radius: var(--radius-xl);
  border: 1px solid #E2E8F0;
  box-shadow: var(--shadow-card);
  transition: box-shadow var(--transition-normal), transform var(--transition-normal);
}
```

Update `.btn` class to add `active:scale-95`:
```css
.btn {
  /* existing styles */
  active-scale: 95%;  /* note: Tailwind handles this better via class */
}
```
Actually, add via CSS:
```css
.btn:active { transform: scale(0.97); }
.btn-primary:active { transform: scale(0.97); }
```

Add `scrollbar-thin` utility (used in ActivitiesPage filter chips):
```css
.scrollbar-thin::-webkit-scrollbar { width: 3px; height: 3px; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
```

---

## 4. Shared UI Component Improvements Summary

All changes are in `src/components/ui/index.jsx`:

| Component | Change |
|---|---|
| `Button` | `xs` size uses `rounded-lg` not `rounded-xl`. Separate radius from base className. |
| `Modal` | Close button gets `hover:bg-slate-100` and `focus-visible:ring-2`. |
| `EmptyState` | Icon `w-9 h-9 text-slate-400` (was `w-8 h-8 text-slate-300`). |
| `Pagination` | Smart window (page ± 2) instead of always pages 1–5. |
| `PageHeader` | Add `spacing` prop (default `'mb-6'`) for per-page control. |
| `Tabs` | Add `variant` prop: `'pill'` (white active) and `'button'` (indigo active). |
| `ScoreBadge` | Add colored dot indicator before number. |
| `Card` | Change border from `border-slate-100` to `border-slate-200` for visibility. |

---

## 5. Edit Order (dependencies first)

```
Step 1:  src/App.css                               Clear scaffold dead code
Step 2:  src/index.css                             Add tokens, print rule, scrollbar util
Step 3:  src/components/ui/index.jsx               All shared component improvements
Step 4:  src/components/layout/Layout.jsx          page-canvas activation
Step 5:  src/components/layout/Sidebar.jsx         icon size, merged header section
Step 6:  src/components/layout/Topbar.jsx          badge size, unused import removal
Step 7:  src/pages/auth/LoginPage.jsx
Step 8:  src/pages/auth/RegisterPage.jsx
Step 9:  src/pages/auth/ForgotPasswordPage.jsx
Step 10: src/pages/DashboardPage.jsx
Step 11: src/pages/leads/LeadsPage.jsx
Step 12: src/pages/leads/LeadDetailPage.jsx
Step 13: src/pages/customers/CustomersPage.jsx
Step 14: src/pages/customers/CustomerDetailPage.jsx
Step 15: src/pages/contacts/ContactsPage.jsx
Step 16: src/pages/deals/DealsPage.jsx
Step 17: src/pages/tasks/TasksPage.jsx
Step 18: src/pages/activities/ActivitiesPage.jsx
Step 19: src/pages/followups/FollowUpsPage.jsx
Step 20: src/pages/quotations/QuotationsPage.jsx
Step 21: src/pages/quotations/QuotationDetailPage.jsx
Step 22: src/pages/products/ProductsPage.jsx
Step 23: src/pages/calendar/CalendarPage.jsx
Step 24: src/pages/reports/ReportsPage.jsx
Step 25: src/pages/settings/SettingsPage.jsx
Step 26: src/pages/users/UsersPage.jsx
```

Steps 1–6 are hard dependencies: later pages import from `ui/index.jsx` and rely on the Layout wrapper. Within steps 7–26, pages are independent of each other and can be edited in any order.

---

## 6. Build Verification Steps

After completing all changes, verify in this order:

### Step A — Lint check
```powershell
cd "d:\Crefto CRM\frontend"
npm run lint
```
Expected: zero errors. If `oxlint` reports any `no-unused-vars` on removed imports (e.g., `TrendingUp` in Topbar), fix them.

### Step B — Build (type check + bundle)
```powershell
cd "d:\Crefto CRM\frontend"
npm run build
```
Expected: build completes without errors. Vite will report bundle size; total JS should stay under ~2MB (current estimate ~1.4MB unminified).

### Step C — Dev server visual check
```powershell
cd "d:\Crefto CRM\frontend"
npm run dev
```
Navigate to each of these routes and confirm visually:
1. `/login` — background blobs, form, demo buttons, error state (try wrong password)
2. `/register` — Last Name field now has icon padding, consistent with First Name
3. `/` (Dashboard) — greeting changes based on time of day; stat cards render; charts load
4. `/leads` — table view; kanban view; filter bar; bulk selection highlights in indigo
5. `/leads/:id` — pipeline steps with `›` separators; email/phone are `<a>` tags; quick actions hover shows indigo
6. `/customers` — table rows hover; action button transitions
7. `/customers/:id` — `Tabs` component renders (not hand-rolled buttons)
8. `/deals` — `StatCard` used for summary; kanban card hover shadow
9. `/tasks` — search input present in filter bar; overdue icon uses `AlertCircle`
10. `/activities` — filter chips scroll horizontally on mobile; "All" shows total count
11. `/follow-ups` — `Tabs` component used; overdue rows have left red border accent
12. `/quotations` — `StatusBadge` used in table; grand total has indigo bg
13. `/quotations/:id` — `print:hidden` on header; items table `<thead>` has no broken border-radius on `<tr>`
14. `/products` — icon cell shows `group-hover:bg-indigo-100`
15. `/calendar` — mobile cells use `min-h-16`; today has ring; event pills slightly larger text
16. `/reports` — `StatCard` components rendered
17. `/settings` — sidebar hover uses `hover:bg-slate-100`; password strength shows label
18. `/users` — `purple` badge for super_admin; toggle buttons have title tooltips

### Step D — Print test
Open `/quotations/:id`, press `Ctrl+P`. Confirm:
- Sidebar and topbar are hidden in print preview
- Quotation card expands to full width
- No shadow or border artifacts

### Step E — Accessibility spot check
Tab through the Login form. Confirm:
- Each input shows a visible focus ring (indigo outline from `:focus-visible` rule in `index.css`)
- The password toggle button is reachable by keyboard
- The submit button shows focus state

---

## Notes & Assumptions

1. **No new dependencies are introduced.** All changes use existing Tailwind classes, existing lucide-react icons, and existing component patterns.

2. **`border-l-[3px]`** — used in dashboard chart headers and follow-up overdue indicator. This is a Tailwind v4 arbitrary value that requires the square-bracket syntax. Confirmed Tailwind v4 is installed.

3. **`Tabs` variant="button"** — the `CustomerDetailPage` and `FollowUpsPage` currently use `bg-indigo-600 text-white` for active. The new `variant="button"` on `Tabs` produces this exact style. Test both pages after changing.

4. **`StatCard` with string values** — `StatCard` does `typeof value === 'number' ? value.toLocaleString() : value`. When passing `formatCurrency(...)` results (strings), it passes them through unchanged. Correct behavior.

5. **`App.css`** — completely clearing it is safe. Vite will still process the import in `main.jsx` (or wherever it's imported); an empty/comment-only CSS file produces no output.

6. **Print CSS** — the `@media print` selector targets `aside` and `header[class*="h-16"]` which matches the Topbar's `h-16` class. This is fragile but functional since we're not adding a dedicated class. Alternatively, add `className="... no-print"` to `<Sidebar>` and `<Topbar>` in `Layout.jsx` and target `.no-print` in the print rule.

7. **`w-[18px] h-[18px]`** for icons — this matches `w-4.5` (18px) exactly but uses the explicit pixel form which is more readable and avoids the unusual `.5` Tailwind step.
