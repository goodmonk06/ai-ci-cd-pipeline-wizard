import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { profileRoutes } from './routes/profiles';
import { generationRoutes } from './routes/generation';
import { presetRoutes } from './routes/presets';
import { errorHandler } from './lib/errors';
import { metrics, MetricNames } from './lib/metrics';

dotenv.config();

const server = Fastify({
  logger: true,
  genReqId: () => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
});

async function start() {
  try {
    // Register error handler
    server.setErrorHandler(errorHandler);

    // Add request hooks for metrics
    server.addHook('onRequest', async (request) => {
      (request as any).startTime = Date.now();
    });

    server.addHook('onResponse', async (request, reply) => {
      const duration = Date.now() - ((request as any).startTime || Date.now());
      metrics.recordHistogram(MetricNames.API_REQUEST, duration, {
        method: request.method,
        path: request.routerPath || request.url,
        status: reply.statusCode,
      });
    });

    // Register CORS
    await server.register(cors, {
      origin: true,
    });

    // Register routes
    await server.register(profileRoutes, { prefix: '/api/profiles' });
    await server.register(generationRoutes, { prefix: '/api/generate' });
    await server.register(presetRoutes, { prefix: '/api/presets' });

    // Health check
    server.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Metrics endpoint
    server.get('/metrics', async () => {
      return metrics.getMetrics();
    });

    const port = parseInt(process.env.PORT || '3001');
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
