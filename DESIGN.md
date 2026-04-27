# DESIGN.md

# Product Design System

This file defines the visual style for the scheduler UI. It is inspired by Cal.com’s current public website, but it is not a clone. The goal is a calm, monochrome, medical-grade scheduling interface: precise, quiet, trustworthy, and easy to scan.

The product is a weekly appointment scheduler. The interface must make three things visually obvious:

1. Available slots
2. Booked appointments
3. Time structure across a week

Do not design this like a colorful SaaS dashboard. Do not add decorative illustrations, gradients, noisy icons, or saturated brand colors. The UI should feel restrained, clinical, premium, and operational.

---

## 1. Design Principles

### 1.1 Monochrome First

Use grayscale as the main visual language.

Color is not the brand. Contrast, spacing, typography, and hierarchy are the brand.

Allowed color usage:
- Black and near-black for primary text and actions
- White and off-white for backgrounds
- Gray for borders, secondary text, dividers, disabled states
- One restrained blue only for focus, active selection, or links
- One restrained green only for confirmed/available success states
- One restrained red only for destructive or error states

Forbidden:
- Decorative gradients
- Purple/pink/blue marketing accents
- Multi-color feature cards
- Colored shadows
- Glassmorphism
- Neon effects
- Illustration-heavy layouts

### 1.2 Product UI Is the Visual Content

The calendar, booking cards, availability slots, appointment cards, and scheduling controls are the main visual elements.

Do not fill empty space with abstract graphics. Use real product structure:
- Week grid
- Time axis
- Day columns
- Availability slot cards
- Appointment cards
- Doctor/assignee labels
- Booking status
- Empty states
- Small operational controls

### 1.3 Calm Medical Utility

The scheduler may be used in medical contexts. The UI must feel:
- Trustworthy
- Low-noise
- Easy to scan
- Precise
- Accessible
- Non-playful

Avoid:
- Cute language
- Over-rounded toy-like components
- Large emoji-like icons
- Celebration animations
- Decorative motion

### 1.4 Dense Information, Spacious Frame

The page frame should breathe. The scheduling grid itself can be dense.

Use generous spacing for:
- Page sections
- Header
- Main layout gutters
- Cards
- Empty states

Use tighter spacing for:
- Time labels
- Slot rows
- Appointment metadata
- Calendar controls

---

## 2. Color Tokens

Use these tokens. Do not invent new colors unless required by accessibility.

```css
:root {
  --color-bg: #ffffff;
  --color-bg-subtle: #f8f8f8;
  --color-bg-muted: #f5f5f5;
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;

  --color-text: #242424;
  --color-text-strong: #111111;
  --color-text-muted: #6f6f6f;
  --color-text-subtle: #898989;
  --color-text-disabled: #b5b5b5;
  --color-text-inverse: #ffffff;

  --color-border: rgba(34, 42, 53, 0.10);
  --color-border-subtle: rgba(34, 42, 53, 0.06);
  --color-border-strong: rgba(17, 17, 17, 0.18);

  --color-action: #242424;
  --color-action-hover: #111111;
  --color-action-muted: #f5f5f5;

  --color-link: #006adc;
  --color-focus: rgba(59, 130, 246, 0.50);

  --color-success: #0f766e;
  --color-success-bg: #f0fdfa;
  --color-success-border: #99f6e4;

  --color-warning: #92400e;
  --color-warning-bg: #fffbeb;
  --color-warning-border: #fde68a;

  --color-danger: #b91c1c;
  --color-danger-bg: #fef2f2;
  --color-danger-border: #fecaca;
}
```

### Color Rules

Primary text:
- Use `--color-text` for most text.
- Use `--color-text-strong` for high-emphasis headings and active states.
- Use `--color-text-muted` or `--color-text-subtle` for metadata.

Backgrounds:
- Page background: `--color-bg`
- Secondary panels: `--color-bg-subtle`
- Calendar grid background: `--color-surface`
- Empty sections: `--color-bg-muted`

Borders:
- Prefer shadow-ring borders for raised cards.
- Use real borders for calendar grid lines and input controls.

Status:
- Available slots should be quiet, not bright.
- Booked appointments should be stronger than available slots.
- Destructive actions must use danger tokens.

---

## 3. Typography

### 3.1 Font Stack

Use this stack:

```css
--font-display: "Cal Sans", "Inter", system-ui, sans-serif;
--font-sans: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "Roboto Mono", "SFMono-Regular", Consolas, monospace;
```

If Cal Sans is unavailable, use Inter. Do not block implementation on Cal Sans.

### 3.2 Font Usage

Display/headings:
- Use `Cal Sans` only for large headings and major section titles.
- Use weight 600.
- Use tight line height.
- Do not use it for long body text.

Body/UI:
- Use `Inter` for all product UI, controls, forms, calendar labels, metadata, and body copy.
- Use weight 400–600.
- Use clear size hierarchy.

Code/technical:
- Use mono font only for IDs, debug panels, or developer-facing output.

### 3.3 Type Scale

```css
--text-xs: 12px;
--text-sm: 14px;
--text-md: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 32px;
--text-4xl: 40px;
--text-5xl: 48px;
--text-6xl: 64px;
```

### 3.4 Typography Roles

| Role | Font | Size | Weight | Line Height | Usage |
|---|---:|---:|---:|---:|---|
| Hero Title | Cal Sans | 56–64px | 600 | 1.05–1.10 | Landing page / major intro |
| Page Title | Cal Sans | 40–48px | 600 | 1.10 | Main page heading |
| Section Title | Cal Sans | 32–40px | 600 | 1.15 | Section headings |
| Panel Title | Inter | 18–20px | 600 | 1.25 | Calendar panels/cards |
| Card Title | Inter | 14–16px | 600 | 1.25 | Slot/appointment titles |
| Body | Inter | 14–16px | 400 | 1.5 | Explanatory text |
| Metadata | Inter | 12–14px | 400–500 | 1.3 | Time, duration, assignee |
| Button | Inter | 14px | 500–600 | 1 | Controls |
| Calendar Time | Inter | 12px | 500 | 1 | Time axis |
| Calendar Day | Inter | 13–14px | 600 | 1.2 | Day headers |

### 3.5 Typography Rules

Do:
- Keep UI text compact and legible.
- Use sentence case.
- Use tabular numbers for time values.

```css
font-variant-numeric: tabular-nums;
```

Do not:
- Use uppercase everywhere.
- Use thin font weights below 400 in product UI.
- Use Cal Sans inside dense calendar cells.
- Center-align dense product data.

---

## 4. Spacing Tokens

Use an 8px base scale with smaller precision steps.

```css
--space-0: 0;
--space-0-5: 2px;
--space-1: 4px;
--space-1-5: 6px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### Spacing Rules

Page:
- Desktop page horizontal padding: 32–48px
- Mobile page horizontal padding: 16px
- Section vertical padding: 64–96px

Panels:
- Large panel padding: 24px
- Standard card padding: 16px
- Compact card padding: 8–12px

Calendar:
- Day header height: 48–64px
- Time axis width: 56–72px
- Grid cell minimum height: 48px
- Slot/appointment internal padding: 8–12px
- Gap between overlapping cards: 4px

---

## 5. Radius Tokens

```css
--radius-xs: 2px;
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-2xl: 16px;
--radius-full: 9999px;
```

### Radius Usage

| Token | Usage |
|---|---|
| `xs` | Hairline UI, tiny badges |
| `sm` | Calendar grid chips, compact controls |
| `md` | Buttons, inputs |
| `lg` | Standard cards |
| `xl` | Panels, popovers |
| `2xl` | Large page containers |
| `full` | Pills, avatars, status badges |

Do not over-round the calendar grid. Medical scheduling should feel precise, not bubbly.

---

## 6. Shadow and Elevation

Use subtle shadows only. Avoid dramatic elevation.

```css
--shadow-ring: 0 0 0 1px rgba(34, 42, 53, 0.08);

--shadow-sm:
  0 1px 2px rgba(17, 17, 17, 0.04),
  0 0 0 1px rgba(34, 42, 53, 0.08);

--shadow-md:
  0 1px 5px -4px rgba(19, 19, 22, 0.70),
  0 0 0 1px rgba(34, 42, 53, 0.08),
  0 4px 8px rgba(34, 42, 53, 0.05);

--shadow-lg:
  0 1px 5px -4px rgba(19, 19, 22, 0.70),
  0 0 0 1px rgba(34, 42, 53, 0.10),
  0 12px 24px rgba(34, 42, 53, 0.08);

--shadow-inset:
  inset 0 1px 1.5px rgba(0, 0, 0, 0.12);

--shadow-button-inset:
  inset 0 1px 0 rgba(255, 255, 255, 0.15);
```

### Elevation Rules

| Level | Token | Usage |
|---|---|---|
| 0 | none | Page background, calendar grid |
| 1 | `--shadow-ring` | Static cards, toolbar groups |
| 2 | `--shadow-sm` | Buttons, inputs, slot cards |
| 3 | `--shadow-md` | Floating panels, popovers, appointment cards |
| 4 | `--shadow-lg` | Dialogs, command menus |

Do:
- Use ring shadows for raised surfaces.
- Use real borders for grid lines.
- Keep shadows neutral and low-opacity.

Do not:
- Use colorful shadows.
- Use heavy blur shadows.
- Use elevation to compensate for poor spacing.

---

## 7. Layout System

### 7.1 Containers

```css
--container-sm: 720px;
--container-md: 960px;
--container-lg: 1200px;
--container-xl: 1440px;
```

Default page container:
- `max-width: 1200px`
- centered
- horizontal padding 16–48px depending on viewport

Scheduler workspace:
- May use `max-width: 1440px`
- Should prioritize usable grid width over marketing-style narrow columns

### 7.2 Breakpoints

```css
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1200px;
--bp-2xl: 1440px;
```

Responsive behavior:
- `<640px`: single column, simplified scheduler, horizontal day scrolling allowed
- `640–1024px`: compressed week view, optional split between agenda/list and grid
- `>1024px`: full weekly grid
- `>1200px`: full toolbar + side panels allowed

---

## 8. Core Components

## 8.1 App Shell

The app shell should be minimal.

Structure:
- Top navigation
- Main content area
- Optional side panel
- Optional footer only on marketing/static pages

Top nav:
- Height: 56–64px
- Background: white or slightly translucent white
- Border bottom: `1px solid var(--color-border-subtle)`
- Left: product mark/name
- Center: navigation links if needed
- Right: account/actions

Nav text:
- Inter 14px
- Weight 500
- Color `--color-text`

Primary nav CTA:
- Dark background
- White text
- 8px radius
- Compact padding

Do not use oversized nav elements.

---

## 8.2 Buttons

### Primary Button

```css
.button-primary {
  background: var(--color-action);
  color: var(--color-text-inverse);
  border-radius: var(--radius-md);
  padding: 0 14px;
  height: 36px;
  font: 500 14px/1 var(--font-sans);
  box-shadow: var(--shadow-button-inset);
}
```

Hover:
- Background `--color-action-hover`

Disabled:
- Background `#e5e5e5`
- Text `--color-text-disabled`
- Cursor default

### Secondary Button

White background, dark text, ring shadow.

```css
.button-secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: var(--radius-md);
  height: 36px;
  padding: 0 14px;
  box-shadow: var(--shadow-sm);
}
```

### Ghost Button

No background by default.

Use for:
- Calendar navigation arrows
- Toolbar utility actions
- Secondary row controls

Hover:
- `background: var(--color-bg-muted)`

### Destructive Button

Use only for delete/cancel actions.

```css
background: var(--color-danger);
color: white;
```

---

## 8.3 Inputs and Selects

Inputs must be quiet and precise.

```css
.input {
  height: 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  padding: 0 12px;
  font: 400 14px/1 var(--font-sans);
}
```

Focus:
```css
outline: 2px solid var(--color-focus);
outline-offset: 2px;
```

Do not remove focus outlines.

Labels:
- Inter 13px
- Weight 500
- Color `--color-text`

Help text:
- Inter 12px
- Color `--color-text-subtle`

Errors:
- Red text
- Red border
- Optional subtle red background

---

## 8.4 Cards

### Standard Card

```css
.card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-4);
}
```

Use for:
- Appointment details
- Booking preview
- Settings groups
- Empty-state panels

### Flat Card

```css
.card-flat {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
```

Use inside dense layouts where shadow would create visual clutter.

---

## 9. Scheduler-Specific UI

## 9.1 Weekly Calendar Grid

The weekly grid is the core product surface.

Structure:
- Left time axis
- Seven day columns
- Sticky day header
- Horizontal grid lines
- Vertical day dividers
- Slot and appointment overlays

Calendar background:
- White

Grid lines:
```css
border-color: rgba(17, 17, 17, 0.06);
```

Time labels:
- Inter 12px
- Weight 500
- Color `--color-text-subtle`
- Tabular numbers
- Right aligned

Day headers:
- Inter 13–14px
- Weight 600
- Color `--color-text`
- Today may use stronger text or subtle ring
- Do not use bright colored day headers

Current day:
- Subtle background tint `#fafafa`
- Optional dark pill for date number

Current time indicator:
- 1px line
- `--color-text-strong`
- Small dot at start
- Do not use bright red by default

---

## 9.2 Available Slot Card

Available slots represent bookable supply. They should be visible but quieter than appointments.

Visual style:
```css
.slot-available {
  background: #ffffff;
  border: 1px solid rgba(15, 118, 110, 0.24);
  border-radius: var(--radius-md);
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
}
```

Content:
- Time range
- Assignee/doctor name if relevant
- Optional duration
- Optional “Available” label

Typography:
- Time: 13px, weight 600
- Metadata: 12px, muted

Hover:
- Slightly stronger border
- Background `#fdfdfd`
- Cursor pointer

Do not make available slots green blocks. Use restrained green only as a border or tiny badge.

---

## 9.3 Booked Appointment Card

Booked appointments should be more visually dominant than available slots.

Visual style:
```css
.appointment-card {
  background: #242424;
  color: #ffffff;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
```

Alternative light style for dense mode:
```css
.appointment-card-light {
  background: #f5f5f5;
  border: 1px solid var(--color-border);
  color: var(--color-text);
}
```

Content:
- Appointment title
- Time range
- Invitee/patient name if available
- Host/doctor
- Status if needed

Typography:
- Title: 13–14px, weight 600
- Time: 12px, weight 500, tabular numbers
- Metadata: 12px

Rules:
- Booked appointment must never look like an available slot.
- Appointment host should be visually secondary to appointment title.
- Avoid excessive icons inside appointment cards.

---

## 9.4 Cancelled Slot

Cancelled slots should usually be hidden from the main availability view.

If shown in admin/debug views:
```css
.cancelled-slot {
  background: var(--color-bg-muted);
  color: var(--color-text-disabled);
  border: 1px dashed var(--color-border);
}
```

Use strikethrough only if it improves scan clarity. Do not use aggressive red for cancelled historical data.

---

## 9.5 Empty State

Empty states should be calm and useful.

Structure:
- Small icon or no icon
- Clear title
- One-line explanation
- Optional action button

Example:
- “No available slots”
- “Create a slot for this week to start accepting appointments.”

Visual:
- White or subtle gray panel
- 12–16px radius
- Ring border
- No illustration

---

## 9.6 Toolbar

The scheduler toolbar should support:
- Previous week
- Next week
- Jump to date
- Today
- Optional assignee filter
- Optional view switch

Layout:
- Left: date range title
- Center/right: controls
- Mobile: stacked or horizontally scrollable

Date range title:
- Inter or Cal Sans depending on page density
- Prefer Inter 18–20px weight 600 inside the app
- Use Cal Sans only for marketing-style headers

Controls:
- 36px height
- 6–8px radius
- compact spacing
- no colorful icons

---

## 9.7 Assignee / Doctor Identity

Assignee identity is important but should not dominate the calendar.

Use:
- Small avatar or initials
- Doctor name
- Specialty only where useful
- Muted metadata

Avatar:
```css
.avatar {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--color-bg-muted);
  color: var(--color-text);
  font: 600 12px/1 var(--font-sans);
}
```

Do not assign random bright colors to doctors by default. If color-coding is necessary later, use a muted palette and document it separately.

---

## 10. Marketing / Landing Page Style

If building a landing page around the scheduler, follow the Cal.com-inspired structure:

1. Minimal top nav
2. Strong centered hero
3. Primary and secondary CTA
4. Product screenshot or live scheduler preview
5. Trust row
6. “How it works” section
7. Feature sections using real UI fragments
8. Testimonials only if real
9. Integrations/app section if relevant
10. Footer

Hero:
- White background
- Large Cal Sans heading
- Short body text
- Dark primary CTA
- White secondary CTA
- Product UI preview below

Hero title:
```css
font-family: var(--font-display);
font-size: clamp(40px, 6vw, 64px);
line-height: 1.05;
font-weight: 600;
letter-spacing: -0.02em;
color: var(--color-text);
```

Hero body:
```css
font-family: var(--font-sans);
font-size: 16–18px;
line-height: 1.5;
color: var(--color-text-muted);
max-width: 640px;
```

Do not over-explain. Use the product preview to carry the page.

---

## 11. Motion

Motion must be subtle and functional.

Allowed:
- 120–180ms hover transitions
- 150–220ms popover/dialog entry
- Small opacity and translate transitions
- Calendar navigation fade/slide if restrained

CSS:
```css
--duration-fast: 120ms;
--duration-base: 180ms;
--duration-slow: 220ms;
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
```

Do not:
- Bounce
- Overshoot
- Use springy playful motion
- Animate large calendar layout changes aggressively

---

## 12. Accessibility

Minimum requirements:
- Visible keyboard focus
- 44px minimum touch target on mobile
- Sufficient contrast for all text
- Do not encode state by color alone
- Use labels for inputs
- Use semantic buttons
- Preserve tab order
- Provide accessible names for icon buttons
- Calendar cells must be keyboard reachable if interactive

Focus style:
```css
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

Text contrast:
- Primary text on white must be near-black.
- Muted text must not fall below readable contrast for important information.
- Disabled text can be lower contrast only when non-essential.

---

## 13. Implementation Rules for Codex

When generating UI code:

1. Use the tokens in this file before inventing values.
2. Prefer CSS variables or Tailwind theme tokens.
3. Keep components small and composable.
4. Use Inter for product UI.
5. Use Cal Sans only for major headings.
6. Calendar grid lines should be real borders.
7. Raised cards should use shadow-ring elevation.
8. Keep the interface monochrome unless state requires color.
9. Available slots and booked appointments must be visually distinct.
10. Do not add decorative graphics unless explicitly requested.
11. Do not use gradients.
12. Do not use random accent colors.
13. Do not remove focus outlines.
14. Do not hardcode pixel positions from layout data if the domain core provides semantic layout.
15. Keep scheduler UI deterministic and data-driven.

---

## 14. Tailwind Mapping

If using Tailwind, map the design system like this:

```ts
theme: {
  extend: {
    fontFamily: {
      display: ["Cal Sans", "Inter", "system-ui", "sans-serif"],
      sans: ["Inter", "system-ui", "sans-serif"],
      mono: ["Roboto Mono", "monospace"],
    },
    colors: {
      bg: "var(--color-bg)",
      surface: "var(--color-surface)",
      text: "var(--color-text)",
      muted: "var(--color-text-muted)",
      border: "var(--color-border)",
      action: "var(--color-action)",
      danger: "var(--color-danger)",
      success: "var(--color-success)",
    },
    borderRadius: {
      xs: "var(--radius-xs)",
      sm: "var(--radius-sm)",
      md: "var(--radius-md)",
      lg: "var(--radius-lg)",
      xl: "var(--radius-xl)",
      "2xl": "var(--radius-2xl)",
      full: "var(--radius-full)",
    },
    boxShadow: {
      ring: "var(--shadow-ring)",
      sm: "var(--shadow-sm)",
      md: "var(--shadow-md)",
      lg: "var(--shadow-lg)",
    },
  },
}
```

---

## 15. Component Acceptance Checklist

A generated screen is acceptable only if:

- The page is mostly monochrome.
- The hierarchy is clear without color decoration.
- Available slots are visually quieter than booked appointments.
- Booked appointments are immediately distinguishable.
- Time labels use tabular numbers.
- Calendar grid lines are subtle.
- Controls have visible hover and focus states.
- Buttons are compact and not oversized.
- The main scheduler is usable on desktop and mobile.
- The UI does not look like a generic colorful admin dashboard.
- The UI does not look like a toy calendar.
- The design feels precise, calm, and professional.

---

## 16. Anti-Patterns

Reject generated UI if it contains:

- Gradient backgrounds
- Purple/blue SaaS hero blobs
- Random colorful cards
- Heavy drop shadows
- Glassmorphism
- Excessive icons
- Emoji
- Rounded “bubble” calendar events
- Full-color doctor labels without reason
- Weak contrast text
- Hidden focus styles
- Decorative illustrations
- Body text set in Cal Sans
- Calendar cells without clear time structure
- Available and booked states that look similar

---

## 17. Reference Mood

The intended feeling:

- Cal.com restraint
- Linear-like precision
- Apple-like spacing discipline
- Medical SaaS trustworthiness
- Scheduling-product clarity

The interface should feel like infrastructure, not marketing decoration.
