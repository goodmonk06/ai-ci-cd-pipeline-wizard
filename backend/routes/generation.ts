import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { LLMGenerator } from '../services/llm-generator';

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
    try {
      const data = GenerateSchema.parse(request.body);

      // Create or use existing repo profile
      let repoProfile;
      if (data.repoProfileId) {
        repoProfile = await prisma.repoProfile.findUnique({
          where: { id: data.repoProfileId },
        });
        if (!repoProfile) {
          return reply.code(404).send({ error: 'Repo profile not found' });
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      server.log.error(error);
      return reply.code(500).send({ error: 'Failed to generate pipeline configurations' });
    }
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
      return reply.code(404).send({ error: 'Generation job not found' });
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
