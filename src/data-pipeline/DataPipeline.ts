/**
 * Enhanced Data Pipeline with Safety Guards
 * 
 * Main orchestrator for the AI tools data pipeline with integrated
 * safety mechanisms, circuit breaker, and rollback capabilities.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Logger } from './utils/Logger';
import { AITool, PipelineConfig, PipelineResult, DataQualityMetrics } from './types';
import { SourceManager } from './sources/SourceManager';
import { DataProcessor } from './processing/DataProcessor';
import { SafetyGuards, SafetyReport } from './utils/SafetyGuards';
import { CircuitBreaker } from './utils/CircuitBreaker';

export class DataPipeline {
  private logger: Logger;
  private sourceManager: SourceManager;
  private dataProcessor: DataProcessor;
  private safetyGuards: SafetyGuards;
  private circuitBreaker: CircuitBreaker;
  private config: PipelineConfig;

  constructor(config: PipelineConfig) {
    this.config = config;
    this.logger = new Logger('DataPipeline');
    this.sourceManager = new SourceManager(config.sources);
    this.dataProcessor = new DataProcessor(config.processing);
    this.safetyGuards = new SafetyGuards();
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: config.safety?.failureThreshold || 5,
      successThreshold: config.safety?.successThreshold || 3,
      timeout: config.safety?.circuitTimeout || 5 * 60 * 1000,
      monitoringWindow: config.safety?.monitoringWindow || 10 * 60 * 1000,
      criticalFailureThreshold: config.safety?.criticalFailureThreshold || 2
    });

    this.ensureDirectories();
    this.logger.info('🚀 Enhanced Data Pipeline initialized with safety mechanisms');
  }

  /**
   * Run the complete data pipeline with safety checks
   */
  async run(): Promise<PipelineResult> {
    const startTime = Date.now();
    const runId = this.generateRunId();
    
    this.logger.info(`📋 Starting pipeline run: ${runId}`);

    try {
      // Pre-flight safety checks
      const canExecute = await this.circuitBreaker.canExecute();
      if (!canExecute) {
        const status = this.circuitBreaker.getStatus();
        throw new Error(`Pipeline blocked by circuit breaker: ${status.state}. Next retry: ${status.nextRetryAt}`);
      }

      // Step 1: Load previous data for comparison
      const previousData = await this.loadPreviousData();
      
      // Step 2: Fetch new data from sources
      this.logger.info('📥 Fetching data from sources...');
      const rawData = await this.sourceManager.fetchAll();
      
      if (!rawData || rawData.length === 0) {
        await this.circuitBreaker.recordFailure(
          'source_failure',
          'critical',
          'No data fetched from any sources'
        );
        throw new Error('No data fetched from sources');
      }

      // Step 3: Process and validate data
      this.logger.info(`🔄 Processing ${rawData.length} raw items...`);
      const processedData = await this.dataProcessor.process(rawData);
      
      if (!processedData || processedData.length === 0) {
        await this.circuitBreaker.recordFailure(
          'data_corruption',
          'high',
          'Data processing resulted in no valid items'
        );
        throw new Error('Data processing failed - no valid items');
      }

      // Step 4: Run comprehensive safety checks
      this.logger.info('🛡️ Running safety validation...');
      const safetyReport = await this.safetyGuards.runSafetyChecks(
        processedData,
        previousData
      );

      // Step 5: Evaluate safety results
      if (!safetyReport.overall.passed) {
        await this.circuitBreaker.recordFailure(
          'safety_violation',
          safetyReport.overall.severity,
          safetyReport.overall.message,
          { report: safetyReport }
        );

        if (safetyReport.overall.severity === 'critical') {
          throw new Error(`Critical safety violation: ${safetyReport.overall.message}`);
        }

        if (safetyReport.overall.severity === 'high') {
          throw new Error(`High-risk safety violation: ${safetyReport.overall.message}`);
        }

        // Medium/low severity - log warning but continue with caution
        this.logger.warn(`⚠️ Safety concerns detected but proceeding: ${safetyReport.overall.message}`);
      }

      // Step 6: Generate quality metrics
      const qualityMetrics = this.generateQualityMetrics(processedData, safetyReport);

      // Step 7: Save data with backup
      await this.saveDataSafely(processedData, runId);

      // Step 8: Record successful pipeline run
      await this.circuitBreaker.recordSuccess();

      const endTime = Date.now();
      const duration = endTime - startTime;

      const result: PipelineResult = {
        success: true,
        runId,
        timestamp: new Date().toISOString(),
        duration,
        metrics: {
          rawItems: rawData.length,
          processedItems: processedData.length,
          qualityScore: qualityMetrics.averageQuality,
          sourceDistribution: this.calculateSourceDistribution(processedData),
          processingStages: {
            fetching: { duration: 0, itemsProcessed: rawData.length },
            processing: { duration: 0, itemsProcessed: processedData.length },
            validation: { duration: 0, itemsProcessed: processedData.length },
            saving: { duration: 0, itemsProcessed: processedData.length }
          }
        },
        safetyReport,
        qualityMetrics,
        data: processedData
      };

      this.logger.info(`✅ Pipeline completed successfully in ${duration}ms`);
      this.logger.info(`📊 Processed ${processedData.length} items with avg quality ${qualityMetrics.averageQuality}`);

      return result;

    } catch (error) {
      await this.circuitBreaker.recordFailure(
        'system_error',
        'high',
        error.message,
        { runId, duration: Date.now() - startTime }
      );

      const result: PipelineResult = {
        success: false,
        runId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: error.message,
        metrics: {
          rawItems: 0,
          processedItems: 0,
          qualityScore: 0,
          sourceDistribution: {},
          processingStages: {
            fetching: { duration: 0, itemsProcessed: 0 },
            processing: { duration: 0, itemsProcessed: 0 },
            validation: { duration: 0, itemsProcessed: 0 },
            saving: { duration: 0, itemsProcessed: 0 }
          }
        }
      };

      this.logger.error(`❌ Pipeline failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Quick health check without running full pipeline
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    circuitStatus: any;
    issues: string[];
    recommendations: string[];
  }> {
    const circuitStatus = this.circuitBreaker.getStatus();
    const circuitHealth = this.circuitBreaker.generateHealthReport();
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!circuitStatus.canExecute) {
      issues.push(`Circuit breaker is ${circuitStatus.state}`);
      recommendations.push('Wait for circuit breaker to recover or investigate failures');
    }

    if (circuitHealth.healthScore < 70) {
      issues.push(`Low health score: ${circuitHealth.healthScore}/100`);
      recommendations.push(...circuitHealth.recommendations);
    }

    // Check if data directory exists and is writable
    try {
      const testFile = join(process.cwd(), 'data', '.health-check');
      writeFileSync(testFile, 'test');
      // Clean up test file
      require('fs').unlinkSync(testFile);
    } catch (error) {
      issues.push('Data directory not writable');
      recommendations.push('Check file system permissions');
    }

    const healthy = issues.length === 0 && circuitStatus.canExecute;

    return {
      healthy,
      circuitStatus: circuitHealth,
      issues,
      recommendations
    };
  }

  /**
   * Emergency stop - force circuit breaker open
   */
  async emergencyStop(reason: string): Promise<void> {
    await this.circuitBreaker.forceOpen(reason);
    this.logger.error(`🚨 EMERGENCY STOP: ${reason}`);
  }

  /**
   * Emergency recovery - force circuit breaker closed
   */
  async emergencyRecovery(reason: string): Promise<void> {
    await this.circuitBreaker.forceClose(reason);
    this.logger.warn(`🔧 EMERGENCY RECOVERY: ${reason}`);
  }

  /**
   * Reset circuit breaker state
   */
  async resetCircuitBreaker(): Promise<void> {
    await this.circuitBreaker.reset();
    this.logger.info('🔄 Circuit breaker reset');
  }

  /**
   * Load previous data for comparison
   */
  private async loadPreviousData(): Promise<AITool[]> {
    try {
      return await this.safetyGuards.loadPreviousData();
    } catch (error) {
      this.logger.warn(`Could not load previous data: ${error.message}`);
      return [];
    }
  }

  /**
   * Save data with safety backup mechanism
   */
  private async saveDataSafely(data: AITool[], runId: string): Promise<void> {
    const dataPath = join(process.cwd(), 'data', 'ai-tools.json');
    const backupPath = join(process.cwd(), 'data', 'backups', `ai-tools-${runId}.json`);
    
    try {
      // Create backup of current data if it exists
      if (existsSync(dataPath)) {
        const currentData = readFileSync(dataPath, 'utf-8');
        writeFileSync(backupPath, currentData);
        this.logger.info(`💾 Backup created: ${backupPath}`);
      }

      // Write new data
      writeFileSync(dataPath, JSON.stringify(data, null, 2));
      this.logger.info(`💾 Data saved: ${data.length} items to ${dataPath}`);

      // Save run metadata
      const metadataPath = join(process.cwd(), 'data', 'metadata', `run-${runId}.json`);
      const metadata = {
        runId,
        timestamp: new Date().toISOString(),
        itemCount: data.length,
        backupPath
      };
      writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    } catch (error) {
      throw new Error(`Failed to save data safely: ${error.message}`);
    }
  }

  /**
   * Generate quality metrics from processed data and safety report
   */
  private generateQualityMetrics(data: AITool[], safetyReport: SafetyReport): DataQualityMetrics {
    const qualityScores = data.map(tool => tool.qualityScore).filter(score => typeof score === 'number');
    const averageQuality = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0;

    const categoryDistribution: Record<string, number> = {};
    const sourceDistribution: Record<string, number> = {};
    
    data.forEach(tool => {
      categoryDistribution[tool.category] = (categoryDistribution[tool.category] || 0) + 1;
      const source = tool.source?.name || 'unknown';
      sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
    });

    return {
      totalTools: data.length,
      averageQuality: Math.round(averageQuality * 100) / 100,
      qualityDistribution: {
        high: qualityScores.filter(s => s >= 8).length,
        medium: qualityScores.filter(s => s >= 6 && s < 8).length,
        low: qualityScores.filter(s => s < 6).length
      },
      categoryDistribution,
      sourceDistribution,
      duplicatesRemoved: 0, // This would be set by the deduplication process
      validationErrors: safetyReport.checks.schemaValidation.passed ? 0 : 
        safetyReport.checks.schemaValidation.details?.invalidItems || 0,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Calculate source distribution
   */
  private calculateSourceDistribution(data: AITool[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    data.forEach(tool => {
      const source = tool.source?.name || 'unknown';
      distribution[source] = (distribution[source] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Generate unique run ID
   */
  private generateRunId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -1);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    const directories = [
      'data',
      'data/backups',
      'data/metadata',
      'data/reports'
    ];

    directories.forEach(dir => {
      const fullPath = join(process.cwd(), dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
        this.logger.debug(`📁 Created directory: ${fullPath}`);
      }
    });
  }

  /**
   * Get pipeline statistics
   */
  getStatistics(): {
    circuitBreaker: any;
    recentRuns: number;
    systemHealth: string;
  } {
    const circuitStatus = this.circuitBreaker.getStatus();
    const circuitHealth = this.circuitBreaker.generateHealthReport();
    
    let systemHealth = 'healthy';
    if (circuitHealth.healthScore < 50) systemHealth = 'critical';
    else if (circuitHealth.healthScore < 70) systemHealth = 'degraded';
    else if (circuitHealth.healthScore < 90) systemHealth = 'warning';

    return {
      circuitBreaker: circuitStatus,
      recentRuns: circuitStatus.healthMetrics.totalOperations,
      systemHealth
    };
  }
}