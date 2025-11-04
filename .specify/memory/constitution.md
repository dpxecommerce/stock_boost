<!--
Sync Impact Report:
- Version change: Initial → 1.0.0
- New constitution for Stock Boost project
- Principles focused on: Component-First, Next.js Conventions, Minimal Viable Testing, Fast Development Cycle, Simplicity
- Templates requiring updates: ✅ Constitution aligned with plan/spec/tasks templates
- Follow-up TODOs: None - all placeholders filled
-->

# Stock Boost Constitution

## Core Principles

### I. Component-First Architecture
Every feature starts as a reusable component; Components must be self-contained, independently testable, and documented with clear interfaces; Atomic design principles guide component hierarchy (atoms → molecules → organisms → templates → pages); No feature-specific components without clear reusability justification.

**Rationale**: Enables rapid development through component reuse and maintains consistent UI patterns across the application.

### II. Next.js Conventions (NON-NEGOTIABLE)
Strict adherence to Next.js file-based routing and App Router patterns; Server Components by default, Client Components only when interactivity required; API routes follow REST conventions in `/app/api/` directory; Static generation preferred over server-side rendering unless dynamic data required.

**Rationale**: Leverages Next.js optimizations and ensures predictable project structure for fast onboarding and maintenance.

### III. Minimal Viable Testing
Focus on integration tests that verify user journeys rather than exhaustive unit testing; Component testing via React Testing Library for critical user interactions only; API endpoint testing for business logic validation; Avoid testing implementation details or trivial components.

**Rationale**: Maximizes development velocity while maintaining confidence in core functionality and user experience.

### IV. Fast Development Cycle
Hot reload must work consistently; Development setup completed in under 5 minutes; New feature implementation should not require build process changes; Prefer runtime configuration over compile-time complexity; TypeScript for type safety without sacrificing development speed.

**Rationale**: Maintains rapid iteration cycles essential for agile development and quick feedback loops.

### V. Simplicity Over Abstraction
Start with the simplest implementation that works; Avoid premature optimization and over-engineering; Prefer composition over inheritance; No abstraction layers without clear, immediate value; YAGNI (You Aren't Gonna Need It) principle strictly enforced.

**Rationale**: Reduces cognitive load, accelerates development, and maintains codebase clarity for rapid feature development.

## Technology Stack

**Framework**: Next.js 14+ with App Router (NON-NEGOTIABLE)
**Language**: TypeScript for type safety with minimal configuration overhead
**Styling**: Tailwind CSS for rapid UI development and consistent design system
**Database**: Prisma ORM with PostgreSQL for type-safe database operations
**Testing**: Vitest + React Testing Library for minimal viable test coverage
**Deployment**: Vercel for seamless Next.js deployment and edge optimization

## Development Workflow

**Branch Strategy**: Feature branches with descriptive names (`feature/stock-dashboard`, `fix/portfolio-calculation`)
**Code Review**: Required for all changes; Focus on architecture adherence and user impact over style nitpicks
**Testing Gates**: Integration tests must pass; Component tests for user-critical interactions only
**Deployment**: Automatic deployment on main branch merge; Preview deployments for all pull requests

## Governance

This constitution supersedes all other development practices and architectural decisions. All pull requests and code reviews must verify compliance with these principles, particularly Component-First architecture and Next.js conventions. Complexity must be justified against the Simplicity principle with clear documentation of why simpler alternatives were insufficient.

Amendments require team consensus, documentation of impact on existing codebase, and migration plan for non-compliant code. The constitution guides technical decisions but should not block rapid development cycles.

**Version**: 1.0.0 | **Ratified**: 2025-11-03 | **Last Amended**: 2025-11-03
