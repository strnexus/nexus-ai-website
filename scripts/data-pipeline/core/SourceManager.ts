import { logger } from '../utils/logger';
import { RateLimiter } from '../utils/RateLimiter';
import { AITool } from '../types/schema';
import { SourceConfig, RawToolData } from '../types/sources';

// Source implementations
import { ThereIsAnAIForThatSource } from '../sources/ThereIsAnAIForThatSource';
import { ProductHuntSource } from '../sources/ProductHuntSource';
import { YCombinatorSource } from '../sources/YCombinatorSource';
import { FutureToolsSource } from '../sources/FutureToolsSource';

export class SourceManager {
  private sources: Map<string, any> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();

  constructor(private config: SourceConfig[]) {
    this.initializeSources();
  }

  private initializeSources(): void {
    for (const sourceConfig of this.config) {
      let source: any;

      switch (sourceConfig.type) {
        case 'theresanaiforthat':
          source = new ThereIsAnAIForThatSource(sourceConfig);
          break;
        case 'producthunt':
          source = new ProductHuntSource(sourceConfig);
          break;
        case 'ycombinator':
          source = new YCombinatorSource(sourceConfig);
          break;
        case 'futuretools':
          source = new FutureToolsSource(sourceConfig);
          break;
        default:
          logger.warn(`Unknown source type: ${sourceConfig.type}`);
          continue;
      }

      this.sources.set(sourceConfig.name, source);
      
      // Initialize rate limiter for this source
      this.rateLimiters.set(sourceConfig.name, new RateLimiter({
        requests: sourceConfig.rateLimit.requests,
        period: sourceConfig.rateLimit.period,
        backoffMs: sourceConfig.retryConfig.backoffMs
      }));

      logger.info(`✅ Initialized source: ${sourceConfig.name}`);
    }
  }

  async fetchAll(options: {
    sourceFilter?: string;
  } = {}): Promise<RawToolData[]> {
    const allData: RawToolData[] = [];
    const errors: string[] = [];

    const sourcesToProcess = options.sourceFilter
      ? [options.sourceFilter]
      : Array.from(this.sources.keys());

    logger.info(`📥 Fetching from ${sourcesToProcess.length} sources...`);

    // Process sources in parallel but with rate limiting
    const promises = sourcesToProcess.map(async (sourceName) => {
      try {
        const source = this.sources.get(sourceName);
        const rateLimiter = this.rateLimiters.get(sourceName);

        if (!source || !rateLimiter) {
          throw new Error(`Source ${sourceName} not found or not configured`);
        }

        logger.info(`📡 Fetching from ${sourceName}...`);
        
        // Apply rate limiting
        await rateLimiter.acquire();
        
        const startTime = Date.now();
        const data = await source.fetchAll();
        const duration = Date.now() - startTime;
        
        logger.info(`✅ ${sourceName}: fetched ${data.length} tools in ${duration}ms`);
        
        // Tag data with source information
        return data.map((item: RawToolData) => ({
          ...item,
          _source: sourceName,
          _fetchedAt: new Date()
        }));

      } catch (error) {
        logger.error(`❌ Failed to fetch from ${sourceName}:`, error);
        errors.push(`${sourceName}: ${error.message}`);
        return [];
      }
    });

    const results = await Promise.all(promises);
    
    // Flatten results
    for (const result of results) {
      allData.push(...result);
    }

    if (errors.length > 0) {
      logger.warn(`⚠️ Source fetch errors:`, errors);
    }

    logger.info(`✅ Total fetched: ${allData.length} tools from ${sourcesToProcess.length} sources`);
    return allData;
  }

  async fetchFromSource(sourceName: string): Promise<RawToolData[]> {
    const source = this.sources.get(sourceName);
    const rateLimiter = this.rateLimiters.get(sourceName);

    if (!source || !rateLimiter) {
      throw new Error(`Source ${sourceName} not found or not configured`);
    }

    await rateLimiter.acquire();
    
    const data = await source.fetchAll();
    
    return data.map((item: RawToolData) => ({
      ...item,
      _source: sourceName,
      _fetchedAt: new Date()
    }));
  }

  async transform(rawData: RawToolData): Promise<AITool> {
    const sourceName = rawData._source;
    const source = this.sources.get(sourceName);

    if (!source) {
      throw new Error(`Source ${sourceName} not found for transformation`);
    }

    if (!source.transform) {
      throw new Error(`Source ${sourceName} does not implement transform method`);
    }

    try {
      const tool = await source.transform(rawData);
      
      // Add source information
      tool.sourceInfo = {
        primarySource: sourceName as any,
        sources: [{
          source: sourceName as any,
          sourceId: rawData.id || rawData._id || generateId(),
          lastSeen: new Date(),
          status: 'active'
        }],
        lastSourceUpdate: new Date(),
        confidence: this.calculateSourceConfidence(sourceName, rawData)
      };

      return tool;
    } catch (error) {
      logger.error(`❌ Failed to transform data from ${sourceName}:`, error);
      throw error;
    }
  }

  async healthCheck(): Promise<number> {
    const healthResults = await Promise.allSettled(
      Array.from(this.sources.entries()).map(async ([name, source]) => {
        try {
          if (source.healthCheck) {
            const healthy = await source.healthCheck();
            return { name, healthy };
          } else {
            // Basic connectivity test
            const rateLimiter = this.rateLimiters.get(name);
            await rateLimiter?.acquire();
            const testResult = await source.fetchAll({ limit: 1 });
            return { name, healthy: testResult.length >= 0 };
          }
        } catch (error) {
          logger.debug(`Health check failed for ${name}:`, error.message);
          return { name, healthy: false };
        }
      })
    );

    const healthyCount = healthResults.filter((result) => 
      result.status === 'fulfilled' && result.value.healthy
    ).length;

    const healthPercentage = Math.round((healthyCount / this.sources.size) * 100);
    
    logger.debug(`📊 Source health: ${healthPercentage}% (${healthyCount}/${this.sources.size})`);
    return healthPercentage;
  }

  getActiveSources(): string[] {
    return Array.from(this.sources.keys());
  }

  getSourceCount(): number {
    return this.sources.size;
  }

  private calculateSourceConfidence(sourceName: string, rawData: RawToolData): number {
    // Base confidence on source reliability and data completeness
    let confidence = 70; // Base confidence

    // Source-specific confidence adjustments
    switch (sourceName) {
      case 'theresanaiforthat':
        confidence = 85; // High quality, curated source
        break;
      case 'producthunt':
        confidence = 80; // Good quality, community-driven
        break;
      case 'ycombinator':
        confidence = 90; // Very high quality, vetted companies
        break;
      case 'futuretools':
        confidence = 75; // Good curation, but less standardized
        break;
      default:
        confidence = 60; // Unknown sources get lower confidence
    }

    // Adjust based on data completeness
    const requiredFields = ['name', 'description', 'website'];
    const presentFields = requiredFields.filter(field => 
      rawData[field] && String(rawData[field]).trim().length > 0
    );
    
    const completenessRatio = presentFields.length / requiredFields.length;
    confidence *= completenessRatio;

    // Bonus for additional useful fields
    const bonusFields = ['pricing', 'categories', 'features'];
    const bonusPresent = bonusFields.filter(field => 
      rawData[field] && (Array.isArray(rawData[field]) ? rawData[field].length > 0 : true)
    ).length;
    
    confidence += bonusPresent * 3; // 3 point bonus per additional field

    return Math.min(100, Math.round(confidence));
  }
}

// Helper function to generate IDs for sources that don't provide them
function generateId(): string {
  return `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}