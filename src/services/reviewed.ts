import * as crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

const STORE_DIR = '.test-inspector';
const STORE_FILE = 'reviewed.json';

export type ReviewedEntry = {
  path: string;
  contentHash: string;
  reviewedAt: string;
};

export class ReviewedStore {
  private readonly storePath: string;
  private entries: Map<string, ReviewedEntry> = new Map();

  constructor(workspaceRoot: string) {
    this.storePath = path.join(workspaceRoot, STORE_DIR, STORE_FILE);
  }

  async load(): Promise<void> {
    try {
      const text = await fs.readFile(this.storePath, 'utf8');
      const parsed = JSON.parse(text) as ReviewedEntry[];
      if (Array.isArray(parsed)) {
        this.entries = new Map(parsed.map((entry) => [entry.path, entry]));
      }
    } catch {
      // file doesn't exist yet; that's fine on first run
      this.entries = new Map();
    }
  }

  async markReviewed(filePath: string): Promise<void> {
    const hash = await hashFile(filePath);
    if (hash === null) return;
    this.entries.set(filePath, {
      path: filePath,
      contentHash: hash,
      reviewedAt: new Date().toISOString(),
    });
    await this.save();
  }

  async shouldHide(filePath: string): Promise<boolean> {
    const entry = this.entries.get(filePath);
    if (!entry) return false;
    const currentHash = await hashFile(filePath);
    if (currentHash === null) return false;
    return entry.contentHash === currentHash;
  }

  size(): number {
    return this.entries.size;
  }

  private async save(): Promise<void> {
    await fs.mkdir(path.dirname(this.storePath), { recursive: true });
    const list = [...this.entries.values()];
    await fs.writeFile(this.storePath, JSON.stringify(list, null, 2), 'utf8');
  }
}

async function hashFile(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  } catch {
    return null;
  }
}
