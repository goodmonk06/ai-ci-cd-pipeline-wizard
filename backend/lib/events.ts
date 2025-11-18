import { RepoProfile, GenerationJob, PipelineTemplate } from '@prisma/client';

export type DomainEvent =
  | { type: 'profile.created'; payload: RepoProfile }
  | { type: 'profile.updated'; payload: RepoProfile }
  | { type: 'profile.deleted'; payload: { id: string } }
  | { type: 'generation.started'; payload: { profileId: string; requestId: string } }
  | { type: 'generation.completed'; payload: GenerationJob }
  | { type: 'generation.failed'; payload: { profileId: string; error: string } }
  | { type: 'template.created'; payload: PipelineTemplate }
  | { type: 'template.updated'; payload: PipelineTemplate };

type EventHandler = (event: DomainEvent) => void | Promise<void>;

class EventEmitter {
  private handlers: Map<DomainEvent['type'], EventHandler[]> = new Map();

  on(eventType: DomainEvent['type'], handler: EventHandler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  off(eventType: DomainEvent['type'], handler: EventHandler) {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  async emit(event: DomainEvent) {
    const handlers = this.handlers.get(event.type) || [];
    await Promise.all(handlers.map((handler) => handler(event)));
  }

  clear() {
    this.handlers.clear();
  }
}

export const eventBus = new EventEmitter();

// Default event handlers
eventBus.on('generation.completed', (event) => {
  if (event.type === 'generation.completed') {
    console.log('[EVENT] Generation completed:', event.payload.id);
  }
});

eventBus.on('generation.failed', (event) => {
  if (event.type === 'generation.failed') {
    console.error('[EVENT] Generation failed:', event.payload.error);
  }
});
