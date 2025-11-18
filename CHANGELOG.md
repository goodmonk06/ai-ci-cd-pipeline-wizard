# Changelog

All notable changes to the AI CI/CD Pipeline Wizard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 3.5 (Planned)
- User authentication and authorization
- GitHub OAuth integration
- Template marketplace
- Template versioning system
- Organization/team support

### Phase 4 (Future)
- Cost estimation for cloud deployments
- Security scanning integration
- Multi-language support (i18n)
- VSCode extension
- Terraform/IaC generation

## [1.0.0] - 2025-01-18

### Added - Phase 3

**Domain Model Expansion:**
- New `ConfigPreset` model for quick-start configurations
- New `AuditLog` model for system action tracking
- Enhanced `RepoProfile` with `status` and `tags` fields
- Enhanced `PipelineTemplate` with description, category, version, downloads, rating
- Enhanced `GenerationJob` with status, error tracking, duration, and token usage metrics

**Infrastructure:**
- Structured JSON logging system (`backend/lib/logger.ts`)
- Metrics collection framework (`backend/lib/metrics.ts`)
- Event bus for domain events (`backend/lib/events.ts`)
- Audit logging system (`backend/lib/audit.ts`)

**Extension Points:**
- `INotificationAdapter` interface with in-memory and webhook implementations
- `IStorageAdapter` interface with local and in-memory implementations
- `IMetricsAdapter` for pluggable metrics collection
- Domain event types and event bus system

**API Endpoints:**
- `GET /api/presets` - List config presets
- `GET /api/presets/:id` - Get preset by ID
- `POST /api/presets` - Create new preset
- `POST /api/presets/:id/apply` - Apply preset to get configuration
- `GET /metrics` - Metrics endpoint for monitoring

**CLI Tool:**
- `cicd-wizard generate` - Generate configs from command line
- `cicd-wizard list` - List profiles, templates, and presets
- `cicd-wizard init` - Initialize command

**Testing:**
- Integration tests for profile routes
- Unit tests for error classes
- Unit tests for LLM generator
- Test helpers and utilities

**Documentation:**
- Phase 3 overview (`docs/PHASE3_OVERVIEW.md`)
- Architecture documentation (`docs/ARCHITECTURE.md`)
- Integration recipes (`docs/INTEGRATION_RECIPES.md`)
- Comprehensive README updates

**DevOps:**
- Request ID generation for tracing
- Request timing metrics via hooks
- Metrics collection on all API requests
- Enhanced error context and logging

### Added - Phase 2

**Core Features:**
- Full CRUD API for repo profiles
- AI-powered pipeline generation using OpenAI GPT-4
- Support for GitHub Actions, Railway, and Vercel platforms
- Dockerfile generation for containerized applications
- Next.js wizard interface for configuration
- File preview and download functionality

**API Endpoints:**
- `POST /api/profiles` - Create repo profile
- `GET /api/profiles` - List all profiles
- `GET /api/profiles/:id` - Get profile details
- `PUT /api/profiles/:id` - Update profile
- `DELETE /api/profiles/:id` - Delete profile
- `POST /api/generate` - Generate pipeline configurations
- `GET /api/generate/jobs/:id` - Get generation job
- `GET /api/generate/profiles/:profileId/jobs` - List jobs for profile
- `GET /health` - Health check endpoint

**Database:**
- Prisma ORM with PostgreSQL
- Initial migration with RepoProfile, PipelineTemplate, GenerationJob
- Database seeding script with sample data

**Infrastructure:**
- Docker support with Dockerfile
- Docker Compose for local development
- Centralized error handling with custom error classes
- Zod-based request validation
- TypeScript throughout the stack

**Testing:**
- Vitest setup and configuration
- Unit tests for core functionality
- Test helpers and factories

**DevOps:**
- Standardized npm scripts (dev, build, start, test, db:*)
- Docker Compose with auto-migrations
- Environment variable configuration
- .env.example template

**Documentation:**
- Comprehensive README
- API documentation
- Setup instructions
- Example workflows
- Troubleshooting guide

### Changed

- Updated Prisma schema with new indexes for performance
- Enhanced LLM generator with better error handling
- Improved frontend with loading states
- Better TypeScript types throughout

### Fixed

- Database migration consistency
- Error response formatting
- CORS configuration
- File path handling in generated configs

## [0.1.0] - 2025-01-18 (Initial Scaffold)

### Added

- Project scaffolding
- Basic file structure
- Initial commit

---

## Version History

- **v1.0.0** (2025-01-18): Phase 2 & 3 complete - Production-ready with extensions
- **v0.1.0** (2025-01-18): Initial scaffold

## Upgrade Guide

### From 0.1.0 to 1.0.0

1. **Database Migration:**
   ```bash
   npm run db:migrate
   ```

2. **Install New Dependencies:**
   ```bash
   npm install
   ```

3. **Update Environment Variables:**
   - No new required variables
   - Optional: Add `SENTRY_DSN` for error tracking
   - Optional: Add `SLACK_WEBHOOK_URL` for notifications

4. **Regenerate Prisma Client:**
   ```bash
   npm run db:generate
   ```

5. **Reseed Database (Optional):**
   ```bash
   npm run db:seed
   ```

## Breaking Changes

### v1.0.0

**Database Schema:**
- Added new required fields to existing tables with defaults
- New indexes may cause brief migration delays on large databases
- No breaking changes to existing API contracts

**API:**
- All existing endpoints remain compatible
- New optional fields in request bodies
- Response formats unchanged

## Deprecation Notices

None currently.

---

**Maintained by:** AI CI/CD Pipeline Wizard Team
**License:** MIT
