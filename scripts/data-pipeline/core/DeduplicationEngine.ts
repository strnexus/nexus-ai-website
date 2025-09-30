import { AITool } from '../types/schema';
import { logger } from '../utils/logger';

export interface DeduplicationConfig {
  similarityThreshold: number;
  autoMergeThreshold: number;
  nameWeightSimilarity: number;
  descriptionWeightSimilarity: number;
  websiteWeightSimilarity: number;
}

export interface DuplicateGroup {
  primaryTool: AITool;
  duplicates: AITool[];
  confidenceScore: number;
  autoMergeable: boolean;
}

export interface DeduplicationResult {
  uniqueTools: AITool[];
  duplicateGroups: DuplicateGroup[];
  totalDuplicatesFound: number;
  autoMergedCount: number;
}

export class DeduplicationEngine {
  constructor(private config: DeduplicationConfig) {}

  async process(tools: AITool[]): Promise<DeduplicationResult> {
    logger.info('🔍 Starting deduplication process', { toolCount: tools.length });

    const uniqueTools: AITool[] = [];
    const duplicateGroups: DuplicateGroup[] = [];
    const processed = new Set<string>();
    let autoMergedCount = 0;

    for (let i = 0; i < tools.length; i++) {
      const currentTool = tools[i];
      
      if (processed.has(currentTool.id || currentTool.name)) {
        continue;
      }

      const duplicates: AITool[] = [];
      
      for (let j = i + 1; j < tools.length; j++) {
        const compareTool = tools[j];
        
        if (processed.has(compareTool.id || compareTool.name)) {
          continue;
        }

        const similarity = this.calculateSimilarity(currentTool, compareTool);
        
        if (similarity >= this.config.similarityThreshold) {
          duplicates.push(compareTool);
          processed.add(compareTool.id || compareTool.name);
        }
      }

      if (duplicates.length > 0) {
        const duplicateGroup: DuplicateGroup = {
          primaryTool: currentTool,
          duplicates,
          confidenceScore: this.calculateGroupConfidence(currentTool, duplicates),
          autoMergeable: duplicates.every(d => 
            this.calculateSimilarity(currentTool, d) >= this.config.autoMergeThreshold
          )
        };

        if (duplicateGroup.autoMergeable) {
          // Auto-merge duplicates into primary tool
          const mergedTool = await this.mergeDuplicates(currentTool, duplicates);
          uniqueTools.push(mergedTool);
          autoMergedCount++;
          logger.debug('🔄 Auto-merged duplicate group', { 
            primary: currentTool.name, 
            duplicates: duplicates.length 
          });
        } else {
          // Add to manual review
          duplicateGroups.push(duplicateGroup);
          uniqueTools.push(currentTool);
        }
      } else {
        uniqueTools.push(currentTool);
      }

      processed.add(currentTool.id || currentTool.name);
    }

    const result: DeduplicationResult = {
      uniqueTools,
      duplicateGroups,
      totalDuplicatesFound: duplicateGroups.reduce((sum, group) => sum + group.duplicates.length, 0) + autoMergedCount,
      autoMergedCount
    };

    logger.info('✅ Deduplication completed', {
      uniqueTools: result.uniqueTools.length,
      duplicateGroups: result.duplicateGroups.length,
      totalDuplicates: result.totalDuplicatesFound,
      autoMerged: result.autoMergedCount
    });

    return result;
  }

  private calculateSimilarity(tool1: AITool, tool2: AITool): number {
    let similarity = 0;

    // Name similarity
    const nameSim = this.stringSimilarity(tool1.name, tool2.name);
    similarity += nameSim * this.config.nameWeightSimilarity;

    // Description similarity
    if (tool1.description && tool2.description) {
      const descSim = this.stringSimilarity(tool1.description, tool2.description);
      similarity += descSim * this.config.descriptionWeightSimilarity;
    }

    // Website similarity
    if (tool1.website && tool2.website) {
      const websiteSim = this.normalizeUrl(tool1.website) === this.normalizeUrl(tool2.website) ? 1 : 0;
      similarity += websiteSim * this.config.websiteWeightSimilarity;
    }

    return similarity / (this.config.nameWeightSimilarity + this.config.descriptionWeightSimilarity + this.config.websiteWeightSimilarity);
  }

  private stringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance based similarity
    const longer = str1.length > str2.length ? str1.toLowerCase() : str2.toLowerCase();
    const shorter = str1.length > str2.length ? str2.toLowerCase() : str1.toLowerCase();

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    }
  }

  private calculateGroupConfidence(primary: AITool, duplicates: AITool[]): number {
    const similarities = duplicates.map(dup => this.calculateSimilarity(primary, dup));
    return similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
  }

  private async mergeDuplicates(primary: AITool, duplicates: AITool[]): Promise<AITool> {
    const merged = { ...primary };

    // Merge features from all tools
    const allFeatures = new Set(primary.features || []);
    duplicates.forEach(dup => {
      (dup.features || []).forEach(feature => allFeatures.add(feature));
    });
    merged.features = Array.from(allFeatures);

    // Merge tags
    const allTags = new Set(primary.tags || []);
    duplicates.forEach(dup => {
      (dup.tags || []).forEach(tag => allTags.add(tag));
    });
    merged.tags = Array.from(allTags);

    // Keep the most comprehensive description
    const descriptions = [primary.description, ...duplicates.map(d => d.description)]
      .filter(desc => desc && desc.length > 0)
      .sort((a, b) => (b?.length || 0) - (a?.length || 0));
    
    if (descriptions.length > 0) {
      merged.description = descriptions[0];
    }

    // Merge pricing tiers (keeping unique ones)
    const allPricing = [...(primary.pricing || [])];
    duplicates.forEach(dup => {
      (dup.pricing || []).forEach(price => {
        const exists = allPricing.some(p => 
          p.tier === price.tier && p.price === price.price
        );
        if (!exists) {
          allPricing.push(price);
        }
      });
    });
    merged.pricing = allPricing;

    return merged;
  }
}