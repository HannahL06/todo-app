# Todo App v1 - API Design Spec

## Scope

This document defines the REST API design for v1.

- Platform scope: desktop web
- User scope: single user in v1
- Auth: not included in v1 (planned for v2)
- Data model details: handled in a separate spec

## API Design Principles

- Resource-oriented REST endpoints
- Predictable URL and payload patterns
- Idempotent reads and safe retries where practical
- Local-time-aware daily behavior
- Clear separation of v1 and future-version concerns

## Conventions

### Base URL

- `/api/v1`

### Content type

- Request: `application/json`
- Response: `application/json`

### Date and time formats

- Date only: `YYYY-MM-DD`
- DateTime: ISO 8601 string
- Time only (if used): `HH:mm:ss`

### Status values

- `untouched`
- `in-progress`
- `completed`

Status cycle order for checkbox behavior:

- `untouched -> in-progress -> completed`

### Item types

- `task`
- `note`
- `appointment`

### Error response shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "End time must be after start time",
    "details": []
  }
}
```

## Endpoints

## 1) Daily List

### Get daily list for a date

- `GET /api/v1/daily-items?date=YYYY-MM-DD`

Purpose:

- Returns the list for one local day, including tasks, notes, and appointments.

Success response example:

```json
{
  "date": "2026-06-12",
  "items": [
    {
      "dailyItemId": 101,
      "itemId": 15,
      "type": "task",
      "name": "Pay rent",
      "status": "in-progress",
      "sortOrder": 1,
      "parentItemId": null,
      "listId": 3,
      "isRolling": true
    }
  ]
}
```

### Reorder daily items

- `PATCH /api/v1/daily-items/reorder`

Request example:

```json
{
  "date": "2026-06-12",
  "orderedDailyItemIds": [101, 102, 110]
}
```

Rules:

- Persists drag-and-drop order for that date.
- Returns `400` if ids are invalid or duplicated.

### Remove from today only

- `POST /api/v1/daily-items/{dailyItemId}/remove-today`

Rules:

- Hides item from the selected date view only.
- Does not permanently stop future rollover.

## 2) Status Management

### Set explicit status

- `PATCH /api/v1/daily-items/{dailyItemId}/status`

Request example:

```json
{
  "status": "completed"
}
```

Rules:

- Validates allowed status values.
- If item is parent and set to `completed`, all child tasks for that date are set to `completed`.

### Cycle status (checkbox action)

- `POST /api/v1/daily-items/{dailyItemId}/cycle-status`

Rules:

- Applies the fixed order `untouched -> in-progress -> completed`.
- Returns updated status value for immediate UI update.

## 3) Items (Base entity)

### Create item

- `POST /api/v1/items`

Request example:

```json
{
  "type": "task",
  "name": "Prepare slides",
  "description": "Q2 summary",
  "scheduledDate": "2026-06-15",
  "listId": 2,
  "parentItemId": null,
  "isRolling": true
}
```

Rules:

- `scheduledDate` is required in v1.
- All items must be tied to a date context in v1.

### Update item metadata

- `PATCH /api/v1/items/{itemId}`

Supported fields:

- `name`
- `description`
- `scheduledDate`
- `listId`
- `parentItemId`
- `isRolling`

### Change item type

- `POST /api/v1/items/{itemId}/change-type`

Request example:

```json
{
  "newType": "appointment",
  "appointment": {
    "startDateTime": "2026-06-13T13:00:00",
    "endDateTime": "2026-06-13T14:00:00",
    "location": "Office"
  }
}
```

Rules:

- Old typed representation is replaced by new type representation.
- New type required fields must validate.

### Permanently stop rollover (with confirm in UI)

- `PATCH /api/v1/items/{itemId}/rollover`

Request example:

```json
{
  "isRolling": false
}
```

Rules:

- Used by permanent delete flow in v1 behavior.
- Item no longer appears in future daily rollovers.

## 4) Standalone Lists

### Get all lists

- `GET /api/v1/lists`

### Create list

- `POST /api/v1/lists`

Request example:

```json
{
  "name": "Home",
  "notes": "Personal errands"
}
```

### Get one list with items

- `GET /api/v1/lists/{listId}/items`

Rules:

- Returns only `task` and `note` items for standalone list view.
- Excludes `appointment` type for this view.

### Add item directly into list view

- `POST /api/v1/lists/{listId}/items`

Rules:

- Supports `task` and `note` only.

### Reorder list items

- `PATCH /api/v1/lists/{listId}/reorder`

## 5) Appointments

### Create appointment

- `POST /api/v1/appointments`

Request example:

```json
{
  "name": "Dentist",
  "scheduledDate": "2026-06-19",
  "startDateTime": "2026-06-19T09:00:00",
  "endDateTime": "2026-06-19T10:00:00",
  "location": "Main St"
}
```

Rules:

- `endDateTime` must be greater than `startDateTime`.

### Update appointment

- `PATCH /api/v1/appointments/{itemId}`

### Delete appointment from future rollover behavior

- Use item rollover endpoint: `PATCH /api/v1/items/{itemId}/rollover`

## 6) Calendar and Records

### Calendar month summary

- `GET /api/v1/calendar/month?year=2026&month=6`

Purpose:

- Returns date cells with counts and indicator flag.

Response example:

```json
{
  "year": 2026,
  "month": 6,
  "days": [
    {
      "date": "2026-06-12",
      "itemCount": 7,
      "hasItems": true
    }
  ]
}
```

### Read-only record for past day

- `GET /api/v1/records/{date}`

Rules:

- Returns historical snapshot for that day.
- Mutations to records are blocked in v1.

## 7) Search and Timeline

### Search by name with filters and sort

- `GET /api/v1/search/items?query=rent&from=2026-05-01&to=2026-06-30&status=completed&hasNote=true&sortBy=date&sortOrder=asc`

Supported query params:

- `query` (name search)
- `from`
- `to`
- `status`
- `hasNote`
- `sortBy` in `date | status | hasNote`
- `sortOrder` in `asc | desc`

### Timeline for one item

- `GET /api/v1/items/{itemId}/timeline`

Response example:

```json
{
  "itemId": 15,
  "name": "Pay rent",
  "timeline": [
    { "date": "2026-06-10", "status": "untouched", "note": null },
    { "date": "2026-06-11", "status": "in-progress", "note": "Called bank" },
    { "date": "2026-06-12", "status": "completed", "note": "Done" }
  ]
}
```

## 8) System Operations

### Automatic rollover job endpoint (internal only)

- `POST /api/v1/system/rollover/run`

Rules:

- Intended for scheduler/internal use.
- Not exposed to normal users in v1.
- Must be idempotent for same date and user scope.

## Non-Goals for v1 API

- Authentication and authorization endpoints
- Multi-user project collaboration endpoints
- Recurring task/appointment endpoints
- Export endpoints (CSV/PDF)

## Future API Notes (v2+)

- Add auth endpoints and user-scoped tokens
- Add recurrence resources and recurrence rule processing
- Add restore/reinstate endpoints for ended tasks
- Add team/project resources if v3 collaboration is approved
