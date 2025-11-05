---

description: "Task list template for feature implementation"
---

# Tasks: Next.js Stock Boost Management System (Static Export)

**Input**: Design documents from `/specs/001-nextjs-stock-boost/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Architecture**: Static Next.js application connecting to external API server
**Deployment**: Static site export compatible with Vercel, Netlify, S3, etc.
**Authentication**: JWT tokens with localStorage, client-side route protection

**Tests**: Tests are included for critical user interactions as per constitution requirements (minimal viable testing).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Next.js App Router structure at repository root with components following atomic design principles.
**Static Export**: All routes are pre-rendered at build time, no server-side functionality.
**API Integration**: External API server handles all data operations via REST endpoints.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Next.js project with TypeScript, Tailwind CSS, and App Router configuration
- [x] T002 [P] Install core dependencies: @tanstack/react-query, zod, jose, bcryptjs, @types/bcryptjs
- [x] T003 [P] Install development dependencies: vitest, @testing-library/react, @testing-library/jest-dom
- [x] T004 Create project directory structure per plan.md layout
- [x] T005 [P] Configure environment variables in .env.local with JWT_SECRET and NEXT_PUBLIC_USE_MOCK_API
- [x] T006 [P] Configure Vitest and testing setup in vitest.config.ts
- [x] T007 [P] Set up Tailwind CSS configuration and global styles in app/globals.css

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create client-side authentication utilities in lib/auth.ts with external API integration
- [x] T009 Remove middleware.ts (incompatible with static export)
- [x] T010 [P] Define TypeScript types in types/auth.ts for user and JWT token interfaces
- [x] T011 [P] Define TypeScript types in types/boost.ts for stock boost and SKU interfaces
- [x] T012 [P] Define TypeScript types in types/api.ts for API response interfaces
- [x] T013 [P] Create external API client in lib/api/client.ts
- [x] T014 [P] Remove internal mock API services (external API server handles data)
- [x] T015 [P] Remove service factory (replaced by direct API client)
- [x] T016 [P] Create form validation schemas in lib/validations.ts using Zod
- [x] T017 [P] Create shared utilities in lib/utils.ts including cn function for Tailwind
- [x] T018 Create root layout in app/layout.tsx with React Query provider setup

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Authentication (Priority: P1) 🎯 MVP

**Goal**: Enable user login/logout functionality with session management and route protection

**Independent Test**: Can be fully tested by attempting login with valid credentials, verifying redirection to dashboard, testing invalid credentials show errors, and confirming unauthenticated users are redirected to login.

### Tests for User Story 1 (Minimal viable testing for critical auth flow) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T019 [P] [US1] Integration test for login flow in tests/integration/auth-flow.test.ts
- [x] T020 [P] [US1] Component test for LoginForm validation in tests/components/LoginForm.test.tsx

### Implementation for User Story 1

- [x] T021 [P] [US1] Create Button component in components/ui/Button.tsx
- [x] T022 [P] [US1] Create Input component in components/ui/Input.tsx
- [x] T023 [US1] Create LoginForm component in components/forms/LoginForm.tsx (updated for external API)
- [x] T024 [US1] Create login page in app/(auth)/login/page.tsx
- [x] T025 [US1] Remove authentication API routes (external API server handles auth)
- [x] T026 [P] [US1] Remove logout API route (handled by client-side auth manager)
- [x] T027 [P] [US1] Remove current user API route (external API server provides this)
- [x] T028 [US1] Create authenticated layout component in app/dashboard/layout.tsx (updated for client-side auth)
- [x] T029 [US1] Create basic dashboard page in app/dashboard/page.tsx

**Checkpoint**: ✅ **User Story 1 COMPLETE** - users can login, be redirected to dashboard, and logout

---

## Phase 4: User Story 2 - Active Stock Boost Management (Priority: P2)

**Goal**: Enable viewing, creating, and managing active stock boosts through tabbed interface with modal for adding new boosts

**Independent Test**: Can be tested by logging in, navigating to active boosts tab, viewing the list, adding a new boost through the modal, and performing actions on existing boosts.

### Tests for User Story 2 (Component testing for critical form validation) ⚠️

- [x] T030 [P] [US2] Integration test for boost management in tests/integration/boost-management.test.ts
- [x] T031 [P] [US2] Component test for AddBoostForm validation in tests/components/AddBoostForm.test.tsx

### Implementation for User Story 2

- [x] T032 [P] [US2] Create Modal component in components/ui/Modal.tsx
- [x] T033 [P] [US2] Create Tabs component in components/ui/Tabs.tsx
- [x] T034 [P] [US2] Create AddBoostForm component in components/forms/AddBoostForm.tsx
- [x] T035 [US2] Create ActiveBoostsTable component in components/tables/ActiveBoostsTable.tsx
- [x] T036 [US2] Connect to external boost CRUD API endpoints via lib/api/client.ts
- [x] T037 [P] [US2] Connect to external SKU search API endpoint via lib/api/client.ts
- [x] T038 [US2] Update dashboard page to include tabbed interface in app/dashboard/page.tsx
- [x] T039 [US2] Create React Query hooks for boost operations in lib/hooks/use-boosts.ts
- [x] T040 [P] [US2] Connect to external boost deactivation API endpoint via lib/api/client.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - complete active boost management functionality

---

## Phase 5: User Story 3 - Historical Boost Tracking (Priority: P3)

**Goal**: Enable viewing historical stock boosts that have been deactivated with deactivation reasons and timestamps

**Independent Test**: Can be tested by navigating to the historical boosts tab and viewing previously deactivated boosts, verifying that expired or manually disabled boosts appear correctly.

### Implementation for User Story 3

- [x] T041 [P] [US3] Create HistoricalBoostsTable component in components/tables/HistoricalBoostsTable.tsx
- [x] T042 [US3] Connect to external API for historical boost queries with pagination via lib/api/client.ts
- [x] T043 [US3] Update dashboard page to include historical boosts tab in app/dashboard/page.tsx
- [x] T044 [US3] Create React Query hooks for historical boost operations in lib/hooks/use-boosts.ts

**Checkpoint**: All user stories should now be independently functional with complete boost management capabilities

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T045 [P] Add loading states and error boundaries across all components
- [x] T046 [P] Implement optimistic updates for better user experience
- [x] T047 [P] Add proper TypeScript strict mode configuration
- [x] T048 [P] Configure Next.js production optimizations
- [x] T049 [P] Add comprehensive error handling and user feedback
- [x] T050 Run quickstart.md validation and fix any issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories (authentication handled by foundational middleware)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Tests (when included) MUST be written and FAIL before implementation
- UI components (atoms) before forms (molecules) 
- Forms and tables before API routes
- API routes before page integration
- Core implementation before optimizations
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- UI components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Integration test for login flow in tests/integration/auth-flow.test.ts"
Task: "Component test for LoginForm validation in tests/components/LoginForm.test.tsx"

# Launch all UI components for User Story 1 together:
Task: "Create Button component in components/ui/Button.tsx"
Task: "Create Input component in components/ui/Input.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2  
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow constitutional principles: component-first architecture, minimal viable testing, fast development cycle