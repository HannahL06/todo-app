# ADR-0003: Backend Framework Selection

Date: 2026-06-10
Status: Accepted

## Context

The backend must support:

* REST API for tasks, appointments, and daily lists
* Complex relational operations (rollovers, history tracking)
* Scheduled background jobs (daily task rollover at midnight)
* Strong architectural organization for long-term maintainability
* TypeScript-first development aligned with the frontend

## Decision

Use NestJS as the backend framework.

## Alternatives Considered

### Express

Pros:

* Minimal and flexible
* Large ecosystem and community

Cons:

* No built-in structure
* Requires manual integration of validation, scheduling, and architecture patterns
* Can lead to inconsistent code organization

### Fastify

Pros:

* Better performance than Express
* Built-in validation support
* Cleaner TypeScript experience

Cons:

* Smaller ecosystem than Express or NestJS
* Less opinionated structure
* Scheduling still requires additional setup

### Next.js API Routes

Pros:

* Full-stack integration with frontend
* Shared types and simplified deployment

Cons:

* Not well-suited for scheduled background jobs
* Less appropriate for long-running backend processes like daily rollovers
* Serverless constraints complicate persistent scheduling logic

## Consequences

### Positive

* Enforced architecture improves maintainability
* Built-in dependency injection and validation reduce boilerplate
* Native support for scheduled jobs enables daily rollover automation
* Scales well to multi-user backend systems
* Strong compatibility with Prisma and TypeScript

### Negative

* Steeper learning curve than Express or Fastify
* More initial setup complexity
* More rigid structure requires adherence to framework conventions
