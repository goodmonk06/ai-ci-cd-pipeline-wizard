# 🚀 AI CI/CD Pipeline Wizard

An intelligent CI/CD pipeline configuration generator powered by AI. Generate production-ready GitHub Actions workflows, Railway configurations, Vercel configs, and Dockerfiles tailored to your project's stack.

## 📖 Overview

The AI CI/CD Pipeline Wizard is a full-stack application that leverages OpenAI to automatically generate customized CI/CD configurations based on your project requirements. Simply specify your framework, language, database, and deployment targets, and the wizard will create optimized pipeline configurations ready for production use.

**Problem it solves:** Setting up CI/CD pipelines requires deep knowledge of various platforms and best practices. This tool democratizes that expertise by generating production-ready configurations in seconds.

## 🏗️ Tech Stack

### Backend
- **Fastify** - High-performance Node.js web framework
- **TypeScript** - Type-safe development
- **Prisma** - Modern database ORM with type safety
- **OpenAI GPT-4** - LLM for intelligent config generation
- **Zod** - Schema validation
- **PostgreSQL** - Relational database

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe React components
- **Tailwind CSS** - Utility-first styling
- **React Hooks** - State management

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Vitest** - Fast unit testing framework

## 🗂️ Domain Model

### Core Entities

**RepoProfile**
- Represents a repository/project configuration
- Fields: `id`, `name`, `githubUrl`, `language`, `framework`, `usesDB`, `usesDocker`, `deployTargetsJson`
- Relationships: One-to-many with `GenerationJob`

**PipelineTemplate**
- Reusable CI/CD templates
- Fields: `id`, `name`, `provider`, `yamlText`, `metaJson`
- Used for seeding common configurations

**GenerationJob**
- Tracks each pipeline generation request
- Fields: `id`, `repoProfileId`, `generatedFilesJson`, `createdAt`
- Stores the actual generated files and their content

### Entity Relationships

```
RepoProfile (1) ──< (many) GenerationJob
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 15+ database
- **OpenAI API key** (with GPT-4 access recommended)
- **Docker & Docker Compose** (optional, for containerized setup)

### Option 1: Docker Setup (Recommended)

1. **Clone and setup environment**

```bash
git clone <repository-url>
cd ai-ci-cd-pipeline-wizard

# Copy environment template
cp .env.example .env
```

2. **Configure environment variables**

Edit `.env` and add your OpenAI API key:

```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/cicd_wizard?schema=public"
OPENAI_API_KEY="sk-your-openai-api-key-here"
PORT=3001
```

3. **Start with Docker Compose**

```bash
# Build and start all services
npm run docker:up

# The backend will automatically run migrations on startup
```

4. **Seed the database**

```bash
# Run seed script
npm run db:seed
```

5. **Access the application**

- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

### Option 2: Local Development Setup

1. **Install dependencies**

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

2. **Setup database**

Create a PostgreSQL database and update `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cicd_wizard?schema=public"
OPENAI_API_KEY="sk-your-openai-api-key-here"
PORT=3001
```

3. **Run migrations and seed**

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

4. **Start development servers**

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
npm run dev:frontend

# Or run both concurrently
npm run dev:all
```

5. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🎯 Example Flow: Complete Vertical Slice

Here's a complete end-to-end flow demonstrating the core functionality:

### 1. Create a Repo Profile via API

```bash
curl -X POST http://localhost:3001/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Next.js App",
    "language": "TypeScript",
    "framework": "Next.js",
    "usesDB": true,
    "usesDocker": true,
    "deployTargets": ["railway", "vercel"]
  }'
```

Response:
```json
{
  "id": "clx1234...",
  "name": "My Next.js App",
  "language": "TypeScript",
  "framework": "Next.js",
  "usesDB": true,
  "usesDocker": true,
  "deployTargetsJson": "[\"railway\",\"vercel\"]",
  "createdAt": "2025-01-18T00:00:00.000Z",
  "updatedAt": "2025-01-18T00:00:00.000Z"
}
```

### 2. Generate Pipeline Configurations

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-nextjs-app",
    "framework": "Next.js",
    "language": "TypeScript",
    "usesDB": true,
    "database": "PostgreSQL",
    "usesDocker": true,
    "deployTargets": ["railway"]
  }'
```

This will:
- Create a new repo profile (or use existing if `repoProfileId` provided)
- Generate CI/CD configs using OpenAI
- Save files to `./generated/<profileId>/`
- Return generated file contents in response

### 3. List All Profiles

```bash
curl http://localhost:3001/api/profiles
```

### 4. Update a Profile

```bash
curl -X PUT http://localhost:3001/api/profiles/clx1234... \
  -H "Content-Type: application/json" \
  -d '{
    "usesDocker": false,
    "deployTargets": ["vercel"]
  }'
```

### 5. View Generation History

```bash
curl http://localhost:3001/api/generate/profiles/clx1234.../jobs
```

### 6. Use the Web Interface

Navigate to http://localhost:3000 and:

1. Fill out the project configuration form
2. Select framework, language, database options
3. Choose deployment targets
4. Click "Generate Pipeline Configs"
5. View generated files in the right panel
6. Copy or download individual files

## 📚 API Documentation

### Profiles Endpoints

- `POST /api/profiles` - Create a new repo profile
- `GET /api/profiles` - List all profiles
- `GET /api/profiles/:id` - Get profile by ID
- `PUT /api/profiles/:id` - Update a profile
- `DELETE /api/profiles/:id` - Delete a profile

### Generation Endpoints

- `POST /api/generate` - Generate pipeline configurations
- `GET /api/generate/jobs/:id` - Get generation job by ID
- `GET /api/generate/profiles/:profileId/jobs` - Get all jobs for a profile

### Health Check

- `GET /health` - Server health check

## 🧪 Testing

The project uses Vitest for testing.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

Example test structure:

```typescript
// backend/lib/errors.test.ts
describe('Error Classes', () => {
  it('should create a ValidationError with 400 status code', () => {
    const error = new ValidationError('Invalid input');
    expect(error.statusCode).toBe(400);
  });
});
```

## 📦 Available Scripts

### Development
- `npm run dev` - Start backend development server
- `npm run dev:frontend` - Start frontend development server
- `npm run dev:all` - Run both backend and frontend concurrently

### Building
- `npm run build` - Build backend for production
- `npm run build:frontend` - Build frontend for production

### Running
- `npm start` - Start production backend server
- `npm run start:frontend` - Start production frontend server

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes without migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio GUI
- `npm run db:reset` - Reset database (⚠️ destructive)

### Testing & Quality
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint TypeScript code
- `npm run typecheck` - Type check without building

### Docker
- `npm run docker:up` - Start services with docker-compose
- `npm run docker:down` - Stop docker-compose services
- `npm run docker:logs` - View docker logs
- `npm run docker:build` - Rebuild docker images

## 🌱 Seed Data

After running `npm run db:seed`, you'll have:

- **4 Repo Profiles** (Next.js, NestJS, Express, React)
- **2 Pipeline Templates** (GitHub Actions, Railway)
- **2 Generation Jobs** (with sample generated files)

Demo profiles:
- Next.js E-commerce App (TypeScript, DB, Docker, Railway + Vercel)
- NestJS API Service (TypeScript, DB, Docker, Railway)
- Express REST API (JavaScript, no DB, no Docker)
- React Dashboard (TypeScript, Docker, Vercel)

## 🏗️ Project Structure

```
ai-ci-cd-pipeline-wizard/
├── backend/
│   ├── lib/
│   │   ├── errors.ts           # Centralized error handling
│   │   ├── errors.test.ts      # Error tests
│   │   └── test-helpers.ts     # Test utilities
│   ├── routes/
│   │   ├── profiles.ts         # Profile CRUD endpoints
│   │   └── generation.ts       # Generation endpoints
│   ├── services/
│   │   ├── llm-generator.ts    # OpenAI integration
│   │   └── llm-generator.test.ts
│   ├── db.ts                   # Prisma client
│   └── server.ts               # Fastify server setup
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   ├── WizardForm.tsx
│   │   │   └── OutputDisplay.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── package.json
├── prisma/
│   ├── migrations/             # Database migrations
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed script
├── generated/                  # Generated configs (gitignored)
├── docker-compose.yml          # Multi-container setup
├── Dockerfile                  # Backend container
├── vitest.config.ts            # Test configuration
└── package.json
```

## 🔮 Future Extensions

### Phase 3+ Roadmap

1. **Enhanced Domain Model**
   - Add `ConfigTemplate` versioning
   - Support for custom template overrides
   - Template marketplace/sharing

2. **Additional Integrations**
   - GitLab CI support
   - CircleCI configuration
   - Jenkins pipeline generation
   - Terraform/IaC generation

3. **Advanced Features**
   - GitHub App integration for direct PR creation
   - Real-time pipeline validation
   - Cost estimation for cloud deployments
   - Security scanning integration (Snyk, Dependabot)

4. **Extension Points**
   - Plugin system for custom generators
   - Webhook notifications
   - Metrics and analytics dashboard
   - Template rating and feedback system

5. **Quality Enhancements**
   - E2E tests with Playwright
   - Performance benchmarking
   - Multi-language support (i18n)
   - Advanced logging and monitoring

6. **Developer Experience**
   - CLI tool for generation without UI
   - VSCode extension
   - Template preview before generation
   - Diff view for regeneration

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key | Yes | - |
| `PORT` | Backend server port | No | 3001 |

### Database Schema

The application uses Prisma for database management. To modify the schema:

1. Edit `prisma/schema.prisma`
2. Run `npm run db:migrate` to create a migration
3. Run `npm run db:generate` to update Prisma client

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps

# View database logs
docker compose logs db

# Reset database if needed
npm run db:reset
```

### OpenAI API Errors

- Verify your API key is valid
- Check you have sufficient credits
- Ensure you have access to GPT-4 (or modify code to use GPT-3.5)

### Port Conflicts

```bash
# If ports 3000/3001 are in use, change them in:
# - .env (PORT=3001)
# - frontend/package.json (dev script)
# - docker-compose.yml
```

### Migration Issues

```bash
# If migrations fail, try pushing schema directly (development only)
npm run db:push

# Or reset and remigrate
npm run db:reset
npm run db:migrate
```

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review troubleshooting section above

---

**Built with ❤️ using AI and modern web technologies**
