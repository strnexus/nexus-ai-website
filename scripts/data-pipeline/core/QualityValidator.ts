import { AITool } from '../types/schema';
import { logger } from '../utils/logger';

export interface ValidationResult {
  passed: boolean;
  score: number;
  issues: string[];
  canFix: boolean;
}

export interface QualityConfig {
  minScore: number;
  requiredFields: string[];
  smbRelevanceWeights: {
    pricing: number;
    businessSize: number;
    implementation: number;
  };
}

export class QualityValidator {
  constructor(private config: QualityConfig) {}

  async validate(tool: AITool): Promise<ValidationResult> {
    const issues: string[] = [];
    let score = 100;

    // Check required fields
    for (const field of this.config.requiredFields) {
      if (!tool[field as keyof AITool]) {
        issues.push(`Missing required field: ${field}`);
        score -= 20;
      }
    }

    // Validate pricing information
    if (!tool.pricing || tool.pricing.length === 0) {
      issues.push('Missing pricing information');
      score -= 15;
    }

    // Validate description quality
    if (tool.description && tool.description.length < 50) {
      issues.push('Description too short');
      score -= 10;
    }

    // Check for SMB relevance indicators
    const smbScore = this.calculateSMBRelevance(tool);
    if (smbScore < 50) {
      issues.push('Low SMB relevance score');
      score -= 15;
    }

    const passed = score >= this.config.minScore;
    const canFix = issues.some(issue => 
      issue.includes('Missing') || 
      issue.includes('too short') ||
      issue.includes('Low SMB relevance')
    );

    return {
      passed,
      score,
      issues,
      canFix
    };
  }

  calculateSMBRelevance(tool: AITool): number {
    let relevanceScore = 0;
    const weights = this.config.smbRelevanceWeights;

    // Pricing analysis
    if (tool.pricing) {
      const hasFreeTier = tool.pricing.some(p => p.price === 0);
      const hasAffordableTier = tool.pricing.some(p => p.price > 0 && p.price < 100);
      
      if (hasFreeTier) relevanceScore += weights.pricing * 0.8;
      if (hasAffordableTier) relevanceScore += weights.pricing * 0.6;
    }

    // Business size compatibility
    if (tool.businessSize) {
      const supportsSMB = tool.businessSize.includes('small') || 
                         tool.businessSize.includes('medium');
      if (supportsSMB) relevanceScore += weights.businessSize;
    }

    // Implementation complexity
    if (tool.tags) {
      const easyImplementation = tool.tags.some(tag => 
        tag.toLowerCase().includes('easy') ||
        tag.toLowerCase().includes('simple') ||
        tag.toLowerCase().includes('no-code')
      );
      if (easyImplementation) relevanceScore += weights.implementation;
    }

    return Math.min(100, relevanceScore);
  }

  async fix(tool: AITool, validationResult: ValidationResult): Promise<AITool | null> {
    const fixedTool = { ...tool };
    let fixed = false;

    for (const issue of validationResult.issues) {
      if (issue.includes('Description too short') && tool.description) {
        // Try to enhance description with additional info
        if (tool.features && tool.features.length > 0) {
          fixedTool.description = `${tool.description} Key features: ${tool.features.slice(0, 3).join(', ')}.`;
          fixed = true;
        }
      }

      if (issue.includes('Missing pricing information') && tool.website) {
        // Add placeholder pricing that can be updated later
        fixedTool.pricing = [{
          tier: 'Contact for Pricing',
          price: null,
          billingCycle: 'custom',
          features: ['Custom pricing available'],
          limitations: []
        }];
        fixed = true;
      }
    }

    if (fixed) {
      logger.info('🔧 Applied automatic fixes to tool', { toolName: tool.name });
      return fixedTool;
    }

    return null;
  }
}