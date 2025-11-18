#!/usr/bin/env tsx

import { Command } from 'commander';
import { LLMGenerator } from '../backend/services/llm-generator';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();
const program = new Command();

program
  .name('cicd-wizard')
  .description('AI-powered CI/CD pipeline configuration generator CLI')
  .version('1.0.0');

// Generate command
program
  .command('generate')
  .description('Generate CI/CD pipeline configurations')
  .requiredOption('-n, --name <name>', 'Project name')
  .requiredOption('-f, --framework <framework>', 'Framework (e.g., Next.js, NestJS)')
  .requiredOption('-l, --language <language>', 'Language (e.g., TypeScript, JavaScript)')
  .option('-d, --database <database>', 'Database type')
  .option('--use-db', 'Use database', false)
  .option('--use-docker', 'Use Docker', false)
  .option('-t, --targets <targets>', 'Deployment targets (comma-separated)', '')
  .option('-o, --output <dir>', 'Output directory', './generated')
  .action(async (options) => {
    console.log('🚀 Generating CI/CD configurations...\n');

    const generator = new LLMGenerator();
    const deployTargets = options.targets ? options.targets.split(',').map((t: string) => t.trim()) : [];

    try {
      const files = await generator.generatePipelines({
        framework: options.framework,
        language: options.language,
        usesDB: options.useDb,
        database: options.database,
        usesDocker: options.useDocker,
        deployTargets,
      });

      // Save files
      const outputDir = path.resolve(options.output);
      await fs.mkdir(outputDir, { recursive: true });

      for (const file of files) {
        const filePath = path.join(outputDir, file.path);
        const fileDir = path.dirname(filePath);
        await fs.mkdir(fileDir, { recursive: true });
        await fs.writeFile(filePath, file.content, 'utf-8');
        console.log(`✅ Generated: ${file.path}`);
      }

      console.log(`\n✨ Successfully generated ${files.length} files in ${outputDir}`);
    } catch (error) {
      console.error('❌ Generation failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

// List command
program
  .command('list')
  .description('List profiles and templates')
  .option('-t, --type <type>', 'Type to list (profiles|templates|presets)', 'profiles')
  .action(async (options) => {
    try {
      if (options.type === 'profiles') {
        const profiles = await prisma.repoProfile.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
        });

        console.log('\n📋 Recent Repo Profiles:\n');
        profiles.forEach((profile) => {
          console.log(`  ${profile.id}`);
          console.log(`    Name: ${profile.name}`);
          console.log(`    Framework: ${profile.framework} (${profile.language})`);
          console.log(`    Created: ${profile.createdAt.toISOString()}\n`);
        });
      } else if (options.type === 'templates') {
        const templates = await prisma.pipelineTemplate.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
        });

        console.log('\n📋 Pipeline Templates:\n');
        templates.forEach((template) => {
          console.log(`  ${template.id}`);
          console.log(`    Name: ${template.name}`);
          console.log(`    Provider: ${template.provider}`);
          console.log(`    Category: ${template.category}\n`);
        });
      } else if (options.type === 'presets') {
        const presets = await prisma.configPreset.findMany({
          take: 10,
          orderBy: { usageCount: 'desc' },
        });

        console.log('\n📋 Config Presets:\n');
        presets.forEach((preset) => {
          console.log(`  ${preset.id}`);
          console.log(`    Name: ${preset.name}`);
          console.log(`    Framework: ${preset.framework} (${preset.language})`);
          console.log(`    Used: ${preset.usageCount} times\n`);
        });
      }
    } catch (error) {
      console.error('❌ Failed to list:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

// Init command
program
  .command('init')
  .description('Initialize a new project with wizard')
  .action(async () => {
    console.log('🧙 CI/CD Wizard Init\n');
    console.log('Visit http://localhost:3000 to use the web interface');
    console.log('Or use: cicd-wizard generate --help for CLI usage\n');
  });

program.parse();
