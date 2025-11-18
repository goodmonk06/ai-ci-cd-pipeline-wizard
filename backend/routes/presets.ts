import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { NotFoundError, ValidationError } from '../lib/errors';

const CreatePresetSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  framework: z.string().min(1),
  language: z.string().min(1),
  config: z.object({
    usesDB: z.boolean().optional(),
    database: z.string().optional(),
    usesDocker: z.boolean().optional(),
    deployTargets: z.array(z.string()).optional(),
  }),
});

export async function presetRoutes(server: FastifyInstance) {
  // Get all presets
  server.get('/', async (request, reply) => {
    const { framework } = request.query as { framework?: string };

    const presets = await prisma.configPreset.findMany({
      where: framework ? { framework } : undefined,
      orderBy: [{ isBuiltIn: 'desc' }, { usageCount: 'desc' }],
    });

    return reply.send(presets);
  });

  // Get preset by ID
  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const preset = await prisma.configPreset.findUnique({
      where: { id },
    });

    if (!preset) {
      throw new NotFoundError('Config preset');
    }

    return reply.send(preset);
  });

  // Create preset
  server.post('/', async (request, reply) => {
    const result = CreatePresetSchema.safeParse(request.body);
    if (!result.success) {
      throw new ValidationError('Invalid preset data', result.error.errors);
    }

    const data = result.data;
    const preset = await prisma.configPreset.create({
      data: {
        name: data.name,
        description: data.description,
        framework: data.framework,
        language: data.language,
        configJson: JSON.stringify(data.config),
      },
    });

    return reply.code(201).send(preset);
  });

  // Apply preset (increment usage count and return config)
  server.post('/:id/apply', async (request, reply) => {
    const { id } = request.params as { id: string };

    const preset = await prisma.configPreset.findUnique({
      where: { id },
    });

    if (!preset) {
      throw new NotFoundError('Config preset');
    }

    // Increment usage count
    await prisma.configPreset.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    const config = JSON.parse(preset.configJson);

    return reply.send({
      preset,
      config,
    });
  });
}
