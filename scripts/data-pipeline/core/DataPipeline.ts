import { logger } from '../utils/logger';
import { AITool } from '../types/schema';
import { PipelineConfig, PipelineResult, HealthStatus } from '../types/pipeline';
import { SourceManager } from './SourceManager';
import { QualityValidator } from './QualityValidator';
import { DeduplicationEngine } from './DeduplicationEngine';
import { DatabaseManager } from './DatabaseManager';
import { ReviewQueueManager } from './ReviewQueueManager';
import { performance } from 'perf_hooks';

export class DataPipeline {
  private sourceManager: SourceManager;
  private qualityValidator: QualityValidator;
  private deduplicationEngine: DeduplicationEngine;
  private databaseManager: DatabaseManager;
  private reviewQueueManager: ReviewQueueManager;

  constructor(private config: PipelineConfig) {
    this.sourceManager = new SourceManager(config.sources);
    this.qualityValidator = new QualityValidator(config.quality);
    this.deduplicationEngine = new DeduplicationEngine(config.deduplication);
    this.databaseManager = new DatabaseManager(config.database);
    this.reviewQueueManager = new ReviewQueueManager(config.reviewQueue);
  }

  async run(options: {
    sourceFilter?: string;
    dryRun?: boolean;
  } = {}): Promise<PipelineResult> {
    const startTime = performance.now();
    
    logger.info('🔄 Starting data pipeline execution', {
      sourceFilter: options.sourceFilter,
      dryRun: options.dryRun
    });

    let toolsProcessed = 0;
    let newTools = 0;
    let updatedTools = 0;
    let qualityFlags = 0;
    let duplicatesFound = 0;
    const errors: string[] = [];

    try {
      // Step 1: Fetch data from sources
      logger.info('📥 Fetching data from sources...');
      const rawData = await this.sourceManager.fetchAll({
        sourceFilter: options.sourceFilter
      });

      logger.info(`✅ Fetched ${rawData.length} tools from ${this.sourceManager.getActiveSources().length} sources`);

      // Step 2: Transform and validate data
      logger.info('🔄 Transforming and validating data...');
      const validatedTools: AITool[] = [];
      
      for (const rawTool of rawData) {
        try {
          // Transform to unified schema
          const tool = await this.sourceManager.transform(rawTool);
          
          // Run quality validation
          const validationResult = await this.qualityValidator.validate(tool);
          
          if (validationResult.passed) {
            validatedTools.push({
              ...tool,
              qualityScore: validationResult.score,
              smbRelevanceScore: this.qualityValidator.calculateSMBRelevance(tool)
            });
          } else if (validationResult.canFix) {
            // Try to auto-fix issues
            const fixedTool = await this.qualityValidator.fix(tool, validationResult);
            if (fixedTool) {
              validatedTools.push(fixedTool);
              logger.debug('🔧 Auto-fixed tool issues', { toolName: tool.name });
            }
          } else {
            // Add to review queue
            await this.reviewQueueManager.addToQueue(tool, validationResult);
            qualityFlags++;
            logger.warn('⚠️ Tool requires manual review', { 
              toolName: tool.name, 
              issues: validationResult.issues 
            });
          }

          toolsProcessed++;
        } catch (error) {
          logger.error('❌ Error processing tool', { 
            error: error.message,
            tool: rawTool.name 
          });
          errors.push(`${rawTool.name}: ${error.message}`);
        }
      }

      logger.info(`✅ Validated ${validatedTools.length} tools`);

      // Step 3: Deduplication
      logger.info('🔍 Running deduplication...');
      const deduplicationResult = await this.deduplicationEngine.process(validatedTools);
      
      duplicatesFound = deduplicationResult.duplicateGroups.length;
      logger.info(`✅ Found ${duplicatesFound} duplicate groups`);

      // Step 4: Merge with existing data
      logger.info('🔄 Merging with existing data...');
      const existingTools = await this.databaseManager.getAllTools();
      const mergeResult = await this.mergeToolData(
        deduplicationResult.uniqueTools,
        existingTools
      );

      newTools = mergeResult.newTools.length;
      updatedTools = mergeResult.updatedTools.length;

      // Step 5: Save to database (if not dry run)
      if (!options.dryRun) {
        logger.info('💾 Saving to database...');
        
        await this.databaseManager.transaction(async (tx) => {
          // Insert new tools
          for (const tool of mergeResult.newTools) {
            await tx.insertTool(tool);
          }

          // Update existing tools
          for (const tool of mergeResult.updatedTools) {
            await tx.updateTool(tool);
          }

          // Update duplicate relationships
          for (const group of deduplicationResult.duplicateGroups) {
            await tx.updateDuplicateRelations(group);
          }
        });

        logger.info('✅ Database updates completed');
      } else {
        logger.info('🏃 Dry run mode - skipping database writes');
      }

      // Step 6: Update monitoring metrics
      await this.updateMetrics({
        toolsProcessed,
        newTools,
        updatedTools,
        qualityFlags,
        duplicatesFound,
        errors: errors.length,
        executionTime: performance.now() - startTime
      });

      const result: PipelineResult = {
        success: true,
        toolsProcessed,
        newTools,
        updatedTools,
        qualityFlags,
        duplicatesFound,
        errors,
        executionTime: Math.round(performance.now() - startTime)
      };

      logger.info('🎉 Pipeline execution completed successfully', result);
      return result;

    } catch (error) {
      logger.error('💥 Pipeline execution failed', error);
      
      return {
        success: false,
        toolsProcessed,
        newTools,
        updatedTools,
        qualityFlags,
        duplicatesFound,
        errors: [...errors, error.message],
        executionTime: Math.round(performance.now() - startTime)
      };
    }
  }

  async validateData(options: {
    autoFix?: boolean;
  } = {}): Promise<{
    totalTools: number;
    validTools: number;
    issuesFound: number;
    issuesFixed: number;
  }> {
    logger.info('🔍 Starting data validation');

    const tools = await this.databaseManager.getAllTools();
    let validTools = 0;
    let issuesFound = 0;
    let issuesFixed = 0;

    for (const tool of tools) {
      const validationResult = await this.qualityValidator.validate(tool);
      
      if (validationResult.passed) {
        validTools++;
      } else {
        issuesFound++;
        
        if (options.autoFix && validationResult.canFix) {
          const fixedTool = await this.qualityValidator.fix(tool, validationResult);
          if (fixedTool) {
            await this.databaseManager.updateTool(fixedTool);
            issuesFixed++;
            logger.debug('🔧 Auto-fixed tool', { toolName: tool.name });
          }
        }
      }
    }

    return {
      totalTools: tools.length,
      validTools,
      issuesFound,
      issuesFixed
    };
  }

  async getHealthStatus(): Promise<HealthStatus> {
    logger.info('📊 Checking pipeline health status');

    // Check data freshness
    const freshnessCheck = await this.checkDataFreshness();
    
    // Check source availability
    const sourceCheck = await this.sourceManager.healthCheck();
    
    // Check average quality score
    const qualityCheck = await this.checkAverageQuality();
    
    // Check for active alerts
    const alerts = await this.getActiveAlerts();
    
    // Get last successful run
    const lastRun = await this.getLastSuccessfulRun();

    return {
      dataFreshness: freshnessCheck,
      sourceAvailability: sourceCheck,
      averageQuality: qualityCheck,
      lastSuccessfulRun: lastRun,
      alerts
    };
  }

  private async mergeToolData(
    newTools: AITool[],
    existingTools: AITool[]
  ): Promise<{
    newTools: AITool[];
    updatedTools: AITool[];
    unchangedTools: AITool[];
  }> {
    const existingToolsMap = new Map(existingTools.map(tool => [tool.id, tool]));
    const newToolsList: AITool[] = [];
    const updatedToolsList: AITool[] = [];
    const unchangedToolsList: AITool[] = [];

    for (const tool of newTools) {
      const existingTool = existingToolsMap.get(tool.id);
      
      if (!existingTool) {
        // Completely new tool
        newToolsList.push({
          ...tool,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastVerified: new Date()
        });
      } else {
        // Check if tool has meaningful changes
        const hasChanges = this.hasSignificantChanges(existingTool, tool);
        
        if (hasChanges) {
          updatedToolsList.push({
            ...existingTool,
            ...tool,
            updatedAt: new Date(),
            lastVerified: new Date()
          });
        } else {
          // Just update lastVerified timestamp
          unchangedToolsList.push({
            ...existingTool,
            lastVerified: new Date()
          });
        }
      }
    }

    return {
      newTools: newToolsList,
      updatedTools: updatedToolsList,
      unchangedTools: unchangedToolsList
    };
  }

  private hasSignificantChanges(existing: AITool, updated: AITool): boolean {
    // Check key fields that indicate significant changes
    const keyFields: (keyof AITool)[] = [
      'name', 'description', 'website', 'pricing'
    ];

    for (const field of keyFields) {
      if (JSON.stringify(existing[field]) !== JSON.stringify(updated[field])) {
        return true;
      }
    }

    return false;
  }

  private async updateMetrics(metrics: {
    toolsProcessed: number;
    newTools: number;
    updatedTools: number;
    qualityFlags: number;
    duplicatesFound: number;
    errors: number;
    executionTime: number;
  }): Promise<void> {
    // For JSON provider, we'll just log the metrics
    // TODO: implement proper metrics storage
    logger.info('📊 Pipeline metrics updated', metrics);
  }

  private async checkDataFreshness(): Promise<number> {
    const tools = await this.databaseManager.getAllTools();
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const freshTools = tools.filter(tool => 
      tool.lastVerified && tool.lastVerified > fourteenDaysAgo
    );

    return Math.round((freshTools.length / tools.length) * 100);
  }

  private async checkAverageQuality(): Promise<number> {
    const tools = await this.databaseManager.getAllTools();
    
    if (tools.length === 0) return 0;
    
    const toolsWithQuality = tools.filter(tool => tool.qualityScore);
    if (toolsWithQuality.length === 0) return 0;
    
    const totalQuality = toolsWithQuality.reduce((sum, tool) => sum + (tool.qualityScore || 0), 0);
    return Math.round(totalQuality / toolsWithQuality.length);
  }
  
  private async getActiveAlerts(): Promise<string[]> {
    // TODO: implement proper alerting system
    return [];
  }
  
  private async getLastSuccessfulRun(): Promise<Date | null> {
    // TODO: implement run history tracking
    return new Date(); // Return current time as placeholder
  }
}

    const totalQuality = tools.reduce((sum, tool) => 
      sum + tool.qualityScore.overall, 0
    );

    return Math.round(totalQuality / tools.length);
  }

  private async getActiveAlerts(): Promise<Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  }>> {
    const alerts: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
    }> = [];

    // Check for stale data
    const freshness = await this.checkDataFreshness();
    if (freshness < 70) {
      alerts.push({
        severity: freshness < 50 ? 'critical' : 'high',
        message: `Data freshness below threshold: ${freshness}%`
      });
    }

    // Check source availability
    const sourceHealth = await this.sourceManager.healthCheck();
    if (sourceHealth < 80) {
      alerts.push({
        severity: sourceHealth < 50 ? 'critical' : 'medium',
        message: `Source availability below threshold: ${sourceHealth}%`
      });
    }

    // Check review queue backlog
    const queueSize = await this.reviewQueueManager.getQueueSize();
    if (queueSize > 100) {
      alerts.push({
        severity: queueSize > 500 ? 'high' : 'medium',
        message: `Review queue backlog: ${queueSize} items`
      });
    }

    return alerts;
  }

  private async getLastSuccessfulRun(): Promise<Date | null> {
    return await this.databaseManager.getLastSuccessfulRun();
  }
}