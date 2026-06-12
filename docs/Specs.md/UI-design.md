# Todo App UI Design

## Overview

The todo app features a **5-view navigation model** with a persistent left sidebar. All views are accessed via icon-based navigation for clean, minimal UX. This document specifies the layout, interactions, and visual hierarchy for each view.

---

## Navigation Sidebar

### Layout
- **Position**: Fixed left edge of the screen
- **Width**: ~80px (icon-sized)
- **Height**: Full viewport height
- **Background**: Dark neutral (e.g., #2a2a2a)

### Icons & Views
1. **Daily List** (calendar icon) — Primary view, shows today's tasks
2. **Calendar** (month/grid icon) — Monthly calendar view with appointments
3. **Lists** (list icon) — Standalone lists menu
4. **Search** (magnifying glass icon) — Search and filter items across all dates
5. **Records** (history/archive icon) — Past daily lists archive

### Interaction
- Icons are vertically stacked, centered
- Active icon is highlighted (e.g., accent color or underline)
- Clicking an icon navigates to that view
- Hover state shows subtle background highlight

---

## Daily List View

### Header Section
**Top-left: Date Header**
- Format: `Monday, June 12, 2026`
- Font size: Large (e.g., 28px)
- Font weight: Bold
- Color: Dark text (primary color)
- Padding: 16px top, 20px left

**Top-right: Action Icons (2 icons)**
- **Plus Icon (+)**: Opens "Create Item" modal
- **Menu Icon (⋮)**: (Future) bulk actions or view options
- Positioned 20px from right, 16px from top
- Icon size: 24px
- Hover state: Subtle background circle

### Main Content Area

**Item List Container**
- Padding: 20px left (accounting for bullet/dash), 16px top
- White/light background
- Scrollable if items exceed viewport height

**Item Display Format**

Each item is displayed as a row with:

```
• [Item Name]
  [Description subscript]
  [Notes smaller text]
```

#### Item Types & Markers

**Regular Tasks**: Bullet point (•)
- Example: `• Buy groceries`
- Description appears directly below, in smaller italicized font
- Notes appear in even smaller font, gray color

**Appointments**: Dash (–)
- Example: `– Team meeting`
- Same description/notes layout as tasks
- Visually distinct to indicate time-specific nature

**Notes**: Star (★)
- Example: `★ Remember to call Mom`
- Different marker to indicate low-priority reminders
- Same description/notes layout

#### Spacing
- Vertical spacing between items: 12px
- Description to name: 2px below name
- Notes to description: 4px below description
- Left padding (before bullet/dash): 16px

### Item Interactions

#### Hover State
- When mouse hovers over an item's bullet/dash/star:
  - Bullet/dash/star becomes a **draggable handle** (cursor changes to grab)
  - Subtle background highlight on the entire row (optional)

#### Drag & Drop
- Click and hold on bullet/dash/star, then drag item up/down to reorder
- Visual feedback: Ghost/semi-transparent preview of item follows cursor
- Drop target line appears between items to show insertion point
- On drop: Item position updates in real-time
- Animation: Smooth 200ms transition into new position

#### Right-click Context Menu (Optional)
- Edit item
- Mark complete (move to archive)
- Delete item

---

## Create Item Modal

### Trigger
- Clicking the **+** icon in Daily List header

### Modal Layout
- Position: Center of screen
- Background: Semi-transparent overlay (darkens main content)
- Modal width: ~400px
- Modal height: Auto (adjusts to content)
- Border radius: 8px
- Padding: 24px

### Form Fields (in order)

**1. Item Type Dropdown**
- Label: "Type"
- Options: `Task`, `Appointment`, `Note`
- Default: `Task`
- Font size: 14px

**2. Item Name Field**
- Label: "Task Name"
- Placeholder: "e.g., Buy groceries"
- Type: Text input
- Required: Yes
- Max length: 100 characters
- Font size: 14px

**3. Description Field**
- Label: "Description"
- Placeholder: "Add details... (optional)"
- Type: Textarea
- Rows: 3
- Optional: Yes
- Font size: 14px

**4. Notes Field**
- Label: "Notes"
- Placeholder: "Personal notes... (optional)"
- Type: Textarea
- Rows: 2
- Optional: Yes
- Font size: 14px

**5. Schedule Field**
- Label: "Schedule for"
- Layout: Inline with date display + calendar icon
- Default: Today's date (e.g., "Mon, Jun 12")
- Calendar icon (📅): 20px, clickable

**6. Time Field (Appointments Only)**
- Label: "Time"
- Type: Time input or HH:MM picker
- Format: 24-hour or 12-hour (user preference)
- Default: Empty or 12:00 PM
- Visible only when Item Type = "Appointment"
- Hidden for Task and Note types

### Calendar Picker

#### Trigger
- Click the calendar icon in the Schedule field

#### Layout
- Appears as a dropdown/popover below the Schedule field
- Month/year header with prev/next arrows
- Full calendar grid (7 columns × 6 rows)
- Current date highlighted
- Today's date marked with accent color
- Past dates grayed out (non-clickable)

#### Interaction
- Clicking a future date updates the Schedule field
- Scroll through months using arrow buttons
- Close picker: Click outside, ESC key, or click a date

### Form Actions

**Bottom of Modal**
- **Cancel Button**: Closes modal without saving
  - Style: Secondary (outline)
  - Position: Left
- **Create Button**: Saves item to database
  - Style: Primary (filled, accent color)
  - Position: Right
  - Disabled state: If Item Name is empty
  - On click: Item added to appropriate day, modal closes

### Form Validation
- Item Name is required
- Show inline error message if user tries to submit empty form
- Error color: Red/warning color

---

## Item Data Flow

### On Create
1. User fills form → clicks Create
2. Item saved to database with:
   - `name` (required)
   - `description` (optional)
   - `notes` (optional)
   - `type` (Task/Appointment/Note)
   - `scheduledDate` (date selected in calendar)
   - `order` (position in list for that day)
3. Item appears in list under the scheduled date
4. Modal closes

### On Reorder
1. User drags item
2. New `order` position calculated
3. Update sent to database
4. UI reflects new order immediately

---

## Calendar View

### Header Section
**Top-left: Month/Year Header**
- Format: `June 2026`
- Font size: Large (e.g., 28px)
- Font weight: Bold
- Navigation: Prev/Next month arrows on sides
- Padding: 16px top, 20px left

**Top-right: Plus Icon**
- Click to open "Create Item" modal
- Same behavior as Daily List view

### Calendar Grid

**Layout**
- 7-column grid (Sun–Sat)
- Each cell represents a day of the month
- Cells auto-adjust to fill available space
- Padding: 16px all sides

**Day Cell Format**
```
[Day Number]
[Item 1 - if present]
[Item 2 - if present]
...
```

**Day Numbers**
- Font size: 14px, bold, top-left of cell
- Color: Dark text
- Previous/next month dates grayed out

**Items on Calendar**
- **Appointments**: Display as time blocks
  - Format: `[HH:MM] [Appointment Name]`
  - Background color: Light accent (distinguishes from tasks)
  - Font size: 12px
  - Positioned relative to the cell (middle of day for visual clarity)
  - If multiple appointments, stack vertically
- **Tasks**: Shown as text line items (not time-blocked)
  - Format: `• [Task Name]`
  - Font size: 12px
- **Notes**: Shown as text line items
  - Format: `★ [Note Name]`
  - Font size: 12px
- Today's cell: Subtle background highlight (e.g., light blue)
- Hover on cell: Light background tint to indicate clickability

### Calendar Interactions

**Click on Day Cell**
- Navigates to Daily List view for that date
- Sidebar updates to show that date's list

**Right-click on Item in Cell**
- Context menu with Edit / Delete options

---

## Standalone Lists View

### Header Section
**Top-left: Title**
- Text: "My Lists"
- Font size: Large (e.g., 28px)
- Font weight: Bold
- Padding: 16px top, 20px left

**Top-right: Plus Icon**
- Click to create a new standalone list
- Opens a simple dialog: Input field for "List Name" + Create button

### List Display

**Layout**
- Vertical stack of list items
- Full width, scrollable if many lists
- Padding: 20px left/right, 16px top/bottom between items

**List Item Format**
```
[List Name]
───────────────────────
```

**Styling**
- List name: Font size 16px, normal weight, dark text
- Border: Thin line (1px) below each list name, light gray (#E0E0E0)
- Padding: 12px vertical per item
- Hover state: Subtle background highlight (#F9F9F9)
- Cursor: Pointer

**Interactions**
- Click list name → Navigate to List View (see below)
- Right-click → Context menu: Rename, Delete
- Drag to reorder (optional enhancement)

---

## List View

### Header Section
**Top-left: List Name**
- Format: `[Custom List Name]`
- Font size: Large (e.g., 28px)
- Font weight: Bold
- Padding: 16px top, 20px left

**Top-right: Plus Icon**
- Click to open "Create Item" modal
- Items created here are added to this list (not dated)

### Main Content Area

**Layout**
- Identical to Daily List view
- Items displayed as bullets (•) / dashes (–) / stars (★)
- Names, descriptions, notes in same format
- Drag-to-reorder functionality

**Key Difference from Daily List**
- No date header
- Items persist indefinitely in this list
- Useful for recurring, project-based, or reference tasks

---

## Search View

### Header Section
**Top-left: Title**
- Text: "Search"
- Font size: Large (e.g., 28px)
- Font weight: Bold

**Top-center: Search Bar**
- Placeholder: "Search items by name or date..."
- Type: Text input with magnifying glass icon
- Width: ~60% of viewport
- Padding: 16px vertical

**Top-right: Filter Icon**
- Icon: Funnel/filter symbol (⚙️ or ⋮)
- Click to open Filter Panel (see below)

### Filter Panel

**Position**: Appears as a dropdown/popover on click

**Filter Options**
- **Date Range**: From date → To date (calendar pickers)
- **Status**: Checkboxes for Not Started, In Progress, Completed
  - Not Started: Gray (#999999)
  - In Progress: Purple (#9C27B0)
  - Completed: Green (#4CAF50)
- **Item Type**: Checkboxes for Task, Appointment, Note
- **Apply Button**: Confirms filters
- **Clear Button**: Resets all filters

### Search Results Display

**Layout**
- Results shown as columns or grid (responsive)
- Each column represents one day with matching items
- Columns arranged left-to-right, top-to-bottom
- Subtle arrows (→) between columns showing progression
- If results exceed viewport width: Arrange as grid with smaller columns

**Result Cell Format**
```
[Date: e.g., "Jun 12"]
──────────────────────
[Item Name]
[Status Label]
```

**Status Label Styling**
- **Not Started**: Gray text (#999999)
- **In Progress**: Purple text (#9C27B0)
- **Completed**: Green text (#4CAF50)
- Font size: 12px, italic

**Interactions**
- Click a cell → Navigate to that day's Daily List
- Hover cell → Background highlight

---

## Records View

### Header Section
**Top-left: Title**
- Text: "Records"
- Font size: Large (e.g., 28px)
- Font weight: Bold
- Padding: 16px top, 20px left

### Records Grid

**Layout**
- Grid of boxes, responsive sizing
- Each box represents a past daily list
- Min box size: 100px × 100px (scales up on larger screens)
- Gap between boxes: 12px
- Padding: 16px all sides

**Box Format**
```
[Date: e.g., "Jun 12"]
[Day of Week: e.g., "Thursday"]
[Optional: Item count, e.g., "5 items"]
```

**Styling**
- Background: Light gray (#F9F9F9)
- Border: 1px solid #E0E0E0
- Border radius: 4px
- Font size: 14px, dark text
- Hover: Slight shadow, cursor pointer
- Date color: Accent color
- Day/count: Secondary gray

**Interactions**
- Click box → Opens read-only Daily List view (see below)
- Right-click → Context menu: Export, Delete

---

## Read-Only Daily List View

### Header Section
**Same as Daily List**
- Date in "Monday, June 12, 2026" format
- Minus icons (no plus icon, no edit capability)

**Read-Only Label**
- Position: Top-right corner
- Format: Label badge with "Read-Only" text
- Style: Gray background, small font (10px)
- Padding: 4px 8px

### Main Content Area

**Item Display**
- Identical to Daily List layout
- All text: Grayed out (#CCCCCC or similar low-contrast color)
- Bullets/dashes/stars: Also grayed out
- No hover effects
- No drag-to-reorder
- No context menus

**Interactions**
- No editing possible
- Click items: No action (or show tooltip "Read-Only")
- Back button (arrow) in top-left corner to return to Records view

---

## Other Views (Placeholder)

### Settings View
- App preferences (theme, notifications, etc.)
- TBD: Detailed layout

### Profile View
- User info, avatar, preferences
- TBD: Detailed layout

---

## Visual Design System

### Colors
- **Primary Accent**: #007AFF (blue)
- **Background**: #FFFFFF (white) or #F9F9F9 (light gray)
- **Sidebar Background**: #2a2a2a (dark charcoal)
- **Text Primary**: #1a1a1a (dark)
- **Text Secondary**: #666666 (gray)
- **Text Tertiary**: #999999 (light gray)
- **Hover**: #F0F0F0 (light background)
- **Border**: #E0E0E0 (light border)
- **Error**: #FF3B30 (red)

### Typography
- **Font Family**: System sans-serif (e.g., -apple-system, Segoe UI)
- **Date Header**: 28px, bold, primary text
- **Item Name**: 16px, normal, primary text
- **Description**: 13px, italic, secondary text
- **Notes**: 12px, normal, tertiary text
- **Label**: 14px, normal, secondary text
- **Input/Field**: 14px, normal, primary text

### Spacing System
- Base unit: 4px
- Padding: 4px, 8px, 12px, 16px, 20px, 24px
- Margins: Same increments

### Icons
- Size: 20px (standard), 24px (large), 32px (extra large)
- Color: Match text color context
- Stroke width: 1.5px for outline icons

---

## Responsive Considerations

### Desktop (1024px+)
- Sidebar: Always visible
- Main content: Full width minus sidebar
- Modal: Centered

### Tablet (600px–1023px)
- Sidebar: May collapse to icon-only
- Main content: Adjust to available width
- Modal: Full screen or centered

### Mobile (<600px)
- Sidebar: Might become a bottom navigation bar or hamburger menu
- Main content: Full width
- Modal: Full screen

---

## Accessibility

- All icon buttons have `aria-label` attributes
- Form labels associated with inputs via `<label>` elements
- Color contrast: WCAG AA compliant (4.5:1 for text)
- Keyboard navigation: Tab through form fields, Enter to submit
- Focus states: Clear outline on interactive elements

---

## Animation & Transitions

- **Page transitions**: 200ms fade-in
- **Drag & drop**: Item scales 1.05 on drag, smooth drop-in on release
- **Modal open/close**: 150ms fade + scale
- **Hover states**: 100ms transition on background/color changes

---

## Next Steps

- Implement Daily List view with all features
- Expand Weekly, Archive, Settings, Profile views
- Add responsive layouts for tablet/mobile
- Implement calendar picker component
- Add drag-and-drop library (e.g., react-beautiful-dnd)
