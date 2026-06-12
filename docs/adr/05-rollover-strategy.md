# ADR-0005: Daily Rollover Strategy

Date: 2026-06-10
Status: Accepted

## Context

The application is centered on **daily lists** that contain tasks and appointments. Each day represents a snapshot of user work.

A core system requirement is that:

Tasks that are not completed by the end of a day must appear in the next day's daily list
Tasks marked as In Progress also roll forward automatically
Historical daily lists must remain unchanged for auditing and user review
The system must support scaling to multiple users without race conditions or inconsistent rollovers

The system needs a reliable way to generate each new day's list.

## Decision

Use a **scheduled backend job (NestJS scheduler)** to perform daily rollover at midnight.

The job:

* Creates the next day’s daily list per user
* Carries forward only incomplete tasks
* Leaves completed tasks in past records
* Runs idempotently using a per-user-per-day execution record to prevent duplicates

Daily lists are treated as **immutable historical snapshots once created**.

## Alternatives Considered

### Lazy Initialization (on user login)

Pros:

* No background job required
* Simple initial setup

Cons:

* Inconsistent behavior across users
* Expensive catch-up logic after user inactivity
* Risk of duplicate or partial rollovers under concurrent access

### Unprotected Scheduled Job

Pros:

* Simple implementation

Cons:

* Risk of duplicate execution
* No recovery guarantees after partial failure
* Can produce inconsistent daily state

## Consequences

### Positive

* Predictable daily list generation
* Supports scalable multi-user usage
* Preserves historical accuracy
* Prevents duplicate rollovers via idempotency tracking

### Negative

* Requires reliable background job execution
* Adds backend complexity compared to lazy generation
* Requires timezone-aware scheduling rules

### Risks

* Scheduler downtime requires safe recovery logic
* Incorrect idempotency handling could duplicate daily lists
