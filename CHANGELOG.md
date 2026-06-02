---
file: CHANGELOG.md
module: Project Changelog
status: Active
related: [README.md, docs/TODO_PRODUCTION.md, docs/MODERNIZATION_ROADMAP.md, AI_INSTRUCTIONS.md]
---

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses semantic versioning where product releases are explicitly tagged. Documentation audit versions are recorded as operational milestones.

## [Unreleased]

### Added

- Pending implementation items from `docs/TODO_PRODUCTION.md`.
- Strategic modernization plan from `docs/MODERNIZATION_ROADMAP.md`.
- Inventory classification for extra `.txt` and `.csv` artifacts in `docs/INVENTORY_DATABASE_USAGE.md`.
- Wireframe-derived product scope and authenticated civic panel evidence in `docs/BUSINESS_DOMAIN.md`.
- Archive recommendations for obsolete temporary artifacts in `docs/GAP_ANALYSIS.md`.

### Changed

- Updated ETL documentation assumptions to recognize root `requirements.txt` as the Python dependency reference while keeping ETL orchestration as an open gap.

## [4.0.0-audit] - 2026-06-02

### Added

- Initialized the v4.0 functional and technical macro audit knowledge base.
- Added canonical MVP identification in `docs/MVP_REAL_IDENTIFICADO.md`.
- Added production readiness assessment in `docs/PRODUCAO_READINESS.md`.
- Added route inventory in `docs/INVENTORY_ROUTES.md`.
- Added feature inventory in `docs/INVENTORY_FEATURES.md`.
- Added UI placeholder and visual debt report in `docs/PLACEHOLDER_REPORT.md`.
- Added consolidated gap analysis in `docs/GAP_ANALYSIS.md`.
- Added business domain model in `docs/BUSINESS_DOMAIN.md`.
- Added database schema map and structural audit in `docs/DATABASE.md`.
- Added real database usage inventory in `docs/INVENTORY_DATABASE_USAGE.md`.
- Added Logto authentication/RBAC map in `docs/AUTH.md`.
- Added API reference for the 18 mapped HTTP endpoints in `docs/API.md`.
- Added API consumption audit in `docs/INVENTORY_API_CONSUMPTION.md`.
- Added architecture document with Mermaid diagrams in `docs/ARCHITECTURE.md`.
- Added environment variable audit in `docs/ENVIRONMENT.md`.
- Added external integrations manual in `docs/INTEGRATIONS.md`.
- Added deployment and operations guide in `docs/DEPLOYMENT.md`.
- Added security audit and Resend P0 rotation plan in `docs/SECURITY.md`.
- Added visual governance and page-by-page UI migration matrix in `docs/DESIGN.md`.
- Added dependency audit for React 19 and Next.js 16 in `docs/DEPENDENCIES.md`.
- Added consolidated production backlog in `docs/TODO_PRODUCTION.md`.
- Added modernization roadmap in `docs/MODERNIZATION_ROADMAP.md`.
- Added future-agent governance guide in `AI_INSTRUCTIONS.md`.

### Changed

- Rewrote `README.md` as the current project entry point for Next.js 16, React 19, Logto, PostgreSQL/Supabase, InfinitePay, OpenAI and ETL.
- Reclassified Stripe references as historical/legacy where they appeared in older project context.
- Reclassified Logto as the active identity provider in the current runtime.
- Reclassified InfinitePay as the active payment provider, with webhook persistence still incomplete.
- Reframed Supabase as PostgreSQL/Supabase data infrastructure rather than active Supabase Auth runtime.
- Consolidated old readiness, roadmap, security, design and dependency notes into current operational documents.

### Security

- Confirmed an apparent real `RESEND_API_KEY` in `docs/meuspoliticos_master.md` without reproducing the value in new documentation.
- Recorded affected Git history for nominal `RESEND_API_KEY` occurrences in `docs/SECURITY.md`.
- Added urgent P0 rotation and remediation plan for the Resend key.
- Documented lack of InfinitePay webhook persistence and lack of identified webhook authenticity validation.
- Documented that no `NEXT_PUBLIC_*` private key exposure was identified in the mapped runtime.

### Fixed

- Removed misleading documentation stance that treated Stripe as an active payment runtime.
- Removed outdated documentation stance that treated Supabase Auth as the active authentication runtime.
- Replaced fragmented production TODOs with a P0-P3 backlog tied to the real MVP.

### Known Issues

- Resend exposed key must be revoked and removed from the legacy document before any public go-live.
- InfinitePay webhook still requires persistence, idempotency and authenticity validation.
- Admin ETL trigger currently records intent but does not execute Python ETL jobs.
- Feed civic loop is not fully connected to real event data.
- DB pre-flight was intentionally not executed against remote/dev-unknown host.
- Build, lint and browser QA were not executed during the documentation-only macro audit.

## Historical Notes Before v4.0

### Added

- Initial Next.js application structure.
- Civic public site pages.
- Political profile pages, dashboard components and ETL scripts.
- PostgreSQL/Supabase schema and migrations.
- Logto migration work.
- InfinitePay payment flow.
- OpenAI-powered interpretive summaries and ETL simplification.

### Changed

- Project moved from older documented assumptions toward the current stack: Next.js 16, React 19, Logto, PostgreSQL/Supabase, InfinitePay and OpenAI.

### Removed

- Stripe is no longer treated as active runtime in the v4.0 documentation base.
