import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { profileRoutes } from './routes/profiles';
import { generationRoutes } from './routes/generation';

dotenv.config();

const server = Fastify({
  logger: true,
});

async function start() {
  try {
    // Register CORS
    await server.register(cors, {
      origin: true,
    });

    // Register routes
    await server.register(profileRoutes, { prefix: '/api/profiles' });
    await server.register(generationRoutes, { prefix: '/api/generate' });

    // Health check
    server.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
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
