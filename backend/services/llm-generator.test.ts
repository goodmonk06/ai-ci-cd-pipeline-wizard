import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMGenerator } from './llm-generator';
import * as fs from 'fs/promises';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'name: CI Workflow\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest',
                },
              },
            ],
          }),
        },
      },
    })),
  };
});

// Mock fs
vi.mock('fs/promises');

describe('LLMGenerator', () => {
  let generator: LLMGenerator;

  beforeEach(() => {
    generator = new LLMGenerator();
    vi.clearAllMocks();
  });

  describe('generatePipelines', () => {
    it('should generate GitHub Actions workflow', async () => {
      const params = {
        framework: 'Next.js',
        language: 'TypeScript',
        usesDB: false,
        usesDocker: false,
        deployTargets: [],
      };

      const files = await generator.generatePipelines(params);

      expect(files).toHaveLength(1);
      expect(files[0].path).toBe('.github/workflows/ci.yml');
      expect(files[0].content).toContain('name: CI Workflow');
    });

    it('should generate Railway config when railway is in deploy targets', async () => {
      const params = {
        framework: 'Next.js',
        language: 'TypeScript',
        usesDB: false,
        usesDocker: false,
        deployTargets: ['railway'],
      };

      const files = await generator.generatePipelines(params);

      const railwayConfig = files.find((f) => f.path === 'railway.json');
      const railwayWorkflow = files.find((f) => f.path === '.github/workflows/deploy-railway.yml');

      expect(railwayConfig).toBeDefined();
      expect(railwayWorkflow).toBeDefined();
    });

    it('should generate Vercel config when vercel is in deploy targets', async () => {
      const params = {
        framework: 'Next.js',
        language: 'TypeScript',
        usesDB: false,
        usesDocker: false,
        deployTargets: ['vercel'],
      };

      const files = await generator.generatePipelines(params);

      const vercelConfig = files.find((f) => f.path === 'vercel.json');

      expect(vercelConfig).toBeDefined();
      expect(vercelConfig?.content).toContain('@vercel/next');
    });

    it('should generate Dockerfile when usesDocker is true', async () => {
      const params = {
        framework: 'Next.js',
        language: 'TypeScript',
        usesDB: false,
        usesDocker: true,
        deployTargets: [],
      };

      const files = await generator.generatePipelines(params);

      const dockerfile = files.find((f) => f.path === 'Dockerfile');

      expect(dockerfile).toBeDefined();
    });
  });

  describe('saveGeneratedFiles', () => {
    it('should create directories and save files', async () => {
      const files = [
        { path: '.github/workflows/ci.yml', content: 'workflow content' },
        { path: 'railway.json', content: '{}' },
      ];

      await generator.saveGeneratedFiles('test-profile-id', files);

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledTimes(2);
    });
  });
});
