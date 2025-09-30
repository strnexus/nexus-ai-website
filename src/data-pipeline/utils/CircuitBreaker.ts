/**
 * Circuit Breaker for Data Pipeline
 * 
 * Implements circuit breaker pattern to automatically halt pipeline operations
 * when repeated failures or safety violations are detected.
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Logger } from './Logger';

export enum CircuitState {
  CLOSED = 'CLOSED',      // Normal operation
  OPEN = 'OPEN',          // Circuit is open, blocking operations
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;          // Number of failures before opening circuit
  successThreshold: number;          // Number of successes needed to close circuit
  timeout: number;                   // Time in ms to wait before half-open
  monitoringWindow: number;          // Time window in ms to track failures
  criticalFailureThreshold: number;  // Immediate circuit opening threshold
}

export interface FailureRecord {
  timestamp: number;
  type: 'safety_violation' | 'data_corruption' | 'source_failure' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context?: any;
}

export interface CircuitBreakerState {
  state: CircuitState;
  failures: FailureRecord[];
  successCount: number;
  lastFailureTime: number;
  openedAt?: number;
  lastStateChange: number;
  totalOperations: number;
  totalFailures: number;
}

/**
 * Circuit Breaker Class
 * Automatically prevents pipeline operations when system is unhealthy
 */
export class CircuitBreaker {
  private logger: Logger;
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;
  private readonly statePath: string;

  // Default configuration
  private static readonly DEFAULT_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,           // Open after 5 failures
    successThreshold: 3,           // Close after 3 successes
    timeout: 5 * 60 * 1000,       // 5 minutes timeout
    monitoringWindow: 10 * 60 * 1000, // 10 minutes monitoring window
    criticalFailureThreshold: 2    // Open immediately after 2 critical failures
  };

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.logger = new Logger('CircuitBreaker');
    this.config = { ...CircuitBreaker.DEFAULT_CONFIG, ...config };
    this.statePath = join(process.cwd(), 'data', 'circuit-breaker-state.json');
    
    // Load previous state or initialize
    this.state = this.loadState();
    
    this.logger.info(`🔌 Circuit breaker initialized in ${this.state.state} state`);
  }

  /**
   * Check if operation is allowed
   */
  async canExecute(): Promise<boolean> {
    await this.updateState();
    
    switch (this.state.state) {
      case CircuitState.CLOSED:
        return true;
        
      case CircuitState.OPEN:
        return false;
        
      case CircuitState.HALF_OPEN:
        // Allow limited operations to test recovery
        return true;
        
      default:
        return false;
    }
  }

  /**
   * Record a successful operation
   */
  async recordSuccess(): Promise<void> {
    this.state.successCount++;
    this.state.totalOperations++;
    
    if (this.state.state === CircuitState.HALF_OPEN) {
      if (this.state.successCount >= this.config.successThreshold) {
        await this.closeCircuit();
      }
    }
    
    await this.saveState();
    this.logger.debug(`✅ Success recorded: ${this.state.successCount}/${this.config.successThreshold}`);
  }

  /**
   * Record a failure
   */
  async recordFailure(
    type: FailureRecord['type'],
    severity: FailureRecord['severity'],
    message: string,
    context?: any
  ): Promise<void> {
    const failure: FailureRecord = {
      timestamp: Date.now(),
      type,
      severity,
      message,
      context
    };

    this.state.failures.push(failure);
    this.state.lastFailureTime = failure.timestamp;
    this.state.totalOperations++;
    this.state.totalFailures++;
    this.state.successCount = 0; // Reset success count on any failure

    // Clean old failures outside monitoring window
    this.cleanOldFailures();

    // Check if circuit should be opened
    await this.evaluateCircuitState(failure);
    
    await this.saveState();
    
    this.logger.warn(`⚠️ Failure recorded: ${type}/${severity} - ${message}`);
  }

  /**
   * Force circuit to open (emergency mode)
   */
  async forceOpen(reason: string): Promise<void> {
    await this.openCircuit(`FORCED OPEN: ${reason}`);
    this.logger.error(`🚨 Circuit breaker forced open: ${reason}`);
  }

  /**
   * Force circuit to close (emergency recovery)
   */
  async forceClose(reason: string): Promise<void> {
    await this.closeCircuit(`FORCED CLOSE: ${reason}`);
    this.logger.warn(`🔧 Circuit breaker forced closed: ${reason}`);
  }

  /**
   * Get current circuit status
   */
  getStatus(): {
    state: CircuitState;
    canExecute: boolean;
    failures: number;
    recentFailures: number;
    nextRetryAt?: Date;
    healthMetrics: {
      totalOperations: number;
      totalFailures: number;
      failureRate: number;
      uptime: number;
    };
  } {
    const recentFailures = this.getRecentFailures().length;
    const failureRate = this.state.totalOperations > 0 
      ? (this.state.totalFailures / this.state.totalOperations) * 100 
      : 0;

    let nextRetryAt: Date | undefined;
    if (this.state.state === CircuitState.OPEN && this.state.openedAt) {
      nextRetryAt = new Date(this.state.openedAt + this.config.timeout);
    }

    const uptime = Date.now() - this.state.lastStateChange;

    return {
      state: this.state.state,
      canExecute: this.state.state !== CircuitState.OPEN,
      failures: this.state.totalFailures,
      recentFailures,
      nextRetryAt,
      healthMetrics: {
        totalOperations: this.state.totalOperations,
        totalFailures: this.state.totalFailures,
        failureRate: Math.round(failureRate * 100) / 100,
        uptime: Math.round(uptime / 1000) // seconds
      }
    };
  }

  /**
   * Generate health report
   */
  generateHealthReport(): {
    circuitState: CircuitState;
    healthScore: number; // 0-100
    issues: string[];
    recommendations: string[];
    recentFailures: FailureRecord[];
    metrics: {
      failureRate: number;
      mtbf: number; // Mean time between failures in minutes
      availability: number; // Percentage uptime
    };
  } {
    const now = Date.now();
    const recentFailures = this.getRecentFailures();
    
    // Calculate health score (0-100)
    let healthScore = 100;
    
    // Deduct for recent failures
    healthScore -= recentFailures.length * 10;
    
    // Deduct for critical failures
    const criticalFailures = recentFailures.filter(f => f.severity === 'critical');
    healthScore -= criticalFailures.length * 20;
    
    // Deduct if circuit is open
    if (this.state.state === CircuitState.OPEN) {
      healthScore -= 30;
    }
    
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Calculate metrics
    const failureRate = this.state.totalOperations > 0 
      ? (this.state.totalFailures / this.state.totalOperations) * 100 
      : 0;

    const mtbf = this.state.totalFailures > 1 
      ? (now - this.state.lastStateChange) / (this.state.totalFailures * 60000) // minutes
      : 0;

    const availability = this.state.state === CircuitState.OPEN ? 0 : 100;

    // Generate issues
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (this.state.state === CircuitState.OPEN) {
      issues.push('Circuit breaker is OPEN - pipeline operations are blocked');
      recommendations.push('Investigate recent failures and address root causes');
    }

    if (recentFailures.length >= this.config.failureThreshold) {
      issues.push(`High failure rate: ${recentFailures.length} failures in monitoring window`);
      recommendations.push('Review data sources and pipeline stability');
    }

    if (criticalFailures.length > 0) {
      issues.push(`${criticalFailures.length} critical failures detected`);
      recommendations.push('Address critical safety violations immediately');
    }

    if (failureRate > 20) {
      issues.push(`High overall failure rate: ${failureRate.toFixed(1)}%`);
      recommendations.push('Improve error handling and data validation');
    }

    if (healthScore < 50) {
      recommendations.push('System health is poor - consider maintenance window');
    }

    return {
      circuitState: this.state.state,
      healthScore: Math.round(healthScore),
      issues,
      recommendations,
      recentFailures,
      metrics: {
        failureRate: Math.round(failureRate * 100) / 100,
        mtbf: Math.round(mtbf * 100) / 100,
        availability
      }
    };
  }

  /**
   * Update circuit state based on time and conditions
   */
  private async updateState(): Promise<void> {
    const now = Date.now();

    if (this.state.state === CircuitState.OPEN && this.state.openedAt) {
      // Check if timeout has passed to move to half-open
      if (now - this.state.openedAt >= this.config.timeout) {
        await this.halfOpenCircuit();
      }
    }

    // Clean old failures
    this.cleanOldFailures();
  }

  /**
   * Evaluate if circuit should change state based on failure
   */
  private async evaluateCircuitState(newFailure: FailureRecord): Promise<void> {
    const recentFailures = this.getRecentFailures();
    const criticalFailures = recentFailures.filter(f => f.severity === 'critical');

    // Immediate circuit opening for critical failures
    if (criticalFailures.length >= this.config.criticalFailureThreshold) {
      await this.openCircuit(`Critical failure threshold exceeded: ${criticalFailures.length} critical failures`);
      return;
    }

    // Check failure threshold
    if (recentFailures.length >= this.config.failureThreshold) {
      await this.openCircuit(`Failure threshold exceeded: ${recentFailures.length} failures in monitoring window`);
      return;
    }

    // If in half-open state, any failure should open the circuit
    if (this.state.state === CircuitState.HALF_OPEN) {
      await this.openCircuit('Failure during half-open state');
      return;
    }
  }

  /**
   * Open the circuit
   */
  private async openCircuit(reason: string): Promise<void> {
    if (this.state.state !== CircuitState.OPEN) {
      this.state.state = CircuitState.OPEN;
      this.state.openedAt = Date.now();
      this.state.lastStateChange = Date.now();
      this.state.successCount = 0;
      
      this.logger.error(`🔴 Circuit breaker OPENED: ${reason}`);
      
      // Send alert notification
      await this.sendAlert('Circuit Breaker Opened', reason, 'critical');
    }
  }

  /**
   * Move circuit to half-open state
   */
  private async halfOpenCircuit(): Promise<void> {
    this.state.state = CircuitState.HALF_OPEN;
    this.state.lastStateChange = Date.now();
    this.state.successCount = 0;
    
    this.logger.warn(`🟡 Circuit breaker moved to HALF-OPEN state`);
  }

  /**
   * Close the circuit
   */
  private async closeCircuit(reason?: string): Promise<void> {
    if (this.state.state !== CircuitState.CLOSED) {
      this.state.state = CircuitState.CLOSED;
      this.state.lastStateChange = Date.now();
      this.state.openedAt = undefined;
      this.state.successCount = 0;
      
      const message = reason || 'Success threshold met';
      this.logger.info(`🟢 Circuit breaker CLOSED: ${message}`);
      
      // Send recovery notification
      await this.sendAlert('Circuit Breaker Closed', message, 'info');
    }
  }

  /**
   * Get failures within monitoring window
   */
  private getRecentFailures(): FailureRecord[] {
    const now = Date.now();
    const cutoff = now - this.config.monitoringWindow;
    
    return this.state.failures.filter(f => f.timestamp >= cutoff);
  }

  /**
   * Clean old failures outside monitoring window
   */
  private cleanOldFailures(): void {
    const now = Date.now();
    const cutoff = now - this.config.monitoringWindow;
    
    const originalCount = this.state.failures.length;
    this.state.failures = this.state.failures.filter(f => f.timestamp >= cutoff);
    
    const cleanedCount = originalCount - this.state.failures.length;
    if (cleanedCount > 0) {
      this.logger.debug(`🧹 Cleaned ${cleanedCount} old failure records`);
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlert(title: string, message: string, severity: 'info' | 'warning' | 'critical'): Promise<void> {
    try {
      // This would integrate with your notification system
      // For now, just log the alert
      const emoji = severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
      this.logger.info(`${emoji} ALERT: ${title} - ${message}`);
      
      // TODO: Integrate with Slack, email, or other notification systems
      // await this.notificationService.send({
      //   title,
      //   message,
      //   severity,
      //   timestamp: new Date().toISOString()
      // });
      
    } catch (error) {
      this.logger.error(`Failed to send alert: ${error.message}`);
    }
  }

  /**
   * Load circuit breaker state from file
   */
  private loadState(): CircuitBreakerState {
    try {
      if (existsSync(this.statePath)) {
        const data = readFileSync(this.statePath, 'utf-8');
        const loadedState = JSON.parse(data);
        
        // Validate loaded state and provide defaults
        return {
          state: loadedState.state || CircuitState.CLOSED,
          failures: Array.isArray(loadedState.failures) ? loadedState.failures : [],
          successCount: loadedState.successCount || 0,
          lastFailureTime: loadedState.lastFailureTime || 0,
          openedAt: loadedState.openedAt,
          lastStateChange: loadedState.lastStateChange || Date.now(),
          totalOperations: loadedState.totalOperations || 0,
          totalFailures: loadedState.totalFailures || 0
        };
      }
    } catch (error) {
      this.logger.warn(`Failed to load circuit breaker state: ${error.message}`);
    }

    // Return default state
    return {
      state: CircuitState.CLOSED,
      failures: [],
      successCount: 0,
      lastFailureTime: 0,
      lastStateChange: Date.now(),
      totalOperations: 0,
      totalFailures: 0
    };
  }

  /**
   * Save circuit breaker state to file
   */
  private async saveState(): Promise<void> {
    try {
      writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      this.logger.error(`Failed to save circuit breaker state: ${error.message}`);
    }
  }

  /**
   * Reset circuit breaker (for testing/maintenance)
   */
  async reset(): Promise<void> {
    this.state = {
      state: CircuitState.CLOSED,
      failures: [],
      successCount: 0,
      lastFailureTime: 0,
      lastStateChange: Date.now(),
      totalOperations: 0,
      totalFailures: 0
    };
    
    await this.saveState();
    this.logger.info('🔄 Circuit breaker reset to default state');
  }
}