// Re-export the schema types from our documentation
// This matches the schema defined in data-schema-and-quality-rules.md

export interface AITool {
  // Primary Identifiers
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description: string;
  
  // URLs and Links
  website: string;
  logo?: string;
  screenshot?: string;
  
  // Categorization
  categories: Category[];
  tags: string[];
  industries: Industry[];
  businessTypes: BusinessType[];
  useCases: string[];
  
  // Pricing Information
  pricing: PricingInfo;
  
  // Features & Capabilities
  features: Feature[];
  integrations: Integration[];
  
  // Quality & Scoring
  qualityScore: QualityScore;
  smbRelevanceScore: number;
  
  // Metadata
  status: ToolStatus;
  sourceInfo: SourceInfo;
  createdAt: Date;
  updatedAt: Date;
  lastVerified: Date;
  
  // Analytics
  popularity?: PopularityMetrics;
  reviews?: ReviewSummary;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent?: string;
  description?: string;
  icon?: string;
}

export interface Industry {
  id: string;
  name: string;
  slug: string;
  description: string;
  keywords: string[];
}

export interface BusinessType {
  id: string;
  name: string;
  employeeRange: string;
  revenueRange?: string;
  description: string;
}

export interface PricingInfo {
  model: PricingModel;
  hasFree: boolean;
  freeDescription?: string;
  startingPrice?: number;
  currency: string;
  billingCycle?: BillingCycle;
  priceRange?: PriceRange;
  customPricing?: boolean;
  trialInfo?: TrialInfo;
  pricingUrl?: string;
}

export type PricingModel = 
  | 'free'
  | 'freemium' 
  | 'subscription'
  | 'one-time'
  | 'usage-based'
  | 'custom'
  | 'contact-sales';

export type BillingCycle = 'monthly' | 'yearly' | 'one-time' | 'usage-based';

export interface PriceRange {
  min: number;
  max: number;
  description: string;
}

export interface TrialInfo {
  hasTrial: boolean;
  trialDays?: number;
  trialDescription?: string;
}

export interface Feature {
  name: string;
  description?: string;
  category: FeatureCategory;
  isCore: boolean;
  availableIn: string[];
}

export type FeatureCategory = 
  | 'core-functionality'
  | 'integration'
  | 'analytics'
  | 'collaboration'
  | 'security'
  | 'support'
  | 'customization';

export interface Integration {
  name: string;
  type: IntegrationType;
  category: string;
  url?: string;
  description?: string;
  isNative: boolean;
}

export type IntegrationType = 
  | 'api'
  | 'webhook'
  | 'zapier'
  | 'native'
  | 'plugin'
  | 'export-import';

export interface QualityScore {
  overall: number;
  dataCompleteness: number;
  credibilityScore: number;
  freshnessScore: number;
  userRating?: number;
  flags: QualityFlag[];
}

export interface QualityFlag {
  type: QualityFlagType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  detectedAt: Date;
}

export type QualityFlagType = 
  | 'incomplete-data'
  | 'outdated-info'
  | 'broken-links'
  | 'pricing-unclear'
  | 'spam-detected'
  | 'duplicate-suspected'
  | 'enterprise-only'
  | 'discontinued';

export type ToolStatus = 'active' | 'inactive' | 'discontinued' | 'pending';

export interface SourceInfo {
  primarySource: DataSourceType;
  sources: SourceEntry[];
  lastSourceUpdate: Date;
  confidence: number;
}

export interface SourceEntry {
  source: DataSourceType;
  sourceId: string;
  url?: string;
  lastSeen: Date;
  status: 'active' | 'removed' | 'updated';
}

export type DataSourceType = 
  | 'theresanaiforthat'
  | 'producthunt'
  | 'yc-companies'
  | 'futuretools'
  | 'manual-entry'
  | 'website-analysis'
  | 'user-submission';

export interface PopularityMetrics {
  productHuntVotes?: number;
  githubStars?: number;
  twitterMentions?: number;
  trafficRank?: number;
  trendinessScore: number;
  lastUpdated: Date;
}

export interface ReviewSummary {
  averageRating?: number;
  reviewCount?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  commonPraise?: string[];
  commonComplaints?: string[];
  lastReviewDate?: Date;
}

// Constants
export const PRIMARY_CATEGORIES = [
  'marketing-sales',
  'customer-service',
  'productivity-automation',
  'content-creation',
  'data-analytics',
  'communication',
  'finance-accounting',
  'hr-management',
  'operations-logistics',
  'website-ecommerce'
] as const;

export const SMB_INDUSTRIES = [
  'professional-services',
  'retail-ecommerce',
  'healthcare-wellness',
  'real-estate',
  'restaurants-hospitality',
  'construction-trades',
  'education-training',
  'creative-agencies',
  'consulting',
  'manufacturing'
] as const;