# Todo App — Tech Stack Specs



---

## ORM: Prisma

**Chosen: Prisma**

| Option | Decision | Reason |
|---|---|---|
| Drizzle | Not chosen | More SQL-like syntax, but smaller community and fewer learning resources |
| **Prisma** | **✅ Chosen** | More widely used, better documentation, larger ecosystem, VS Code extension already installed |

---

## Backend Framework: NestJS (TypeScript)

**Chosen: NestJS**
ment, calendar/date functionality, drag-and-drop interactions, nested list support (Dynalist-style).

| Option | Decision | Reason |
|---|---|---|
| Angular | Rejected | Too much boilerplate, steepest learning curve, overkill for this app |
| Vue | Not chosen | Easier to learn, HTML-like syntax, large ecosystem — but smaller than React, missing key libraries for calendar and nested list use cases |
| **React** | **✅ Chosen** | Industry standard, largest ecosystem, best library support for this app's specific UI needs (see below) |
| **Vite** | **✅ Chosen** | Modern build tool and dev server for React — replaces Create React App |

### Key React Libraries

| Library | Purpose |
|---|---|
| `react-big-calendar` | Calendar view (monthly/daily) |
| `react-arborist` | Dynalist-style nested task list with collapse/expand and reordering |
| `@tanstack/react-query` | Server state sync — fetching and caching data from the NestJS API |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-and-drop reordering |

---

## Language: TypeScript Throughout

Used on both frontend (React) and backend (NestJS) for type safety. Prisma generates TypeScript types directly from the database schema, enabling end-to-end type safety.

---


## Architecture

- **Separate `client/` and `server/` directories** — not a Next.js monolith
- Frontend (React + Vite) and backend (NestJS) are independent applications
- Frontend communicates with backend via **REST API calls**
- Models a real production architecture with a proper client/server split

---

# Data Model — Todo App

## User
Represents an application user.

- **UserID** (PK)
- Name
- Email (unique)
- CreatedAt

---

## Item
Core entity representing all user-created content (tasks, notes, appointments).

- **ItemID** (PK)
- UserID (FK → User)
- Name
- Description (nullable)
- Type (Task | Appointment | Note)
- CreatedAt (datetime)
- DeletedAt (nullable, soft delete)
- ListID (nullable, FK → List)
- ParentItemID (nullable, self-reference for nested items)
- SortOrder (nullable)

### Notes
- Items are the base abstraction for all entities.
- Supports hierarchical structure via ParentItemID.
- Soft delete via DeletedAt (items are never physically removed).

---

## DailyItem
Represents the state of an Item on a specific date (daily snapshot system).

- **DailyItemID** (PK)
- ItemID (FK → Item)
- UserID (FK → User)
- Date (date-only)
- Status (Not Started | In Progress | Completed)
- Notes (nullable, per-day log)
- SortOrder (nullable)

### Constraints
- One DailyItem per Item per Date (unique constraint)

### Notes
- This is the system’s historical record of daily activity.
- Represents a snapshot, not a live-updating entity.
- Tasks are rolled forward by creating new DailyItems for the next day.

---

## Appointment
Time-based extension of Item representing real-world events.

- **AppointmentID** (PK)
- ItemID (FK → Item, unique)
- StartTime (datetime)
- EndTime (datetime)
- Location (nullable)

### Notes
- Represents fixed calendar events.
- Does NOT participate in rollover logic.
- Appears in daily views via date/time query, not via DailyItem storage.

---

## List
Named grouping of Items.

- **ListID** (PK)
- UserID (FK → User)
- Name
- Notes (nullable)
- CreatedAt

---

# Relationships Summary

- User 1 → many Items
- User 1 → many DailyItems
- User 1 → many Lists
- Item 1 → many DailyItems
- Item 1 → 0 or 1 Appointment (1:1 extension)
- Item 1 → many Items (self-referencing hierarchy via ParentItemID)
- List 1 → many Items

---

# Core Design Principles

- Items are the source of identity
- DailyItems represent time-based state
- Appointments represent fixed real-world events
- Rollover is a backend process, not a stored property
- History is preserved via immutable DailyItems
- User ownership is explicitly stored (not inferred)
```

---'         