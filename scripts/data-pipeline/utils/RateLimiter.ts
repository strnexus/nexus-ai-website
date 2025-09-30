import { logger } from './logger';

interface RateLimiterConfig {
  requests: number;
  period: 'hour' | 'day' | 'minute';
  backoffMs?: number;
  name?: string;
}

interface RequestRecord {
  timestamp: number;
  success: boolean;
}

export class RateLimiter {
  private requests: RequestRecord[] = [];
  private readonly maxRequests: number;
  private readonly periodMs: number;
  private readonly backoffMs: number;
  private readonly name: string;

  constructor(config: RateLimiterConfig) {
    this.maxRequests = config.requests;
    this.backoffMs = config.backoffMs || 1000;
    this.name = config.name || 'unnamed';

    // Convert period to milliseconds
    switch (config.period) {
      case 'minute':
        this.periodMs = 60 * 1000;
        break;
      case 'hour':
        this.periodMs = 60 * 60 * 1000;
        break;
      case 'day':
        this.periodMs = 24 * 60 * 60 * 1000;
        break;
      default:
        throw new Error(`Invalid period: ${config.period}`);
    }

    logger.debug(`🚦 Rate limiter initialized: ${this.name} - ${this.maxRequests} requests per ${config.period}`);
  }

  /**
   * Wait for permission to make a request
   * Returns a promise that resolves when it's safe to make the request
   */
  async acquire(): Promise<void> {
    await this.waitForSlot();
    this.recordRequest();
  }

  /**
   * Check if we can make a request right now without waiting
   */
  canMakeRequest(): boolean {
    this.cleanupOldRequests();
    return this.requests.length < this.maxRequests;
  }

  /**
   * Get current request count in the window
   */
  getCurrentCount(): number {
    this.cleanupOldRequests();
    return this.requests.length;
  }

  /**
   * Get remaining requests in current period
   */
  getRemainingRequests(): number {
    return Math.max(0, this.maxRequests - this.getCurrentCount());
  }

  /**
   * Get time until next slot is available (in ms)
   */
  getTimeUntilNextSlot(): number {
    this.cleanupOldRequests();
    
    if (this.requests.length < this.maxRequests) {
      return 0;
    }

    // Find the oldest request that's still in the window
    const oldestRequest = this.requests[0];
    const timeUntilExpiry = (oldestRequest.timestamp + this.periodMs) - Date.now();
    
    return Math.max(0, timeUntilExpiry);
  }

  /**
   * Record that a request was made successfully
   */
  recordSuccess(): void {
    if (this.requests.length > 0) {
      this.requests[this.requests.length - 1].success = true;
    }
  }

  /**
   * Record that a request failed (for statistics)
   */
  recordFailure(): void {
    if (this.requests.length > 0) {
      this.requests[this.requests.length - 1].success = false;
    }
  }

  /**
   * Get success rate over the current window
   */
  getSuccessRate(): number {
    this.cleanupOldRequests();
    
    if (this.requests.length === 0) {
      return 1; // 100% if no requests yet
    }

    const successfulRequests = this.requests.filter(r => r.success).length;
    return successfulRequests / this.requests.length;
  }

  /**
   * Reset the rate limiter (clear all request history)
   */
  reset(): void {
    this.requests = [];
    logger.debug(`🔄 Rate limiter reset: ${this.name}`);
  }

  /**
   * Get statistics about rate limiter usage
   */
  getStats(): {
    name: string;
    currentCount: number;
    maxRequests: number;
    remainingRequests: number;
    successRate: number;
    timeUntilNextSlot: number;
    periodMs: number;
  } {
    return {
      name: this.name,
      currentCount: this.getCurrentCount(),
      maxRequests: this.maxRequests,
      remainingRequests: this.getRemainingRequests(),
      successRate: this.getSuccessRate(),
      timeUntilNextSlot: this.getTimeUntilNextSlot(),
      periodMs: this.periodMs
    };
  }

  private async waitForSlot(): Promise<void> {
    const timeToWait = this.getTimeUntilNextSlot();
    
    if (timeToWait > 0) {
      logger.debug(`⏳ Rate limiting: waiting ${timeToWait}ms for ${this.name}`);
      await this.delay(timeToWait);
    }
  }

  private recordRequest(): void {
    const now = Date.now();
    this.requests.push({
      timestamp: now,
      success: false // Will be updated by recordSuccess/recordFailure
    });

    // Keep requests array clean
    this.cleanupOldRequests();
  }

  private cleanupOldRequests(): void {
    const now = Date.now();
    const cutoffTime = now - this.periodMs;
    
    // Remove requests older than the current period
    this.requests = this.requests.filter(request => 
      request.timestamp > cutoffTime
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create multiple rate limiters with different configurations
 */
export class RateLimiterPool {
  private limiters: Map<string, RateLimiter> = new Map();

  add(name: string, config: RateLimiterConfig): void {
    this.limiters.set(name, new RateLimiter({
      ...config,
      name
    }));
  }

  get(name: string): RateLimiter | undefined {
    return this.limiters.get(name);
  }

  async acquire(name: string): Promise<void> {
    const limiter = this.limiters.get(name);
    if (!limiter) {
      throw new Error(`Rate limiter ${name} not found`);
    }
    await limiter.acquire();
  }

  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [name, limiter] of this.limiters.entries()) {
      stats[name] = limiter.getStats();
    }
    
    return stats;
  }

  reset(name?: string): void {
    if (name) {
      const limiter = this.limiters.get(name);
      limiter?.reset();
    } else {
      // Reset all limiters
      for (const limiter of this.limiters.values()) {
        limiter.reset();
      }
    }
  }
}

export default RateLimiter;