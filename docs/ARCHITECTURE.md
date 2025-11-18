# Architecture Documentation

## System Overview

The AI CI/CD Pipeline Wizard is built as a modern, layered full-stack application with clear separation of concerns and extensibility as a core principle.

```
┌─────────────────────────────────────────────┐
│           Frontend (Next.js)                │
│   - Wizard UI                               │
│   - File Display & Download                 │
└─────────────────┬───────────────────────────┘
                  │ HTTP/REST
┌─────────────────▼───────────────────────────┐
│        Backend API (Fastify)                │
│   ┌─────────────────────────────────────┐   │
│   │      Routes Layer                   │   │
│   │  - Profiles  - Generation           │   │
│   │  - Presets   - Templates            │   │
│   └────────┬────────────────────────────┘   │
│            │                                 │
│   ┌────────▼────────────────────────────┐   │
│   │   Service Layer                     │   │
│   │  - LLM Generator                    │   │
│   │  - Audit Logger                     │   │
│   │  - Event Bus                        │   │
│   └────────┬────────────────────────────┘   │
│            │                                 │
│   ┌────────▼────────────────────────────┐   │
│   │   Adapter Layer (Extension Points) │   │
│   │  - Storage    - Notification        │   │
│   │  - Metrics    - VCS                 │   │
│   └────────┬────────────────────────────┘   │
│            │                                 │
│   ┌────────▼────────────────────────────┐   │
│   │   Data Layer (Prisma ORM)           │   │
│   └────────┬────────────────────────────┘   │
└────────────┼───────────────────────────────┘
             │
┌────────────▼───────────────────────────────┐
│      Database (PostgreSQL)                 │
│   - RepoProfile    - GenerationJob          │
│   - PipelineTemplate - ConfigPreset         │
│   - AuditLog                                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│      External Services                      │
│   - OpenAI API (GPT-4)                      │
│   - GitHub API (optional)                   │
└─────────────────────────────────────────────┘
```

## Layer Responsibilities

### Frontend Layer

**Technology:** Next.js 14 with App Router, TypeScript, Tailwind CSS

**Responsibilities:**
- User interface for configuration input
- Display generated pipeline files
- Copy/download functionality
- Client-side validation

**Key Files:**
- `frontend/app/page.tsx` - Main wizard page
- `frontend/app/components/WizardForm.tsx` - Configuration form
- `frontend/app/components/OutputDisplay.tsx` - File viewer

### API Layer (Routes)

**Technology:** Fastify, TypeScript

**Responsibilities:**
- HTTP request handling
- Input validation (Zod schemas)
- Route-level error handling
- Request/response transformation

**Key Files:**
- `backend/routes/profiles.ts` - Profile CRUD
- `backend/routes/generation.ts` - Pipeline generation
- `backend/routes/presets.ts` - Config presets
- `backend/server.ts` - Server setup and middleware

**Middleware:**
- Error handler
- Request timing metrics
- CORS configuration
- Request ID generation

### Service Layer

**Responsibilities:**
- Business logic orchestration
- External service integration
- Complex operations spanning multiple entities

**Key Services:**
- `LLMGenerator` - OpenAI integration and prompt management
- `AuditLogger` - System action logging
- `EventBus` - Domain event publishing

**Patterns Used:**
- Dependency injection via constructor
- Interface-based abstractions
- Event-driven communication

### Adapter Layer (Extension Points)

**Purpose:** Provide pluggable implementations for cross-cutting concerns

**Interfaces:**

```typescript
INotificationAdapter    // Send notifications (email, Slack, webhooks)
IStorageAdapter         // Store files (local, S3, GCS)
IMetricsAdapter         // Collect metrics (in-memory, Prometheus)
IVCSAdapter            // VCS operations (GitHub, GitLab, Bitbucket)
```

**Default Implementations:**
- `InMemoryNotificationAdapter` - Console logging
- `LocalStorageAdapter` - Filesystem storage
- `InMemoryMetrics` - Local metrics collection

**Extension Strategy:**
Implementations can be swapped by:
1. Creating a new class implementing the interface
2. Exporting it as the default adapter
3. No changes required in calling code

### Data Layer

**Technology:** Prisma ORM with PostgreSQL

**Responsibilities:**
- Database schema management
- Type-safe database queries
- Relationship handling
- Migrations

**Key Models:**
- `RepoProfile` - Project configurations
- `PipelineTemplate` - Reusable CI/CD templates
- `GenerationJob` - Generation history and results
- `ConfigPreset` - Quick-start configurations
- `AuditLog` - System audit trail

**Patterns:**
- Single Prisma Client instance
- Soft deletes via cascade
- JSON fields for flexible metadata
- Indexed fields for query performance

## Core Flows

### 1. Pipeline Generation Flow

```
User Input (Form/CLI)
    │
    ▼
POST /api/generate
    │
    ├─> Validate input (Zod)
    │
    ├─> Create/Fetch RepoProfile
    │
    ├─> Call LLMGenerator.generatePipelines()
    │       │
    │       ├─> Generate GitHub Actions workflow
    │       ├─> Generate Railway config (if requested)
    │       ├─> Generate Vercel config (if requested)
    │       └─> Generate Dockerfile (if requested)
    │
    ├─> Save files via StorageAdapter
    │
    ├─> Create GenerationJob record
    │
    ├─> Emit 'generation.completed' event
    │
    └─> Return generated files to user
```

### 2. Profile CRUD Flow

```
Create Profile:
  POST /api/profiles
    → Validate → Create in DB → Emit 'profile.created' → Return

Read Profiles:
  GET /api/profiles
    → Query DB → Include latest GenerationJob → Return list

Update Profile:
  PUT /api/profiles/:id
    → Validate → Update in DB → Emit 'profile.updated' → Return

Delete Profile:
  DELETE /api/profiles/:id
    → Delete from DB (cascade to jobs) → Emit 'profile.deleted' → 204
```

### 3. Preset Application Flow

```
Apply Preset:
  POST /api/presets/:id/apply
    → Fetch preset
    → Increment usage count
    → Parse config JSON
    → Return preset + config for form population
```

## Cross-Cutting Concerns

### Error Handling

**Strategy:** Centralized error handler with custom error classes

```typescript
AppError (base)
  ├─ ValidationError (400)
  ├─ NotFoundError (404)
  └─ ConflictError (409)
```

All errors are caught by `errorHandler` and converted to consistent JSON responses.

### Logging

**Implementation:** Structured JSON logging via `logger.ts`

**Log Levels:**
- `debug` - Development only
- `info` - Normal operations
- `warn` - Recoverable issues
- `error` - Failures with stack traces

**Context:**
- Request ID
- Timestamp
- Additional context object

### Metrics

**Implementation:** In-memory metrics collection

**Metric Types:**
- Counter - Monotonic increments
- Gauge - Up/down values
- Histogram - Timing measurements

**Key Metrics:**
- API request duration
- Generation success/failure rates
- OpenAI token usage
- Database query counts

### Event System

**Pattern:** Pub/Sub event bus

**Events:**
- `profile.created/updated/deleted`
- `generation.started/completed/failed`
- `template.created/updated`

**Usage:** Decouple side effects (notifications, audit logs) from main flow

### Audit Logging

**Purpose:** Compliance and debugging

**Captured:**
- Action type
- Entity type and ID
- Metadata (changes, context)
- IP address and user agent
- Timestamp

## Database Schema Design

### Entity Relationships

```
RepoProfile (1) ──< (many) GenerationJob

All entities are independent (no foreign keys from templates/presets)
```

### Indexing Strategy

**Indexed Fields:**
- `status` - For filtering active/archived
- `framework` - For preset matching
- `createdAt` - For chronological queries
- `repoProfileId` - For job lookups

**Why:** These fields are used in WHERE clauses and ORDER BY statements frequently.

### JSON Fields

Used for flexible data that doesn't need querying:
- `deployTargetsJson` - Array of deployment platforms
- `metaJson` - Template metadata
- `configJson` - Preset configurations
- `generatedFilesJson` - Complete file outputs

**Advantage:** Schema flexibility without migrations

## Security Considerations

### Current State (Phase 2/3)

- **No authentication** - Open API
- **No rate limiting** - Vulnerable to abuse
- **OpenAI key** - Server-side only (secure)
- **CORS** - Enabled for all origins

### Future Enhancements (Phase 4+)

- JWT-based authentication
- API key per user/org
- Rate limiting per IP/user
- Input sanitization for code injection
- Secrets scanning in generated configs

## Scalability Considerations

### Current Architecture

**Suitable for:** 100-1000 concurrent users

**Bottlenecks:**
- OpenAI API rate limits
- Single Postgres instance
- In-memory metrics (lost on restart)

### Scaling Strategy (Future)

**Horizontal Scaling:**
- Stateless backend - can run multiple instances
- Load balancer in front
- Shared Postgres (or read replicas)

**Async Processing:**
- Queue system for generation jobs
- Worker pool for OpenAI calls
- Webhooks for completion notifications

**Caching:**
- Redis for frequently accessed profiles/templates
- CDN for frontend assets
- Generated file caching by hash

## Testing Strategy

### Unit Tests

**Scope:** Individual functions and classes

**Examples:**
- Error class instantiation
- Validation schemas
- LLM response parsing

### Integration Tests

**Scope:** Multi-layer interactions

**Examples:**
- API endpoint → Service → Database
- Full profile CRUD flow
- Generation job creation

### E2E Tests (Future)

**Scope:** User workflows

**Examples:**
- Complete wizard flow
- CLI generation command
- File download

## Deployment Architecture

### Docker Compose (Development)

```yaml
services:
  db: PostgreSQL
  backend: Fastify API
  frontend: Next.js (optional)
```

### Production (Recommended)

**Backend:**
- Container platform (Railway, Fly.io, Render)
- Environment variables for secrets
- Managed Postgres database

**Frontend:**
- Vercel or Netlify
- Static build with API_URL env var

**Monitoring:**
- Log aggregation (Logtail, Papertrail)
- Error tracking (Sentry)
- Uptime monitoring (UptimeRobot)

## Development Workflow

1. **Local Development**
   ```bash
   docker compose up  # Start DB
   npm run dev        # Start backend
   npm run dev:frontend  # Start frontend
   ```

2. **Make Changes**
   - Edit code
   - Add tests
   - Update documentation

3. **Test**
   ```bash
   npm test
   npm run typecheck
   ```

4. **Database Changes**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: description"
   git push
   ```

## Technology Choices Rationale

### Why Fastify?
- Fastest Node.js framework
- TypeScript-first
- Plugin ecosystem
- Schema-based validation

### Why Prisma?
- Type-safe database access
- Schema-first approach
- Excellent migration system
- Auto-generated client

### Why Next.js?
- React + TypeScript
- File-based routing
- Server components
- Easy deployment (Vercel)

### Why PostgreSQL?
- Robust relational database
- JSON support for flexibility
- Excellent Prisma support
- Widely available hosting

### Why OpenAI?
- State-of-the-art LLM
- Excellent code generation
- Reliable API
- Reasonable pricing

---

**Version:** 1.0 (Phase 3)
**Last Updated:** 2025-01-18
**Next Review:** After Phase 3.5 completion
