import { PrismaClient } from '@prisma/client';

export const prismaTest = new PrismaClient();

export async function cleanDatabase() {
  await prismaTest.generationJob.deleteMany();
  await prismaTest.repoProfile.deleteMany();
  await prismaTest.pipelineTemplate.deleteMany();
}

export function createMockRepoProfile(overrides = {}) {
  return {
    name: 'Test Project',
    language: 'TypeScript',
    framework: 'Next.js',
    usesDB: true,
    usesDocker: false,
    deployTargetsJson: JSON.stringify(['railway']),
    ...overrides,
  };
}

export function createMockGenerationRequest(overrides = {}) {
  return {
    name: 'test-app',
    framework: 'Next.js',
    language: 'TypeScript',
    usesDB: true,
    database: 'PostgreSQL',
    usesDocker: true,
    deployTargets: ['railway'],
    ...overrides,
  };
}
