import * as fs from 'fs/promises';
import * as path from 'path';

export interface IStorageAdapter {
  save(key: string, content: string): Promise<void>;
  read(key: string): Promise<string>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

// Local filesystem implementation
export class LocalStorageAdapter implements IStorageAdapter {
  constructor(private basePath: string) {}

  private getFullPath(key: string): string {
    return path.join(this.basePath, key);
  }

  async save(key: string, content: string): Promise<void> {
    const fullPath = this.getFullPath(key);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  async read(key: string): Promise<string> {
    const fullPath = this.getFullPath(key);
    return await fs.readFile(fullPath, 'utf-8');
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = this.getFullPath(key);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.getFullPath(key);
    await fs.unlink(fullPath);
  }

  async list(prefix: string): Promise<string[]> {
    const fullPath = this.getFullPath(prefix);
    try {
      const entries = await fs.readdir(fullPath, { recursive: true });
      return entries
        .filter((entry) => typeof entry === 'string')
        .map((entry) => path.join(prefix, entry as string));
    } catch {
      return [];
    }
  }
}

// In-memory implementation (for testing)
export class InMemoryStorageAdapter implements IStorageAdapter {
  private storage = new Map<string, string>();

  async save(key: string, content: string): Promise<void> {
    this.storage.set(key, content);
  }

  async read(key: string): Promise<string> {
    const content = this.storage.get(key);
    if (!content) {
      throw new Error(`Key not found: ${key}`);
    }
    return content;
  }

  async exists(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async list(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    for (const key of this.storage.keys()) {
      if (key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  clear() {
    this.storage.clear();
  }
}

// Export default adapter
export const storageAdapter: IStorageAdapter = new LocalStorageAdapter(
  path.join(process.cwd(), 'generated')
);
