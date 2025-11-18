import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GenerationParams {
  framework: string;
  language: string;
  usesDB: boolean;
  database?: string;
  usesDocker: boolean;
  deployTargets: string[];
}

interface GeneratedFile {
  path: string;
  content: string;
}

export class LLMGenerator {
  async generatePipelines(params: GenerationParams): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate GitHub Actions workflow
    const githubActionsYaml = await this.generateGitHubActions(params);
    files.push({
      path: '.github/workflows/ci.yml',
      content: githubActionsYaml,
    });

    // Generate Railway config if requested
    if (params.deployTargets.includes('railway')) {
      const railwayConfig = await this.generateRailwayConfig(params);
      files.push({
        path: 'railway.json',
        content: railwayConfig,
      });

      // Add Railway deployment workflow
      const railwayWorkflow = await this.generateRailwayWorkflow(params);
      files.push({
        path: '.github/workflows/deploy-railway.yml',
        content: railwayWorkflow,
      });
    }

    // Generate Vercel config if requested
    if (params.deployTargets.includes('vercel')) {
      const vercelConfig = await this.generateVercelConfig(params);
      files.push({
        path: 'vercel.json',
        content: vercelConfig,
      });
    }

    // Generate Dockerfile if using Docker
    if (params.usesDocker) {
      const dockerfile = await this.generateDockerfile(params);
      files.push({
        path: 'Dockerfile',
        content: dockerfile,
      });
    }

    return files;
  }

  private async generateGitHubActions(params: GenerationParams): Promise<string> {
    const prompt = `Generate a GitHub Actions CI/CD workflow YAML file for a ${params.framework} application written in ${params.language}.

Requirements:
- Run on push to main and pull requests
- Install dependencies
- Run linting (if applicable)
- Run tests
- Build the application
${params.usesDB ? `- Set up ${params.database || 'PostgreSQL'} service for tests` : ''}
${params.usesDocker ? '- Build and test Docker image' : ''}

Return ONLY the valid YAML content without any markdown formatting or explanations.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert DevOps engineer. Generate clean, production-ready CI/CD configuration files. Return only valid YAML without markdown code blocks.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    return this.cleanYaml(completion.choices[0].message.content || '');
  }

  private async generateRailwayWorkflow(params: GenerationParams): Promise<string> {
    const prompt = `Generate a GitHub Actions workflow YAML file that deploys a ${params.framework} application to Railway.

Requirements:
- Trigger on push to main branch
- Use Railway CLI to deploy
- Use secrets for Railway tokens
${params.usesDB ? `- Handle database migrations for ${params.database || 'PostgreSQL'}` : ''}

Return ONLY the valid YAML content without any markdown formatting or explanations.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert DevOps engineer. Generate clean, production-ready CI/CD configuration files. Return only valid YAML without markdown code blocks.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    return this.cleanYaml(completion.choices[0].message.content || '');
  }

  private async generateRailwayConfig(params: GenerationParams): Promise<string> {
    const config = {
      $schema: 'https://railway.app/railway.schema.json',
      build: {
        builder: 'NIXPACKS',
      },
      deploy: {
        restartPolicyType: 'ON_FAILURE',
        restartPolicyMaxRetries: 10,
      },
    };

    return JSON.stringify(config, null, 2);
  }

  private async generateVercelConfig(params: GenerationParams): Promise<string> {
    const config: any = {
      version: 2,
    };

    if (params.framework === 'Next.js') {
      config.builds = [
        {
          src: 'package.json',
          use: '@vercel/next',
        },
      ];
    } else {
      config.builds = [
        {
          src: 'package.json',
          use: '@vercel/node',
        },
      ];
    }

    return JSON.stringify(config, null, 2);
  }

  private async generateDockerfile(params: GenerationParams): Promise<string> {
    const prompt = `Generate a production-ready Dockerfile for a ${params.framework} application written in ${params.language}.

Requirements:
- Multi-stage build for optimization
- Use official Node.js base image
- Install dependencies efficiently
- Copy application code
- Expose appropriate port
- Use non-root user for security
- Optimize for layer caching

Return ONLY the Dockerfile content without any markdown formatting or explanations.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert DevOps engineer. Generate clean, production-ready Dockerfiles. Return only the Dockerfile content without markdown code blocks.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    return this.cleanDockerfile(completion.choices[0].message.content || '');
  }

  private cleanYaml(content: string): string {
    // Remove markdown code blocks if present
    let cleaned = content.replace(/```ya?ml\n?/g, '').replace(/```\n?/g, '');
    return cleaned.trim();
  }

  private cleanDockerfile(content: string): string {
    // Remove markdown code blocks if present
    let cleaned = content.replace(/```dockerfile\n?/g, '').replace(/```\n?/g, '');
    return cleaned.trim();
  }

  async saveGeneratedFiles(
    repoProfileId: string,
    files: GeneratedFile[]
  ): Promise<void> {
    const outputDir = path.join(process.cwd(), 'generated', repoProfileId);
    await fs.mkdir(outputDir, { recursive: true });

    for (const file of files) {
      const filePath = path.join(outputDir, file.path);
      const fileDir = path.dirname(filePath);

      await fs.mkdir(fileDir, { recursive: true });
      await fs.writeFile(filePath, file.content, 'utf-8');
    }
  }
}
