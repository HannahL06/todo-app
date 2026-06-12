# Todo App v1 - Partial Spec (Stories + Acceptance Criteria)

## Scope Of This Document

This is a partial product spec for v1 focused on:
- User stories
- Given/When/Then acceptance criteria

This does not define the data model yet.

## v1 Product Scope Snapshot

- Platform: desktop web browser
- Primary use: personal day-to-day life planning (single user in v1)
- Core views: Daily List, Calendar (month), Standalone Lists, Records (read-only), Search Timeline
- Item types: Task, Note, Appointment
- Standalone list limitation: tasks and notes only (no appointments)

---

## User Stories With Acceptance Criteria

### US-01 Daily list opens to today
As a user, I want the app to open to my current local day list so I can start planning immediately.

Acceptance criteria:
Given I open the app
When the app loads
Then the Daily List view is shown by default
And the date shown is my local current date

### US-02 Add items through modal
As a user, I want to add tasks, notes, and appointments through a modal form so item creation feels clear and consistent.

Acceptance criteria:
Given I am in a view that supports item creation
When I click Add item
Then a modal form opens
And I can choose task, note, or appointment

Given I submit valid fields
When save completes
Then the item is created and appears on its scheduled date list

### US-03 Schedule future work
As a user, I want to schedule tasks and appointments for future dates so they appear on the right day automatically.

Acceptance criteria:
Given I create an item for a future date
When I save it
Then it does not appear on today list
And it appears on the chosen future date

### US-04 Track status by checkbox cycle
As a user, I want to click one checkbox to cycle item status so progress tracking is fast.

Acceptance criteria:
Given an item is on a daily list
When I click the checkbox once
Then status changes to the next state in order: untouched -> in-progress -> completed

Given the status changes
When the update is applied
Then the status is persisted in storage
And the UI color reflects status: gray untouched, green in-progress, purple completed

### US-05 Parent completion cascades to children
As a user, I want child tasks to complete when the parent completes so nested work stays synchronized.

Acceptance criteria:
Given a parent task has child tasks
When I set the parent to completed
Then all child tasks for that day are set to completed

### US-06 Reorder by drag and drop
As a user, I want to drag and drop items in a daily list so I can dynamically organize my day.

Acceptance criteria:
Given multiple items exist in a list
When I drag an item by its handle and drop it elsewhere
Then the visible order updates immediately
And the new order persists after refresh

### US-07 Use nested tasks with depth cap
As a user, I want nested subtasks like Dynalist with a practical depth limit so hierarchy stays useful.

Acceptance criteria:
Given I am editing task hierarchy
When I indent or outdent within allowed levels
Then hierarchy updates correctly

Given a task is already at nesting level 7
When I attempt to indent further
Then the app blocks the action

### US-08 Remove item for today only
As a user, I want to hide an item from only today so I can clear today's view without losing future continuity.

Acceptance criteria:
Given an item is shown on today's list
When I choose remove for today
Then the item is hidden from today's view
And it remains eligible to appear on future days

### US-09 Permanently stop rollover
As a user, I want to permanently remove an item from future daily lists so it does not return.

Acceptance criteria:
Given I choose permanent deletion
When the app asks for confirmation and I confirm
Then the item is marked to stop rolling forward
And it does not appear in future daily lists

### US-10 Automatic midnight rollover
As a user, I want unfinished rolling items to repopulate on the next day automatically.

Acceptance criteria:
Given local midnight occurs
When rollover runs automatically
Then eligible items are prepared for the new day list

Given rollover is triggered more than once by error
When idempotency checks run
Then duplicate daily entries are not created

### US-11 Calendar shows activity density
As a user, I want month cells to show item presence and count so I can understand workload by day.

Acceptance criteria:
Given I am in month calendar view
When days are rendered
Then each day shows the correct date

Given a day has at least one task or appointment
When that day cell is displayed
Then it shows an ellipsis indicator and item count

### US-12 Manage multiple standalone lists
As a user, I want multiple standalone lists where I can add/edit tasks and notes for focused planning.

Acceptance criteria:
Given I open a standalone list
When items load
Then only tasks and notes are displayed
And appointments are excluded

Given I add or edit an item in standalone list
When I save
Then the change is persisted in that list

### US-13 View past days in records
As a user, I want a read-only record of past day lists so I can review what happened on each day.

Acceptance criteria:
Given I open a past date via Records view
When data loads
Then I see that day's tasks, notes, and appointments
And the view is read-only in v1

### US-14 Search by name and view timeline
As a user, I want to search by item name and see status progression over days so I can analyze habits.

Acceptance criteria:
Given I click the sidebar search icon
When search view opens
Then a search bar appears at the top

Given I enter a name query
When results are returned
Then only matching items are shown
And timeline shows day-by-day progression for those matches

### US-15 Filter and sort search results
As a user, I want to filter and sort search results so I can investigate trends quickly.

Acceptance criteria:
Given search results are visible
When I apply filters
Then the result set updates to match filters

Given search results are visible
When I sort by date, status, or note-attached
Then the result order updates accordingly

### US-16 Change item type after creation
As a user, I want to change an item's type after creation so I can correct classification without manual recreation.

Acceptance criteria:
Given an item exists
When I change the item type and save
Then the original typed representation is replaced with the new type representation
And required fields for the new type must pass validation

---

## Future Version Features

### Planned for v2

- User authentication
- Multi-user readiness infrastructure (full user ownership flow)
- Recurrence support for tasks and appointments
- Task reinstating flow (restore or re-open completed/ended tasks)
- Visual enhancements and richer progress styling refinements

### Possible for v3+

- Shared project tracking for teams (multi-user project collaboration)
- Backlog or future-ideas list that is not tied to immediate dates
