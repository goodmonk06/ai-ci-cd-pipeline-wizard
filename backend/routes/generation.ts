import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { LLMGenerator } from '../services/llm-generator';
import { NotFoundError, ValidationError } from '../lib/errors';

const GenerateSchema = z.object({
  repoProfileId: z.string().optional(),
  name: z.string().min(1),
  framework: z.string().min(1),
  language: z.string().min(1),
  usesDB: z.boolean().default(false),
  database: z.string().optional(),
  usesDocker: z.boolean().default(false),
  deployTargets: z.array(z.string()).default([]),
  githubUrl: z.string().optional(),
});

export async function generationRoutes(server: FastifyInstance) {
  const generator = new LLMGenerator();

  // Generate pipeline configurations
  server.post('/', async (request, reply) => {
    const result = GenerateSchema.safeParse(request.body);
    if (!result.success) {
      throw new ValidationError('Invalid generation request', result.error.errors);
    }

    const data = result.data;

    // Create or use existing repo profile
    let repoProfile;
    if (data.repoProfileId) {
      repoProfile = await prisma.repoProfile.findUnique({
        where: { id: data.repoProfileId },
      });
      if (!repoProfile) {
        throw new NotFoundError('Repo profile');
      }
    } else {
      // Create new profile
      repoProfile = await prisma.repoProfile.create({
        data: {
          name: data.name,
          githubUrl: data.githubUrl,
          language: data.language,
          framework: data.framework,
          usesDB: data.usesDB,
          usesDocker: data.usesDocker,
          deployTargetsJson: JSON.stringify(data.deployTargets),
        },
      });
    }

    // Generate pipeline files using LLM
    const files = await generator.generatePipelines({
      framework: data.framework,
      language: data.language,
      usesDB: data.usesDB,
      database: data.database,
      usesDocker: data.usesDocker,
      deployTargets: data.deployTargets,
    });

    // Save files to disk
    await generator.saveGeneratedFiles(repoProfile.id, files);

    // Create generation job record
    const job = await prisma.generationJob.create({
      data: {
        repoProfileId: repoProfile.id,
        generatedFilesJson: JSON.stringify(
          files.map((f) => ({ path: f.path, content: f.content }))
        ),
      },
      include: {
        repoProfile: true,
      },
    });

    return reply.code(201).send({
      job,
      files: files.map((f) => ({ path: f.path, content: f.content })),
    });
  });

  // Get generation job by ID
  server.get('/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const job = await prisma.generationJob.findUnique({
      where: { id },
      include: {
        repoProfile: true,
      },
    });

    if (!job) {
      throw new NotFoundError('Generation job');
    }

    return reply.send({
      job,
      files: JSON.parse(job.generatedFilesJson),
    });
  });

  // Get all generation jobs for a repo profile
  server.get('/profiles/:profileId/jobs', async (request, reply) => {
    const { profileId } = request.params as { profileId: string };

    const jobs = await prisma.generationJob.findMany({
      where: { repoProfileId: profileId },
      orderBy: { createdAt: 'desc' },
      include: {
        repoProfile: true,
      },
    });

    return reply.send(jobs);
  });
}
