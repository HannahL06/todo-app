# ADR-0002: ORM Selection

Date: 2026-06-10
Status: Accepted

## Context

The backend requires a database abstraction layer to manage structured data models including tasks, appointments, daily lists, notes, and historical records. The ORM must integrate well with TypeScript and PostgreSQL, and support schema migrations and type-safe queries.

## Decision

Use Prisma as the ORM for database access.

## Alternatives Considered

### Drizzle ORM

Pros:

* Lightweight and close to raw SQL
* Strong TypeScript support

Cons:

* Smaller ecosystem
* Less documentation and community support
* Less developer familiarity

### Prisma

Pros:

* Strong Type-safe ORM with auto-generated types
* Excellent documentation and ecosystem support
* Mature migration tooling
* Strong integration with TypeScript workflows
* VS Code tooling support improves development experience

## Consequences

### Positive

* Strong type safety between database schema and application code
* Simplified database access patterns for complex relational queries
* Faster development due to abstraction over raw SQL
* Mature tooling for migrations and schema evolution

### Negative

* Additional abstraction layer may obscure raw SQL behavior
* Slight performance overhead compared to raw queries in edge cases
