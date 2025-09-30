/**
 * Safety Guards for Data Pipeline
 * 
 * Comprehensive safety mechanisms to validate data changes and prevent 
 * deployment of corrupted or dangerous data updates.
 */

import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { AITool, DataQualityMetrics, PipelineResult } from '../types';
import { Logger } from './Logger';

export interface SafetyCheckResult {
  passed: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  recommendation?: string;
}

export interface SafetyReport {
  overall: SafetyCheckResult;
  checks: {
    dataIntegrity: SafetyCheckResult;
    volumeChange: SafetyCheckResult;
    qualityMetrics: SafetyCheckResult;
    schemaValidation: SafetyCheckResult;
    duplicateDetection: SafetyCheckResult;
    sourceReliability: SafetyCheckResult;
    businessLogic: SafetyCheckResult;
  };
  timestamp: string;
  dataSnapshot: {
    totalTools: number;
    averageQuality: number;
    sourceDistribution: Record<string, number>;
    categoryDistribution: Record<string, number>;
  };
  recommendations: string[];
}

/**
 * Safety Guards Class
 * Implements comprehensive safety checks for data pipeline
 */
export class SafetyGuards {
  private logger: Logger;
  private readonly SAFETY_THRESHOLDS = {
    // Volume change thresholds
    MAX_INCREASE_PERCENT: 50,  // Max 50% increase in data volume
    MAX_DECREASE_PERCENT: 20,  // Max 20% decrease in data volume
    MIN_TOOLS_ABSOLUTE: 100,   // Minimum absolute number of tools
    
    // Quality thresholds  
    MIN_AVERAGE_QUALITY: 6.0,  // Minimum average quality score
    MAX_LOW_QUALITY_PERCENT: 15, // Max 15% of tools can be low quality (<5.0)
    
    // Source reliability
    MIN_SOURCE_DIVERSITY: 3,   // Must have data from at least 3 sources
    MAX_SINGLE_SOURCE_PERCENT: 70, // No single source can dominate >70%
    
    // Schema validation
    REQUIRED_FIELDS: [
      'id', 'name', 'description', 'category', 'pricing', 
      'website', 'source', 'lastUpdated', 'qualityScore'
    ],
    
    // Duplicate detection
    MAX_DUPLICATE_PERCENT: 5,  // Max 5% duplicates allowed
    
    // Business logic
    EXCLUDED_CATEGORIES: ['adult', 'gambling', 'cryptocurrency-trading'],
    MIN_DESCRIPTION_LENGTH: 20,
    MAX_DESCRIPTION_LENGTH: 2000,
  };

  constructor() {
    this.logger = new Logger('SafetyGuards');
  }

  /**
   * Run comprehensive safety checks on pipeline data
   */
  async runSafetyChecks(
    newData: AITool[], 
    previousData: AITool[] = [],
    pipelineResult?: PipelineResult
  ): Promise<SafetyReport> {
    this.logger.info(`🛡️ Running safety checks on ${newData.length} tools`);
    
    const checks = {
      dataIntegrity: await this.checkDataIntegrity(newData),
      volumeChange: await this.checkVolumeChange(newData, previousData),
      qualityMetrics: await this.checkQualityMetrics(newData),
      schemaValidation: await this.checkSchemaValidation(newData),
      duplicateDetection: await this.checkDuplicates(newData),
      sourceReliability: await this.checkSourceReliability(newData),
      businessLogic: await this.checkBusinessLogic(newData)
    };

    // Calculate overall safety
    const overall = this.calculateOverallSafety(checks);
    
    // Generate data snapshot
    const dataSnapshot = this.generateDataSnapshot(newData);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(checks, overall);

    const report: SafetyReport = {
      overall,
      checks,
      timestamp: new Date().toISOString(),
      dataSnapshot,
      recommendations
    };

    // Log results
    this.logSafetyReport(report);
    
    // Save safety report to file
    await this.saveSafetyReport(report);

    return report;
  }

  /**
   * Check data integrity - ensure no corruption or missing critical data
   */
  private async checkDataIntegrity(data: AITool[]): Promise<SafetyCheckResult> {
    try {
      let issues = [];

      // Check for completely empty data
      if (data.length === 0) {
        return {
          passed: false,
          severity: 'critical',
          message: 'No data found - complete data loss detected',
          recommendation: 'Do not proceed with deployment. Investigate data fetching process.'
        };
      }

      // Check for minimum viable dataset
      if (data.length < this.SAFETY_THRESHOLDS.MIN_TOOLS_ABSOLUTE) {
        issues.push(`Only ${data.length} tools found, below minimum of ${this.SAFETY_THRESHOLDS.MIN_TOOLS_ABSOLUTE}`);
      }

      // Check for data format corruption
      const corruptedItems = data.filter(tool => {
        return !tool.id || !tool.name || typeof tool.qualityScore !== 'number';
      });

      if (corruptedItems.length > 0) {
        issues.push(`${corruptedItems.length} corrupted items with missing critical fields`);
      }

      // Check for suspicious patterns
      const suspiciousNames = data.filter(tool => 
        tool.name.includes('undefined') || 
        tool.name.includes('null') ||
        tool.name.length < 2
      );

      if (suspiciousNames.length > 0) {
        issues.push(`${suspiciousNames.length} tools with suspicious names`);
      }

      if (issues.length === 0) {
        return {
          passed: true,
          severity: 'low',
          message: 'Data integrity checks passed',
          details: { totalTools: data.length, corruptedItems: 0 }
        };
      }

      const severity = issues.length > 5 ? 'high' : 'medium';
      return {
        passed: false,
        severity,
        message: `Data integrity issues detected: ${issues.join('; ')}`,
        details: { issues, corruptedItems: corruptedItems.length },
        recommendation: severity === 'high' ? 'Block deployment and investigate' : 'Review issues before deployment'
      };

    } catch (error) {
      return {
        passed: false,
        severity: 'critical',
        message: `Data integrity check failed: ${error.message}`,
        recommendation: 'Critical error - do not deploy'
      };
    }
  }

  /**
   * Check for dramatic changes in data volume
   */
  private async checkVolumeChange(newData: AITool[], previousData: AITool[]): Promise<SafetyCheckResult> {
    if (previousData.length === 0) {
      return {
        passed: true,
        severity: 'low',
        message: 'No previous data for comparison - initial data load',
        details: { newCount: newData.length }
      };
    }

    const newCount = newData.length;
    const oldCount = previousData.length;
    const changePercent = ((newCount - oldCount) / oldCount) * 100;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let passed = true;
    let message = `Volume change: ${changePercent.toFixed(1)}% (${oldCount} → ${newCount})`;

    if (changePercent > this.SAFETY_THRESHOLDS.MAX_INCREASE_PERCENT) {
      severity = 'high';
      passed = false;
      message = `Suspicious volume increase: ${changePercent.toFixed(1)}% (${oldCount} → ${newCount})`;
    } else if (changePercent < -this.SAFETY_THRESHOLDS.MAX_DECREASE_PERCENT) {
      severity = changePercent < -50 ? 'critical' : 'high';
      passed = false;
      message = `Significant data loss: ${changePercent.toFixed(1)}% decrease (${oldCount} → ${newCount})`;
    }

    return {
      passed,
      severity,
      message,
      details: {
        oldCount,
        newCount,
        changePercent: Math.round(changePercent * 100) / 100
      },
      recommendation: !passed ? 'Review data sources and fetching process' : undefined
    };
  }

  /**
   * Check data quality metrics
   */
  private async checkQualityMetrics(data: AITool[]): Promise<SafetyCheckResult> {
    const qualityScores = data
      .map(tool => tool.qualityScore)
      .filter(score => typeof score === 'number' && !isNaN(score));

    if (qualityScores.length === 0) {
      return {
        passed: false,
        severity: 'critical',
        message: 'No valid quality scores found',
        recommendation: 'Check quality scoring system'
      };
    }

    const averageQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    const lowQualityCount = qualityScores.filter(score => score < 5.0).length;
    const lowQualityPercent = (lowQualityCount / qualityScores.length) * 100;

    let issues = [];
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (averageQuality < this.SAFETY_THRESHOLDS.MIN_AVERAGE_QUALITY) {
      issues.push(`Average quality ${averageQuality.toFixed(1)} below threshold ${this.SAFETY_THRESHOLDS.MIN_AVERAGE_QUALITY}`);
      severity = 'medium';
    }

    if (lowQualityPercent > this.SAFETY_THRESHOLDS.MAX_LOW_QUALITY_PERCENT) {
      issues.push(`${lowQualityPercent.toFixed(1)}% low quality tools (>${this.SAFETY_THRESHOLDS.MAX_LOW_QUALITY_PERCENT}% threshold)`);
      severity = 'medium';
    }

    const passed = issues.length === 0;
    const message = passed 
      ? `Quality metrics acceptable: avg ${averageQuality.toFixed(1)}, ${lowQualityPercent.toFixed(1)}% low quality`
      : `Quality issues: ${issues.join('; ')}`;

    return {
      passed,
      severity,
      message,
      details: {
        averageQuality: Math.round(averageQuality * 100) / 100,
        lowQualityCount,
        lowQualityPercent: Math.round(lowQualityPercent * 100) / 100,
        totalWithScores: qualityScores.length
      },
      recommendation: !passed ? 'Review data sources for quality issues' : undefined
    };
  }

  /**
   * Validate data schema compliance
   */
  private async checkSchemaValidation(data: AITool[]): Promise<SafetyCheckResult> {
    let validationErrors = [];
    let invalidItems = 0;

    for (const tool of data) {
      const missing = this.SAFETY_THRESHOLDS.REQUIRED_FIELDS.filter(field => 
        !tool[field] && tool[field] !== 0 && tool[field] !== false
      );

      if (missing.length > 0) {
        invalidItems++;
        if (validationErrors.length < 5) { // Limit error details
          validationErrors.push({ id: tool.id, missing });
        }
      }
    }

    const invalidPercent = (invalidItems / data.length) * 100;
    const passed = invalidItems === 0;
    
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (invalidPercent > 10) severity = 'high';
    else if (invalidPercent > 5) severity = 'medium';

    const message = passed
      ? 'All tools pass schema validation'
      : `${invalidItems} tools (${invalidPercent.toFixed(1)}%) have schema violations`;

    return {
      passed,
      severity,
      message,
      details: {
        invalidItems,
        invalidPercent: Math.round(invalidPercent * 100) / 100,
        sampleErrors: validationErrors.slice(0, 3)
      },
      recommendation: !passed ? 'Fix schema violations before deployment' : undefined
    };
  }

  /**
   * Check for excessive duplicates
   */
  private async checkDuplicates(data: AITool[]): Promise<SafetyCheckResult> {
    const seen = new Set();
    let duplicates = 0;

    // Check for exact name duplicates
    const nameMap = new Map<string, number>();
    data.forEach(tool => {
      const normalizedName = tool.name.toLowerCase().trim();
      nameMap.set(normalizedName, (nameMap.get(normalizedName) || 0) + 1);
    });

    duplicates = Array.from(nameMap.values()).reduce((sum, count) => 
      sum + Math.max(0, count - 1), 0
    );

    const duplicatePercent = (duplicates / data.length) * 100;
    const passed = duplicatePercent <= this.SAFETY_THRESHOLDS.MAX_DUPLICATE_PERCENT;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (duplicatePercent > 15) severity = 'high';
    else if (duplicatePercent > this.SAFETY_THRESHOLDS.MAX_DUPLICATE_PERCENT) severity = 'medium';

    const message = passed
      ? `Duplicate rate acceptable: ${duplicatePercent.toFixed(1)}%`
      : `High duplicate rate: ${duplicatePercent.toFixed(1)}% (${duplicates} duplicates)`;

    return {
      passed,
      severity,
      message,
      details: {
        duplicates,
        duplicatePercent: Math.round(duplicatePercent * 100) / 100,
        uniqueNames: nameMap.size
      },
      recommendation: !passed ? 'Improve deduplication logic' : undefined
    };
  }

  /**
   * Check source reliability and diversity
   */
  private async checkSourceReliability(data: AITool[]): Promise<SafetyCheckResult> {
    const sourceCounts = new Map<string, number>();
    
    data.forEach(tool => {
      const source = tool.source?.name || 'unknown';
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    });

    const sourceCount = sourceCounts.size;
    const totalTools = data.length;
    
    // Find dominant source
    const maxSourceCount = Math.max(...sourceCounts.values());
    const maxSourcePercent = (maxSourceCount / totalTools) * 100;
    
    let issues = [];
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (sourceCount < this.SAFETY_THRESHOLDS.MIN_SOURCE_DIVERSITY) {
      issues.push(`Only ${sourceCount} sources found, minimum ${this.SAFETY_THRESHOLDS.MIN_SOURCE_DIVERSITY} required`);
      severity = 'medium';
    }

    if (maxSourcePercent > this.SAFETY_THRESHOLDS.MAX_SINGLE_SOURCE_PERCENT) {
      issues.push(`Single source dominance: ${maxSourcePercent.toFixed(1)}% from one source`);
      severity = 'medium';
    }

    const passed = issues.length === 0;
    const message = passed
      ? `Source diversity acceptable: ${sourceCount} sources, max ${maxSourcePercent.toFixed(1)}% from one`
      : `Source reliability issues: ${issues.join('; ')}`;

    return {
      passed,
      severity,
      message,
      details: {
        sourceCount,
        maxSourcePercent: Math.round(maxSourcePercent * 100) / 100,
        sourceDistribution: Object.fromEntries(sourceCounts)
      },
      recommendation: !passed ? 'Diversify data sources to reduce risk' : undefined
    };
  }

  /**
   * Check business logic rules
   */
  private async checkBusinessLogic(data: AITool[]): Promise<SafetyCheckResult> {
    let issues = [];

    // Check for excluded categories
    const excludedTools = data.filter(tool => 
      this.SAFETY_THRESHOLDS.EXCLUDED_CATEGORIES.some(excluded => 
        tool.category.toLowerCase().includes(excluded)
      )
    );

    if (excludedTools.length > 0) {
      issues.push(`${excludedTools.length} tools in excluded categories`);
    }

    // Check description lengths
    const badDescriptions = data.filter(tool => {
      const descLen = tool.description?.length || 0;
      return descLen < this.SAFETY_THRESHOLDS.MIN_DESCRIPTION_LENGTH || 
             descLen > this.SAFETY_THRESHOLDS.MAX_DESCRIPTION_LENGTH;
    });

    if (badDescriptions.length > 0) {
      issues.push(`${badDescriptions.length} tools with invalid description lengths`);
    }

    // Check for suspicious pricing
    const suspiciousPricing = data.filter(tool => 
      tool.pricing && (
        tool.pricing.includes('$999999') ||
        tool.pricing.includes('undefined') ||
        tool.pricing.includes('null')
      )
    );

    if (suspiciousPricing.length > 0) {
      issues.push(`${suspiciousPricing.length} tools with suspicious pricing`);
    }

    const passed = issues.length === 0;
    const severity = issues.length > 10 ? 'medium' : 'low';
    const message = passed
      ? 'Business logic rules satisfied'
      : `Business logic violations: ${issues.join('; ')}`;

    return {
      passed,
      severity,
      message,
      details: {
        excludedTools: excludedTools.length,
        badDescriptions: badDescriptions.length,
        suspiciousPricing: suspiciousPricing.length
      },
      recommendation: !passed ? 'Review and clean data according to business rules' : undefined
    };
  }

  /**
   * Calculate overall safety based on individual checks
   */
  private calculateOverallSafety(checks: SafetyReport['checks']): SafetyCheckResult {
    const checkArray = Object.values(checks);
    const failedChecks = checkArray.filter(check => !check.passed);
    const criticalFailures = checkArray.filter(check => check.severity === 'critical');
    const highFailures = checkArray.filter(check => check.severity === 'high');

    if (criticalFailures.length > 0) {
      return {
        passed: false,
        severity: 'critical',
        message: `${criticalFailures.length} critical safety failures detected`,
        recommendation: 'BLOCK DEPLOYMENT - Critical issues must be resolved'
      };
    }

    if (highFailures.length > 1 || (highFailures.length > 0 && failedChecks.length > 2)) {
      return {
        passed: false,
        severity: 'high',
        message: `Multiple high-severity safety issues detected`,
        recommendation: 'BLOCK DEPLOYMENT - High-risk issues require resolution'
      };
    }

    if (failedChecks.length > 3) {
      return {
        passed: false,
        severity: 'medium',
        message: `${failedChecks.length} safety checks failed`,
        recommendation: 'REVIEW REQUIRED - Multiple issues detected'
      };
    }

    if (failedChecks.length > 0) {
      return {
        passed: false,
        severity: 'low',
        message: `${failedChecks.length} minor safety issues detected`,
        recommendation: 'Review recommended but deployment may proceed with caution'
      };
    }

    return {
      passed: true,
      severity: 'low',
      message: 'All safety checks passed',
      recommendation: 'Safe to deploy'
    };
  }

  /**
   * Generate data snapshot for reporting
   */
  private generateDataSnapshot(data: AITool[]) {
    const qualityScores = data.map(t => t.qualityScore).filter(s => typeof s === 'number');
    const averageQuality = qualityScores.length > 0 
      ? qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length 
      : 0;

    const sourceDistribution: Record<string, number> = {};
    const categoryDistribution: Record<string, number> = {};

    data.forEach(tool => {
      const source = tool.source?.name || 'unknown';
      sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
      
      categoryDistribution[tool.category] = (categoryDistribution[tool.category] || 0) + 1;
    });

    return {
      totalTools: data.length,
      averageQuality: Math.round(averageQuality * 100) / 100,
      sourceDistribution,
      categoryDistribution
    };
  }

  /**
   * Generate recommendations based on check results
   */
  private generateRecommendations(checks: SafetyReport['checks'], overall: SafetyCheckResult): string[] {
    const recommendations: string[] = [];

    if (overall.recommendation) {
      recommendations.push(`🚨 OVERALL: ${overall.recommendation}`);
    }

    Object.entries(checks).forEach(([checkName, result]) => {
      if (!result.passed && result.recommendation) {
        recommendations.push(`• ${checkName}: ${result.recommendation}`);
      }
    });

    // Add proactive recommendations
    if (overall.passed) {
      recommendations.push('✅ Data appears safe for deployment');
      recommendations.push('💡 Consider running integration tests before full deployment');
    }

    return recommendations;
  }

  /**
   * Log safety report
   */
  private logSafetyReport(report: SafetyReport): void {
    const { overall, checks } = report;
    
    if (overall.passed) {
      this.logger.info(`✅ Safety checks passed: ${overall.message}`);
    } else {
      this.logger.warn(`⚠️ Safety issues detected: ${overall.message}`);
    }

    // Log failed checks
    Object.entries(checks).forEach(([name, result]) => {
      if (!result.passed) {
        const emoji = result.severity === 'critical' ? '🚨' : 
                     result.severity === 'high' ? '⚠️' : '🔍';
        this.logger.warn(`${emoji} ${name}: ${result.message}`);
      }
    });

    // Log snapshot
    this.logger.info(`📊 Data snapshot: ${report.dataSnapshot.totalTools} tools, avg quality ${report.dataSnapshot.averageQuality}`);
  }

  /**
   * Save safety report to file
   */
  private async saveSafetyReport(report: SafetyReport): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -1);
      const filename = `safety-report-${timestamp}.json`;
      const filepath = join(process.cwd(), 'data', 'reports', filename);

      writeFileSync(filepath, JSON.stringify(report, null, 2));
      this.logger.info(`💾 Safety report saved: ${filepath}`);

      // Also save latest report
      const latestPath = join(process.cwd(), 'data', 'reports', 'safety-report-latest.json');
      writeFileSync(latestPath, JSON.stringify(report, null, 2));

    } catch (error) {
      this.logger.error(`Failed to save safety report: ${error.message}`);
    }
  }

  /**
   * Load previous data for comparison
   */
  async loadPreviousData(): Promise<AITool[]> {
    try {
      const dataPath = join(process.cwd(), 'data', 'ai-tools.json');
      const data = readFileSync(dataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.warn(`Could not load previous data: ${error.message}`);
      return [];
    }
  }

  /**
   * Quick safety check for emergency situations
   */
  async quickSafetyCheck(data: AITool[]): Promise<boolean> {
    // Minimal checks for emergency deployments
    if (data.length < 50) return false; // Too little data
    
    const validItems = data.filter(tool => 
      tool.id && tool.name && typeof tool.qualityScore === 'number'
    );
    
    const validPercent = (validItems.length / data.length) * 100;
    return validPercent > 90; // At least 90% valid
  }
}