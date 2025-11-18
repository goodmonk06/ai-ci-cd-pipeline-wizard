import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { NotFoundError, ValidationError } from '../lib/errors';

const CreateProfileSchema = z.object({
  name: z.string().min(1),
  githubUrl: z.string().optional(),
  language: z.string().min(1),
  framework: z.string().min(1),
  usesDB: z.boolean().default(false),
  usesDocker: z.boolean().default(false),
  deployTargets: z.array(z.string()).default([]),
});

const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  githubUrl: z.string().optional(),
  language: z.string().min(1).optional(),
  framework: z.string().min(1).optional(),
  usesDB: z.boolean().optional(),
  usesDocker: z.boolean().optional(),
  deployTargets: z.array(z.string()).optional(),
});

export async function profileRoutes(server: FastifyInstance) {
  // Create a new repo profile
  server.post('/', async (request, reply) => {
    const result = CreateProfileSchema.safeParse(request.body);
    if (!result.success) {
      throw new ValidationError('Invalid profile data', result.error.errors);
    }

    const data = result.data;
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
      throw new NotFoundError('Repo profile');
    }

    return reply.send(profile);
  });

  // Update a repo profile
  server.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = UpdateProfileSchema.safeParse(request.body);
    if (!result.success) {
      throw new ValidationError('Invalid profile data', result.error.errors);
    }

    const data = result.data;
    const updateData: any = {
      ...data,
    };

    if (data.deployTargets) {
      updateData.deployTargetsJson = JSON.stringify(data.deployTargets);
      delete updateData.deployTargets;
    }

    try {
      const profile = await prisma.repoProfile.update({
        where: { id },
        data: updateData,
      });

      return reply.send(profile);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Repo profile');
      }
      throw error;
    }
  });

  // Delete a repo profile
  server.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.repoProfile.delete({
        where: { id },
      });

      return reply.code(204).send();
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Repo profile');
      }
      throw error;
    }
  });
}
