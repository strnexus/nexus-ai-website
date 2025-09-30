import { AITool } from '../types/schema';
import { logger } from '../utils/logger';

export interface DatabaseConfig {
  provider: 'json' | 'postgres' | 'sqlite';
  jsonPath?: string;
  connectionString?: string;
}

interface Transaction {
  insertTool(tool: AITool): Promise<void>;
  updateTool(tool: AITool): Promise<void>;
  updateDuplicateRelations(group: { primaryTool: AITool; duplicates: AITool[] }): Promise<void>;
}

export class DatabaseManager {
  constructor(private config: DatabaseConfig) {}

  async getAllTools(): Promise<AITool[]> {
    if (this.config.provider === 'json' && this.config.jsonPath) {
      const fs = await import('fs/promises');
      try {
        const content = await fs.readFile(this.config.jsonPath, 'utf-8');
        return JSON.parse(content) as AITool[];
      } catch (e) {
        logger.warn('No existing JSON database found, returning empty list', { path: this.config.jsonPath });
        return [];
      }
    }
    // TODO: implement Postgres/SQLite providers
    return [];
  }

  async transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    const jsonPath = this.config.jsonPath || 'data/tools.json';
    let current = await this.getAllTools();

    const tx: Transaction = {
      insertTool: async (tool: AITool) => {
        current.push(tool);
      },
      updateTool: async (tool: AITool) => {
        const idx = current.findIndex(t => (t.id || t.name) === (tool.id || tool.name));
        if (idx >= 0) current[idx] = tool;
      },
      updateDuplicateRelations: async () => {
        // For JSON provider, we skip explicit relation management
      }
    };

    const result = await fn(tx);

    if (this.config.provider === 'json') {
      const fs = await import('fs/promises');
      await fs.writeFile(jsonPath, JSON.stringify(current, null, 2), 'utf-8');
    }

    return result;
  }
  
  async updateTool(tool: AITool): Promise<void> {
    // For JSON provider, we need to read, update, and write back
    const tools = await this.getAllTools();
    const index = tools.findIndex(t => (t.id || t.name) === (tool.id || tool.name));
    
    if (index >= 0) {
      tools[index] = tool;
      
      const jsonPath = this.config.jsonPath || 'data/tools.json';
      const fs = await import('fs/promises');
      await fs.writeFile(jsonPath, JSON.stringify(tools, null, 2), 'utf-8');
    }
  }
}
