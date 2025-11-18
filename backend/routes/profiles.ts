import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';

const CreateProfileSchema = z.object({
  name: z.string().min(1),
  githubUrl: z.string().optional(),
  language: z.string().min(1),
  framework: z.string().min(1),
  usesDB: z.boolean().default(false),
  usesDocker: z.boolean().default(false),
  deployTargets: z.array(z.string()).default([]),
});

export async function profileRoutes(server: FastifyInstance) {
  // Create a new repo profile
  server.post('/', async (request, reply) => {
    try {
      const data = CreateProfileSchema.parse(request.body);

      const profile = await prisma.repoProfile.create({
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

      return reply.code(201).send(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // Get all repo profiles
  server.get('/', async (request, reply) => {
    const profiles = await prisma.repoProfile.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        generationJobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return reply.send(profiles);
  });

  // Get a specific repo profile
  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const profile = await prisma.repoProfile.findUnique({
      where: { id },
      include: {
        generationJobs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      return reply.code(404).send({ error: 'Profile not found' });
    }

    return reply.send(profile);
  });

  // Delete a repo profile
  server.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await prisma.repoProfile.delete({
      where: { id },
    });

    return reply.code(204).send();
  });
}
