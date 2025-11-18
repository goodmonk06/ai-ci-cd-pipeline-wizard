import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { profileRoutes } from './profiles';
import { prisma } from '../db';
import { errorHandler } from '../lib/errors';

describe('Profile Routes Integration', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = Fastify();
    server.setErrorHandler(errorHandler);
    await server.register(profileRoutes, { prefix: '/api/profiles' });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.generationJob.deleteMany({});
    await prisma.repoProfile.deleteMany({});
  });

  describe('POST /api/profiles', () => {
    it('should create a new repo profile', async () => {
      const payload = {
        name: 'Test Project',
        framework: 'Next.js',
        language: 'TypeScript',
        usesDB: true,
        usesDocker: false,
        deployTargets: ['vercel'],
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/profiles',
        payload,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.name).toBe(payload.name);
      expect(body.framework).toBe(payload.framework);
      expect(body.id).toBeDefined();
    });

    it('should return validation error for invalid data', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/profiles',
        payload: {
          name: '',
          // Missing required fields
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('ValidationError');
    });
  });

  describe('GET /api/profiles', () => {
    it('should list all profiles', async () => {
      // Create test profiles
      await prisma.repoProfile.create({
        data: {
          name: 'Profile 1',
          framework: 'Next.js',
          language: 'TypeScript',
          deployTargetsJson: '[]',
        },
      });

      await prisma.repoProfile.create({
        data: {
          name: 'Profile 2',
          framework: 'NestJS',
          language: 'TypeScript',
          deployTargetsJson: '[]',
        },
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/profiles',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(2);
    });
  });

  describe('GET /api/profiles/:id', () => {
    it('should return a specific profile', async () => {
      const profile = await prisma.repoProfile.create({
        data: {
          name: 'Test Profile',
          framework: 'Next.js',
          language: 'TypeScript',
          deployTargetsJson: '[]',
        },
      });

      const response = await server.inject({
        method: 'GET',
        url: `/api/profiles/${profile.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(profile.id);
      expect(body.name).toBe(profile.name);
    });

    it('should return 404 for non-existent profile', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/profiles/non-existent-id',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('NotFoundError');
    });
  });

  describe('PUT /api/profiles/:id', () => {
    it('should update a profile', async () => {
      const profile = await prisma.repoProfile.create({
        data: {
          name: 'Original Name',
          framework: 'Next.js',
          language: 'TypeScript',
          deployTargetsJson: '[]',
        },
      });

      const response = await server.inject({
        method: 'PUT',
        url: `/api/profiles/${profile.id}`,
        payload: {
          name: 'Updated Name',
          usesDocker: true,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Updated Name');
      expect(body.usesDocker).toBe(true);
    });
  });

  describe('DELETE /api/profiles/:id', () => {
    it('should delete a profile', async () => {
      const profile = await prisma.repoProfile.create({
        data: {
          name: 'To Delete',
          framework: 'Next.js',
          language: 'TypeScript',
          deployTargetsJson: '[]',
        },
      });

      const response = await server.inject({
        method: 'DELETE',
        url: `/api/profiles/${profile.id}`,
      });

      expect(response.statusCode).toBe(204);

      // Verify deletion
      const deleted = await prisma.repoProfile.findUnique({
        where: { id: profile.id },
      });
      expect(deleted).toBeNull();
    });
  });
});
