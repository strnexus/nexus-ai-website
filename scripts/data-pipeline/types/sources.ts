import { AITool } from './schema';

export interface DataSource {
  fetchAll(options?: { limit?: number }): Promise<RawToolData[]>;
  fetchById?(id: string): Promise<RawToolData | null>;
  transform(rawData: RawToolData): Promise<AITool>;
  healthCheck?(): Promise<boolean>;
}

export interface RawToolData {
  id?: string;
  _id?: string;
  name: string;
  title?: string;
  description?: string;
  tagline?: string;
  subtitle?: string;
  website?: string;
  url?: string;
  link?: string;
  logo?: string;
  logo_url?: string;
  image?: string;
  screenshot?: string;
  screenshot_url?: string;
  categories?: any[];
  tags?: string[];
  pricing?: any;
  features?: any[];
  integrations?: any[];
  status?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  popularity_score?: number;
  votes?: number;
  use_cases?: string[];
  useCases?: string[];
  
  // Internal metadata added by pipeline
  _source?: string;
  _fetchedAt?: Date;
  _confidence?: number;
}

export interface SourceConfig {
  name: string;
  type: SourceType;
  baseUrl: string;
  enabled: boolean;
  credentials: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
  };
  rateLimit: {
    requests: number;
    period: 'hour' | 'day' | 'minute';
  };
  retryConfig: {
    maxRetries: number;
    backoffMs: number;
  };
  customConfig?: Record<string, any>;
}

export type SingleSourceConfig = SourceConfig;

export type SourceType = 
  | 'theresanaiforthat'
  | 'producthunt' 
  | 'ycombinator'
  | 'futuretools'
  | 'github'
  | 'reddit'
  | 'twitter';

// Source-specific raw data interfaces

export interface TAIFTRawData {
  id: string;
  name: string;
  description: string;
  tagline?: string;
  website: string;
  logo?: string;
  screenshot?: string;
  categories: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  tags: string[];
  pricing: {
    model: string;
    has_free: boolean;
    free_description?: string;
    starting_price?: number | string;
    currency: string;
    billing_cycle?: string;
    custom_pricing?: boolean;
    pricing_url?: string;
    trial?: {
      days: number;
      description?: string;
    };
  };
  features: Array<{
    name: string;
    description?: string;
  }>;
  integrations: Array<{
    name: string;
    type?: string;
    url?: string;
    description?: string;
    native?: boolean;
  }>;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  popularity_score: number;
  use_cases: string[];
}

export interface ProductHuntRawData {
  id: string;
  name: string;
  tagline: string;
  description?: string;
  url: string;
  website?: string;
  logo?: string;
  screenshot_url?: string;
  topics: Array<{
    name: string;
  }>;
  makers: Array<{
    name: string;
  }>;
  votes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  featured_at?: string;
}

export interface YCombinatorRawData {
  name: string;
  description: string;
  website: string;
  batch: string;
  tags: string[];
  status: 'active' | 'inactive' | 'acquired' | 'closed';
  founded_year?: number;
  team_size?: string;
  location?: string;
  scraped_at: string;
}

export interface FutureToolsRawData {
  id?: string;
  name: string;
  description: string;
  website: string;
  logo?: string;
  category: string;
  tags: string[];
  pricing_model?: string;
  free_tier?: boolean;
  rating?: number;
  features?: string[];
  scraped_at: string;
}

// Source response wrappers
export interface SourceResponse<T = any> {
  data: T[];
  meta?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next_page: boolean;
  };
  errors?: Array<{
    message: string;
    code?: string;
  }>;
}

// Source health check results
export interface SourceHealthCheck {
  source: string;
  healthy: boolean;
  responseTime?: number;
  lastError?: string;
  checkedAt: Date;
}