import { AITool } from '../types/schema';
import { ValidationResult } from './QualityValidator';
import { logger } from '../utils/logger';

export interface ReviewQueueConfig {
  maxQueueSize: number;
  autoResolveAfterDays: number;
  priorityThreshold: number;
}

export interface ReviewItem {
  id: string;
  tool: AITool;
  validationResult: ValidationResult;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'auto-resolved';
  notes?: string;
}

export class ReviewQueueManager {
  private queue: ReviewItem[] = [];

  constructor(private config: ReviewQueueConfig) {}

  async addToQueue(tool: AITool, validationResult: ValidationResult): Promise<void> {
    const priority = this.calculatePriority(tool, validationResult);
    
    const reviewItem: ReviewItem = {
      id: `${tool.name}-${Date.now()}`,
      tool,
      validationResult,
      priority,
      createdAt: new Date(),
      status: 'pending'
    };

    this.queue.push(reviewItem);

    // Keep queue size manageable
    if (this.queue.length > this.config.maxQueueSize) {
      await this.autoResolveOldestItems();
    }

    logger.info('➕ Added item to review queue', {
      toolName: tool.name,
      priority,
      queueSize: this.queue.length
    });
  }

  async getQueue(): Promise<ReviewItem[]> {
    // Sort by priority and creation date
    return this.queue
      .filter(item => item.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }

  async approveItem(id: string, notes?: string): Promise<void> {
    const item = this.queue.find(i => i.id === id);
    if (item) {
      item.status = 'approved';
      item.notes = notes;
      logger.info('✅ Review item approved', { id, toolName: item.tool.name });
    }
  }

  async rejectItem(id: string, notes?: string): Promise<void> {
    const item = this.queue.find(i => i.id === id);
    if (item) {
      item.status = 'rejected';
      item.notes = notes;
      logger.info('❌ Review item rejected', { id, toolName: item.tool.name });
    }
  }

  private calculatePriority(tool: AITool, validationResult: ValidationResult): 'low' | 'medium' | 'high' {
    // High priority for tools with major issues but high potential
    if (validationResult.score < 30 && tool.pricing && tool.pricing.length > 0) {
      return 'high';
    }

    // Medium priority for moderate issues
    if (validationResult.score < 60) {
      return 'medium';
    }

    return 'low';
  }

  private async autoResolveOldestItems(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.autoResolveAfterDays);

    const oldItems = this.queue.filter(
      item => item.status === 'pending' && item.createdAt < cutoffDate
    );

    for (const item of oldItems) {
      item.status = 'auto-resolved';
      item.notes = `Auto-resolved after ${this.config.autoResolveAfterDays} days`;
    }

    if (oldItems.length > 0) {
      logger.info('🔄 Auto-resolved old review items', { count: oldItems.length });
    }
  }
}