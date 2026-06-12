# ADR-0004: Frontend Framework Selection

Date: 2026-06-10
Status: Accepted

## Context

The application requires a highly interactive frontend supporting:

* Daily task lists with dynamic updates
* Drag-and-drop scheduling for tasks and appointments
* Calendar-based navigation (daily and monthly views)
* Nested list structures for tasks and sub-tasks
* Historical browsing of past daily records

The UI must support complex state management and frequent updates.

## Decision

Use React with Vite as the frontend framework and build tool.

## Alternatives Considered

### Vue

Pros:

* Easier learning curve
* Clear and structured syntax
* Good built-in patterns

Cons:

* Smaller ecosystem than React
* Fewer specialized libraries for complex UI patterns required in this app

### Angular

Pros:

* Fully integrated framework
* Strong conventions and structure

Cons:

* High boilerplate overhead
* Steep learning curve
* Over-engineered for this project scope

## Consequences

### Positive

* Large ecosystem with strong library support for drag-and-drop and calendars
* Strong community support and documentation
* Flexible architecture suitable for complex UI interactions
* Excellent compatibility with TypeScript

### Negative

* Requires additional architectural discipline due to flexibility
* Multiple library choices may increase initial setup complexity
