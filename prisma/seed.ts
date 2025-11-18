import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.generationJob.deleteMany();
  await prisma.pipelineTemplate.deleteMany();
  await prisma.repoProfile.deleteMany();

  // Create sample repo profiles
  const nextJsProfile = await prisma.repoProfile.create({
    data: {
      name: 'Next.js E-commerce App',
      githubUrl: 'https://github.com/example/nextjs-ecommerce',
      language: 'TypeScript',
      framework: 'Next.js',
      usesDB: true,
      usesDocker: true,
      deployTargetsJson: JSON.stringify(['vercel', 'railway']),
    },
  });

  const nestJsProfile = await prisma.repoProfile.create({
    data: {
      name: 'NestJS API Service',
      githubUrl: 'https://github.com/example/nestjs-api',
      language: 'TypeScript',
      framework: 'NestJS',
      usesDB: true,
      usesDocker: true,
      deployTargetsJson: JSON.stringify(['railway']),
    },
  });

  const expressProfile = await prisma.repoProfile.create({
    data: {
      name: 'Express REST API',
      githubUrl: 'https://github.com/example/express-api',
      language: 'JavaScript',
      framework: 'Express',
      usesDB: false,
      usesDocker: false,
      deployTargetsJson: JSON.stringify([]),
    },
  });

  const reactProfile = await prisma.repoProfile.create({
    data: {
      name: 'React Dashboard',
      language: 'TypeScript',
      framework: 'React',
      usesDB: false,
      usesDocker: true,
      deployTargetsJson: JSON.stringify(['vercel']),
    },
  });

  console.log('✅ Created 4 repo profiles');

  // Create pipeline templates
  const githubActionsTemplate = await prisma.pipelineTemplate.create({
    data: {
      name: 'Node.js CI',
      provider: 'github-actions',
      yamlText: `name: Node.js CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm run build --if-present
    - run: npm test`,
      metaJson: JSON.stringify({
        language: 'Node.js',
        category: 'CI',
      }),
    },
  });

  const railwayTemplate = await prisma.pipelineTemplate.create({
    data: {
      name: 'Railway Deployment',
      provider: 'railway',
      yamlText: `{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}`,
      metaJson: JSON.stringify({
        platform: 'Railway',
        category: 'Deployment',
      }),
    },
  });

  console.log('✅ Created 2 pipeline templates');

  // Create sample generation jobs
  const job1 = await prisma.generationJob.create({
    data: {
      repoProfileId: nextJsProfile.id,
      generatedFilesJson: JSON.stringify([
        {
          path: '.github/workflows/ci.yml',
          content: githubActionsTemplate.yamlText,
        },
        {
          path: 'railway.json',
          content: railwayTemplate.yamlText,
        },
      ]),
    },
  });

  const job2 = await prisma.generationJob.create({
    data: {
      repoProfileId: nestJsProfile.id,
      generatedFilesJson: JSON.stringify([
        {
          path: '.github/workflows/ci.yml',
          content: githubActionsTemplate.yamlText,
        },
      ]),
    },
  });

  console.log('✅ Created 2 generation jobs');

  console.log('\n📊 Seed Summary:');
  console.log(`   - ${4} Repo Profiles`);
  console.log(`   - ${2} Pipeline Templates`);
  console.log(`   - ${2} Generation Jobs`);
  console.log('\n✨ Seeding completed successfully!\n');

  console.log('🔍 Sample Data:');
  console.log(`   Profile 1: ${nextJsProfile.name} (${nextJsProfile.id})`);
  console.log(`   Profile 2: ${nestJsProfile.name} (${nestJsProfile.id})`);
  console.log(`   Job 1: ${job1.id}`);
  console.log(`   Job 2: ${job2.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
