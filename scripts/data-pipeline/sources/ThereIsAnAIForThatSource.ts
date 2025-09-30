import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { AITool, Category, PricingInfo } from '../types/schema';
import { SourceConfig, RawToolData, DataSource } from '../types/sources';
import { createSlug } from '../utils/helpers';

export class ThereIsAnAIForThatSource implements DataSource {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(private config: SourceConfig) {
    this.apiKey = config.credentials.apiKey;
    
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Nexus-AI-Pipeline/1.0'
      }
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`🌐 TAIFT API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('❌ TAIFT API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`✅ TAIFT API Response: ${response.status} - ${response.data?.length || 0} items`);
        return response;
      },
      (error) => {
        if (error.response?.status === 429) {
          logger.warn('⚠️ TAIFT Rate limit hit, will retry with backoff');
        } else if (error.response?.status === 401) {
          logger.error('🔐 TAIFT Authentication failed - check API key');
        }
        return Promise.reject(error);
      }
    );
  }

  async fetchAll(options: { limit?: number } = {}): Promise<RawToolData[]> {
    const tools: RawToolData[] = [];
    let page = 1;
    const limit = options.limit || 1000; // Default limit
    const perPage = 50; // API pagination size

    try {
      while (tools.length < limit) {
        logger.debug(`📄 Fetching TAIFT page ${page}...`);
        
        const response = await this.client.get('/tools', {
          params: {
            page,
            per_page: perPage,
            include: 'categories,pricing,features',
            status: 'active'
          }
        });

        const pageData = response.data.data || response.data;
        
        if (!Array.isArray(pageData) || pageData.length === 0) {
          logger.debug('📄 No more data from TAIFT, stopping pagination');
          break;
        }

        // Transform and add to collection
        for (const item of pageData) {
          if (tools.length >= limit) break;
          
          tools.push(this.normalizeRawData(item));
        }

        page++;
        
        // Check if we've reached the end
        const totalPages = response.data.meta?.total_pages || 
                          response.data.pagination?.total_pages;
        
        if (totalPages && page > totalPages) {
          break;
        }

        // Respect rate limiting between requests
        await this.delay(200); // 200ms between requests
      }

      logger.info(`✅ TAIFT: Fetched ${tools.length} tools`);
      return tools;

    } catch (error) {
      logger.error('❌ TAIFT fetch failed:', error);
      throw new Error(`TAIFT API error: ${error.message}`);
    }
  }

  async fetchById(id: string): Promise<RawToolData | null> {
    try {
      const response = await this.client.get(`/tools/${id}`, {
        params: {
          include: 'categories,pricing,features'
        }
      });

      return this.normalizeRawData(response.data.data || response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async transform(rawData: RawToolData): Promise<AITool> {
    const tool: AITool = {
      id: `taift_${rawData.id}`,
      slug: createSlug(rawData.name),
      name: rawData.name,
      tagline: rawData.tagline || rawData.description?.substring(0, 100),
      description: rawData.description || rawData.tagline || '',
      website: rawData.website || rawData.url,
      logo: rawData.logo || rawData.image,
      screenshot: rawData.screenshot,
      
      categories: this.transformCategories(rawData.categories || []),
      tags: rawData.tags || [],
      industries: [], // Will be inferred from categories
      businessTypes: [], // Will be inferred from pricing
      useCases: rawData.use_cases || rawData.useCases || [],
      
      pricing: this.transformPricing(rawData.pricing),
      features: this.transformFeatures(rawData.features || []),
      integrations: this.transformIntegrations(rawData.integrations || []),
      
      qualityScore: {
        overall: 0, // Will be calculated by QualityValidator
        dataCompleteness: 0,
        credibilityScore: 0,
        freshnessScore: 0,
        flags: []
      },
      smbRelevanceScore: 0, // Will be calculated by QualityValidator
      
      status: rawData.status === 'active' ? 'active' : 'inactive',
      sourceInfo: {
        primarySource: 'theresanaiforthat',
        sources: [],
        lastSourceUpdate: new Date(),
        confidence: 0
      },
      
      createdAt: new Date(rawData.created_at || Date.now()),
      updatedAt: new Date(rawData.updated_at || Date.now()),
      lastVerified: new Date(),
      
      popularity: {
        trendinessScore: rawData.popularity_score || 0,
        lastUpdated: new Date()
      }
    };

    // Validate required fields
    if (!tool.name || !tool.website) {
      throw new Error(`Invalid tool data: missing required fields (name: ${!!tool.name}, website: ${!!tool.website})`);
    }

    return tool;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/tools', {
        params: { per_page: 1 },
        timeout: 10000
      });
      
      return response.status === 200;
    } catch (error) {
      logger.debug('TAIFT health check failed:', error.message);
      return false;
    }
  }

  private normalizeRawData(item: any): RawToolData {
    return {
      id: item.id,
      name: item.name || item.title,
      description: item.description || item.tagline,
      tagline: item.tagline || item.subtitle,
      website: item.website || item.url || item.link,
      logo: item.logo || item.logo_url || item.image,
      screenshot: item.screenshot || item.screenshot_url,
      categories: item.categories || [],
      tags: item.tags || [],
      pricing: item.pricing,
      features: item.features || [],
      integrations: item.integrations || [],
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      popularity_score: item.popularity_score || item.votes || 0,
      use_cases: item.use_cases || item.useCases
    };
  }

  private transformCategories(rawCategories: any[]): Category[] {
    return rawCategories.map(cat => ({
      id: cat.id || createSlug(cat.name || cat),
      name: cat.name || String(cat),
      slug: createSlug(cat.name || cat),
      description: cat.description
    }));
  }

  private transformPricing(rawPricing: any): PricingInfo {
    if (!rawPricing || typeof rawPricing !== 'object') {
      return {
        model: 'custom',
        hasFree: false,
        currency: 'USD'
      };
    }

    return {
      model: this.normalizePricingModel(rawPricing.model || rawPricing.type),
      hasFree: Boolean(rawPricing.has_free || rawPricing.free),
      freeDescription: rawPricing.free_description,
      startingPrice: this.parsePrice(rawPricing.starting_price || rawPricing.price),
      currency: rawPricing.currency || 'USD',
      billingCycle: rawPricing.billing_cycle || 'monthly',
      customPricing: Boolean(rawPricing.custom_pricing),
      trialInfo: rawPricing.trial ? {
        hasTrial: true,
        trialDays: rawPricing.trial.days,
        trialDescription: rawPricing.trial.description
      } : { hasTrial: false },
      pricingUrl: rawPricing.pricing_url || rawPricing.url
    };
  }

  private normalizePricingModel(model: string): PricingInfo['model'] {
    if (!model) return 'custom';
    
    const normalized = model.toLowerCase();
    if (normalized.includes('free')) return 'free';
    if (normalized.includes('freemium')) return 'freemium';
    if (normalized.includes('subscription')) return 'subscription';
    if (normalized.includes('one-time')) return 'one-time';
    if (normalized.includes('usage')) return 'usage-based';
    if (normalized.includes('contact')) return 'contact-sales';
    
    return 'custom';
  }

  private parsePrice(priceStr: any): number | undefined {
    if (typeof priceStr === 'number') return priceStr;
    if (typeof priceStr !== 'string') return undefined;
    
    // Extract number from string like "$29/month", "€50", "£100"
    const match = priceStr.match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    
    return undefined;
  }

  private transformFeatures(rawFeatures: any[]): any[] {
    return rawFeatures.map(feature => ({
      name: feature.name || String(feature),
      description: feature.description,
      category: 'core-functionality',
      isCore: true,
      availableIn: ['all']
    }));
  }

  private transformIntegrations(rawIntegrations: any[]): any[] {
    return rawIntegrations.map(integration => ({
      name: integration.name || String(integration),
      type: integration.type || 'api',
      category: integration.category || 'general',
      url: integration.url,
      description: integration.description,
      isNative: Boolean(integration.native)
    }));
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}