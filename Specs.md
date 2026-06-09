# Todo App — Tech Stack Specs

## Database: PostgreSQL (local for development)

**Chosen: PostgreSQL**

| Option | Decision | Reason |
|---|---|---|
| SQLite | Rejected | No multi-user support, cannot be cloud-hosted, not scalable |
| MySQL | Rejected | Less capable than PostgreSQL for complex queries and date/time handling — no advantages over PostgreSQL |
| MongoDB | Rejected | Stores data as JSON documents rather than relational tables — doesn't fit this app's highly structured data model |
| Cloud-hosted PostgreSQL (Neon, Supabase, PlanetScale) | Deferred | Production-grade approach — move here when deploying to cloud |
| **PostgreSQL** | **✅ Chosen** | Scales to multi-user, excellent date/time support, runs on every cloud platform, supports JSON when needed |

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

The backend is TypeScript because the frontend is JavaScript/TypeScript — keeping the same language throughout. The framework works with Prisma ORM to query the database.

| Option | Decision | Reason |
|---|---|---|
| Express | Rejected | No enforced structure, no built-ins — too much manual work and setup |
| Fastify | Not chosen | Native TypeScript, cleaner than Express, built-in validation, scheduler plugin available — strong option, but NestJS is more structured |
| **NestJS** | **✅ Chosen** | Enforced architecture, built-in scheduler (required for daily task rollover at midnight), validation, auth, exception handling. Steepest learning curve but most organized and production-ready |

---

## Frontend: React + Vite (TypeScript)

**Chosen: React + Vite**

Requirements: dynamic state management, calendar/date functionality, drag-and-drop interactions, nested list support (Dynalist-style).

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

## Data Model

### Items
The base entity — represents any item regardless of type (task, appointment, note).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| ItemID | int | PK, auto-increment | |
| Name | varchar(100) | NOT NULL | |
| Description | varchar(500) | nullable | Permanent description |
| DateCreated | date | NOT NULL | |
| UserID | int | FK → Users.UserID | |
| ItemTypeID | int | FK → ItemType.ItemTypeID | |
| ListID | int | FK → Lists.ListID, nullable | Null if not part of a named list |
| ParentItemID | int | FK → Items.ItemID, nullable | For nested items (Dynalist-style) |
| IsRolling | bool | NOT NULL, default false | Whether item carries forward on rolling schedule |
| SortOrder | int | nullable | Display order within a list or day |
| DeletedAt | datetime | nullable | Null = active; set = soft-deleted |

> **Soft deletes:** Items are never hard-deleted. When a user removes an item from the daily list they are prompted: roll over to tomorrow, or end for good. Either way the item row and all its DailyItems history are preserved. `DeletedAt` is set only on permanent end.

---

### DailyItems
Assignment table — records which items appear on which day, and what happened that day. Builds the historical record automatically.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| ItemDailyID | int | PK, auto-increment | |
| ItemID | int | FK → Items.ItemID | |
| UserID | int | FK → Users.UserID | Denormalized for query performance |
| Date | date | NOT NULL | The day this item was scheduled |
| Status | varchar(20) | NOT NULL, default 'not-started' | Allowed values: `not-started` (untouched), `in-progress` (started but not done), `completed` (done for the day) |
| IsRolling | bool | NOT NULL, default false | Whether this item was rolled over from the previous day |
| Notes | varchar(500) | nullable | Daily log note — what happened with this item on this day |
| SortOrder | int | nullable | Display order within the day's list |

> The daily list is not a stored entity — it is a query: all DailyItems where Date = today.

---

### Lists
Persistent named collections (e.g. "Work Projects", "Reading List").

| Column | Type | Constraints | Notes |
|---|---|---|---|
| ListID | int | PK, auto-increment | |
| Name | varchar(100) | NOT NULL | |
| Notes | varchar(500) | nullable | |
| DateCreated | date | NOT NULL | |
| UserID | int | FK → Users.UserID | |

---

### ItemType
Lookup table for item types.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| ItemTypeID | int | PK, auto-increment | |
| Name | varchar(20) | NOT NULL | e.g. Task, Appointment, Note |

---

### Appointments
Extension table — one row per item where `ItemTypeID = Appointment`. Holds all appointment-specific fields.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| AppointmentID | int | PK, auto-increment | |
| ItemID | int | FK → Items.ItemID, unique | One row per appointment item |
| StartTime | time | NOT NULL | |
| EndTime | time | NOT NULL | |
| Location | varchar(255) | nullable | |

---

### Users
_(Deferred — not implemented in v1 for single-user local use)_

| Column | Type | Constraints |
|---|---|---|
| UserID | int | PK, auto-increment |
| Name | varchar(100) | NOT NULL |
| Email | varchar(255) | NOT NULL, unique |

---

### Relationships Summary

```
Users ──< Items >── ItemType
Users ──< DailyItems
Users ──< Lists
Items ──< DailyItems
Items ──< Items (self-referential: ParentItemID for nesting)
Items ──< Appointments (1:1 extension, only when ItemType = Appointment)
Lists ──< Items
```

---

## API Design

Endpoints are defined in NestJS controllers and emerge from the data model. Each resource (tasks, appointments, lists) gets its own set of endpoints covering the operations the frontend needs.

**Planned API surface:**

- **Tasks** — get by date, create, update (status/title/date), delete, toggle rolling schedule
- **Appointments** — get by date range, create, update, delete
- **Lists** — get all lists, create list, get items, add/update/delete items
- **Search/Timeline** — search tasks by keyword or date range

---

## User Stories

### Daily Rollover

**As a user**, when a new day begins, I want any rolling items that were not completed to automatically appear on today's daily list — so that I don't have to manually re-add unfinished work.

**Acceptance criteria:**
- Items with `IsRolling = true` and `Status` of `not-started` or `in-progress` at end of day are automatically carried forward to the next day
- A new `DailyItems` row is created for each rolled item with `Date = today`, `Status = 'not-started'`, `IsRolling = true`
- `completed` items are **never** rolled over, regardless of `IsRolling`
- Rollover runs once at midnight via a scheduled cron job (NestJS scheduler) — not on page load
- The app does not need to be open, and no user interaction is required for rollover to occur
- If an item has already been added to today's list (e.g. manually), no duplicate row is created

---

### Item Status

**As a user**, I want to mark each item on my daily list with one of three statuses — so that I can clearly communicate where I am with each item throughout the day.

**Status values:**

| Value | Meaning | Rollover behavior |
|---|---|---|
| `not-started` | Item is scheduled but hasn't been touched | Rolls over if `IsRolling = true` |
| `in-progress` | Started but not finished | Rolls over if `IsRolling = true` |
| `completed` | Done for this day | Never rolls over |

**Acceptance criteria:**
- Every item on the daily list displays its current status
- A user can set an item's status to any of the three values (e.g. via a dropdown, button group, or click-to-cycle)
- Default status when an item is added to a day is `not-started`
- `completed` items are visually distinct (e.g. greyed out, strikethrough, moved to a "done" section)
- Status is stored on `DailyItems.Status` — it is a per-day field, not a permanent property of the item itself
- An item can be `completed` one day and `not-started` the next (if it rolled over)

---

### Search

**As a user**, I want to search my items by keyword or date range — so that I can quickly find anything I've logged, scheduled, or worked on.

**Acceptance criteria:**
- Keyword search matches against item `Name` and `Description`
- Date range search returns all `DailyItems` rows where `Date` falls within the range
- Search results display item name, scheduled date, and status for that day
- Soft-deleted items (`DeletedAt IS NOT NULL`) are excluded from results by default
- Search is available from any view in the app

---

## Status

- [x] Database chosen
- [x] ORM chosen
- [x] Backend framework chosen
- [x] Frontend framework chosen
- [x] Database schema designed
- [x] User stories written
- [ ] Project scaffolded
- [ ] Implementation started
