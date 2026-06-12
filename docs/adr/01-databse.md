# ADR-0001: Database Selection

Date: 2026-06-10
Status: Accepted

## Context

The application stores highly structured relational data including users, daily lists, tasks, appointments, notes, and historical records of task activity. Data volume is expected to grow continuously as daily records accumulate. The system is intended to eventually support multi-user access and cloud deployment.

The database must therefore support:

* Relational data modeling with strong consistency
* Efficient querying of time-based and historical data
* Scalability beyond a local development environment
* Compatibility with cloud deployment platforms
* Optional flexibility for semi-structured data where needed

## Decision

Use PostgreSQL as the primary database system for both local development and production deployment.

Cloud-hosted PostgreSQL providers (e.g., Neon, Supabase, or similar) are considered the target deployment environment for production.

## Alternatives Considered

### SQLite

Pros:

* Extremely simple local setup
* No server required

Cons:

* Limited concurrency support
* Not suitable for multi-user systems
* Poor fit for cloud deployment and scaling

### MySQL

Pros:

* Mature relational database
* Widely used in production systems

Cons:

* Less expressive support for complex date/time queries compared to PostgreSQL
* No meaningful advantage over PostgreSQL for this use case

### MongoDB

Pros:

* Flexible schema design using JSON documents

Cons:

* Poor fit for highly relational and structured data
* More complex querying for relationships (tasks, lists, history, notes)
* Weak alignment with reporting and historical tracking requirements

## Consequences

### Positive

* Strong support for relational modeling of tasks, lists, and historical records
* Excellent date/time and time-series querying capabilities
* Production-ready scalability across cloud providers
* Broad ecosystem support and tooling
* Works well with modern ORMs and TypeScript backends

### Negative

* More setup complexity than embedded databases like SQLite
* Requires database server management (even in local development)
