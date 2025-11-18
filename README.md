# 🚀 AI CI/CD Pipeline Wizard

An intelligent CI/CD pipeline configuration generator powered by AI. Generate production-ready GitHub Actions workflows, Railway configurations, Vercel configs, and Dockerfiles tailored to your project's stack.

## 🎯 Features

- **AI-Powered Generation**: Uses OpenAI to create customized CI/CD configurations
- **Multi-Platform Support**: Generate configs for GitHub Actions, Railway, and Vercel
- **Framework Agnostic**: Supports Next.js, NestJS, Express, Fastify, React, Vue.js, Angular, and more
- **Database Integration**: Handles PostgreSQL, MySQL, MongoDB, Redis setups
- **Docker Support**: Generates optimized multi-stage Dockerfiles
- **Interactive UI**: Simple wizard-style interface to configure your pipeline
- **Instant Preview**: View and copy generated configurations immediately

## 🏗️ Tech Stack

### Backend
- **Fastify**: High-performance Node.js web framework
- **TypeScript**: Type-safe development
- **Prisma**: Modern database ORM
- **OpenAI**: LLM for intelligent config generation
- **PostgreSQL**: Database for storing profiles and jobs

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe React components
- **Tailwind CSS**: Utility-first styling

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- OpenAI API key

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-ci-cd-pipeline-wizard.git
cd ai-ci-cd-pipeline-wizard
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cicd_wizard?schema=public"
OPENAI_API_KEY="sk-your-openai-api-key-here"
PORT=3001
```

### 4. Set Up the Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

### 5. Start the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📖 Usage Guide

### Using the Web Interface

1. **Navigate to http://localhost:3000**

2. **Fill out the Project Configuration:**
   - Project Name: Enter your project name
   - Framework: Select your framework (Next.js, NestJS, etc.)
   - Language: Choose your programming language
   - Database: Check if you use a database and select the type
   - Docker: Enable if you want Dockerfile generation
   - Deploy Targets: Select Railway and/or Vercel if needed
   - GitHub URL: Optionally provide your repository URL

3. **Click "Generate Pipeline Configs"**

4. **View Generated Files:**
   - Switch between file tabs
   - Copy individual files or download them
   - Use the configs in your project

### Example: Next.js + Prisma + Railway

Here's an example configuration for a Next.js app with Prisma and Railway deployment:

**Input:**
- Project Name: `my-nextjs-app`
- Framework: `Next.js`
- Language: `TypeScript`
- Uses Database: `✓` (PostgreSQL)
- Uses Docker: `✓`
- Deploy Targets: `Railway`

**Generated Files:**

#### `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run Prisma migrations
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        run: npx prisma migrate dev

      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        run: npm test

      - name: Build application
        run: npm run build

      - name: Build Docker image
        run: docker build -t my-nextjs-app .
```

#### `.github/workflows/deploy-railway.yml`
```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: railway up
```

#### `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### `Dockerfile`
```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

## 🔧 API Endpoints

### Repo Profiles

- `POST /api/profiles` - Create a new repo profile
- `GET /api/profiles` - Get all repo profiles
- `GET /api/profiles/:id` - Get a specific repo profile
- `DELETE /api/profiles/:id` - Delete a repo profile

### Generation

- `POST /api/generate` - Generate pipeline configurations
- `GET /api/generate/jobs/:id` - Get a generation job by ID
- `GET /api/generate/profiles/:profileId/jobs` - Get all jobs for a profile

### Example API Request

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-app",
    "framework": "Next.js",
    "language": "TypeScript",
    "usesDB": true,
    "database": "PostgreSQL",
    "usesDocker": true,
    "deployTargets": ["railway"]
  }'
```

## 📁 Project Structure

```
ai-ci-cd-pipeline-wizard/
├── backend/
│   ├── routes/
│   │   ├── profiles.ts      # Repo profile endpoints
│   │   └── generation.ts    # Generation endpoints
│   ├── services/
│   │   └── llm-generator.ts # OpenAI integration
│   ├── db.ts               # Prisma client
│   └── server.ts           # Fastify server
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
│   └── schema.prisma       # Database schema
├── generated/              # Generated pipeline files (gitignored)
├── package.json
└── README.md
```

## 🗄️ Database Schema

### RepoProfile
- `id`: Unique identifier
- `name`: Project name
- `githubUrl`: Optional GitHub repository URL
- `language`: Programming language
- `framework`: Framework being used
- `usesDB`: Boolean for database usage
- `usesDocker`: Boolean for Docker usage
- `deployTargetsJson`: JSON array of deployment targets

### PipelineTemplate
- `id`: Unique identifier
- `name`: Template name
- `provider`: Platform (github-actions, railway, vercel)
- `yamlText`: Template content
- `metaJson`: Additional metadata

### GenerationJob
- `id`: Unique identifier
- `repoProfileId`: Reference to repo profile
- `generatedFilesJson`: JSON object with generated files
- `createdAt`: Timestamp

## 🛠️ Development

### Database Management

```bash
# Open Prisma Studio (database GUI)
npm run prisma:studio

# Create a new migration
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Testing the API

Use the included example requests or tools like Postman/Insomnia to test the API endpoints.

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key for LLM generation | Yes |
| `PORT` | Backend server port (default: 3001) | No |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify DATABASE_URL in `.env` is correct
- Check that the database exists

### OpenAI API Errors
- Verify your OPENAI_API_KEY is valid
- Check you have sufficient API credits
- Ensure you have access to the GPT-4 model

### Port Conflicts
- If port 3000 or 3001 is in use, change the ports in the respective configs
- Frontend: `frontend/package.json` dev script
- Backend: `.env` PORT variable

## 🎓 Learn More

- [Fastify Documentation](https://www.fastify.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 📧 Support

If you have any questions or run into issues, please open an issue on GitHub.

---

Built with ❤️ using AI and modern web technologies
