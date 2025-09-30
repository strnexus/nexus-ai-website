// AI Tools Database Schema
// Comprehensive TypeScript interfaces for the entire database structure

export interface AITool {
  id: string;
  name: string;
  slug: string; // URL-friendly version of name
  description: string;
  tagline?: string; // Short compelling description
  
  // Categorization
  categories: Category[];
  industry_focus: Industry[];
  business_size: BusinessSize[];
  use_cases: UseCase[];
  
  // Pricing & Business Model
  pricing_model: PricingModel;
  pricing_details: PricingDetails;
  roi_metrics?: ROIMetric[];
  
  // Implementation Details
  ease_of_use: number; // 1-5 scale (1 = very easy)
  setup_time: string; // e.g., "15 minutes", "2 hours", "1 week"
  technical_complexity: TechnicalComplexity;
  
  // External Information
  website_url: string;
  logo_url?: string;
  screenshot_url?: string;
  
  // Features & Capabilities
  key_features: string[];
  integrations: Integration[];
  ai_capabilities: AICapability[];
  
  // Quality & Reliability
  status: ToolStatus;
  rating?: number; // 1-5 stars
  review_count?: number;
  uptime_sla?: number; // percentage
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  last_verified_at?: Date;
  source: DataSource;
  
  // SEO & Marketing
  meta_description?: string;
  keywords?: string[];
  
  // Analytics
  popularity_score?: number;
  trending_score?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string; // Icon name or URL
  parent_id?: string; // For hierarchical categories
  color?: string; // Hex color for UI
}

export interface Industry {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  typical_challenges?: string[];
  key_metrics?: string[];
}

export type BusinessSize = 'micro' | 'small' | 'medium' | 'large' | 'enterprise';

export interface UseCase {
  id: string;
  title: string;
  description: string;
  industry?: string;
  roi_expectation?: string;
  implementation_time?: string;
}

export type PricingModel = 'free' | 'freemium' | 'subscription' | 'one_time' | 'usage_based' | 'custom' | 'enterprise';

export interface PricingDetails {
  free_tier?: boolean;
  starting_price?: number;
  starting_price_currency?: string;
  starting_price_period?: 'month' | 'year' | 'one_time' | 'usage';
  price_ranges?: PriceRange[];
  custom_pricing?: boolean;
  free_trial_days?: number;
}

export interface PriceRange {
  tier_name: string;
  price: number;
  currency: string;
  period: 'month' | 'year' | 'one_time';
  features: string[];
  user_limit?: number;
}

export interface ROIMetric {
  metric: string; // e.g., "time saved", "cost reduction", "revenue increase"
  value: string; // e.g., "2 hours/day", "30% cost reduction"
  timeframe?: string; // e.g., "per month", "annually"
  source?: string; // Where this metric came from
}

export type TechnicalComplexity = 'no_code' | 'low_code' | 'technical' | 'developer_required';

export interface Integration {
  name: string;
  category: string; // e.g., "CRM", "Email", "Calendar"
  type: 'native' | 'api' | 'zapier' | 'webhook';
  setup_difficulty?: 'easy' | 'medium' | 'hard';
}

export type AICapability = 
  | 'natural_language_processing'
  | 'computer_vision' 
  | 'speech_recognition'
  | 'speech_synthesis'
  | 'predictive_analytics'
  | 'recommendation_engine'
  | 'automation'
  | 'content_generation'
  | 'data_analysis'
  | 'sentiment_analysis'
  | 'chatbot'
  | 'virtual_assistant';

export type ToolStatus = 'active' | 'beta' | 'deprecated' | 'coming_soon' | 'inactive';

export type DataSource = 'manual' | 'api_scrape' | 'product_hunt' | 'user_submission' | 'ai_discovery';

// User & Business Context
export interface User {
  id: string;
  email: string;
  name?: string;
  company?: string;
  role?: string;
  industry?: Industry;
  business_size?: BusinessSize;
  
  // Subscription & Limits
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  credits_used?: number;
  credits_limit?: number;
  
  // Preferences
  favorite_tools: string[]; // Tool IDs
  hidden_tools?: string[];
  notification_preferences?: NotificationPreference[];
  
  // Metadata
  created_at: Date;
  last_login_at?: Date;
  onboarding_completed?: boolean;
}

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'past_due';

export interface NotificationPreference {
  type: 'new_tools' | 'price_changes' | 'feature_updates' | 'industry_insights';
  enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
}

// Search & Discovery
export interface SearchQuery {
  query?: string;
  categories?: string[];
  industries?: string[];
  business_sizes?: BusinessSize[];
  pricing_models?: PricingModel[];
  max_price?: number;
  min_rating?: number;
  ai_capabilities?: AICapability[];
  sort_by?: 'relevance' | 'popularity' | 'price' | 'rating' | 'newest';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  tools: AITool[];
  total_count: number;
  facets?: SearchFacets;
  suggestions?: string[];
  query_time_ms?: number;
}

export interface SearchFacets {
  categories: FacetCount[];
  industries: FacetCount[];
  pricing_models: FacetCount[];
  business_sizes: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
}

// Analytics & Insights
export interface ToolAnalytics {
  tool_id: string;
  views: number;
  clicks: number;
  favorites: number;
  user_ratings: UserRating[];
  usage_trends: TimeSeries[];
  industry_breakdown: IndustryUsage[];
}

export interface UserRating {
  user_id: string;
  rating: number; // 1-5
  review?: string;
  pros?: string[];
  cons?: string[];
  created_at: Date;
}

export interface TimeSeries {
  date: Date;
  value: number;
}

export interface IndustryUsage {
  industry: string;
  usage_count: number;
  percentage: number;
}

// Nova AI Assistant Types
export interface NovaConversation {
  id: string;
  user_id: string;
  messages: NovaMessage[];
  context?: ConversationContext;
  created_at: Date;
  updated_at: Date;
}

export interface NovaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tools_mentioned?: string[]; // Tool IDs referenced
  action_taken?: NovaAction;
}

export interface NovaAction {
  type: 'tool_recommendation' | 'search_performed' | 'calculator_used' | 'booking_scheduled';
  details: Record<string, any>;
}

export interface ConversationContext {
  user_industry?: string;
  business_size?: BusinessSize;
  current_tools?: string[];
  pain_points?: string[];
  budget_range?: string;
  urgency?: 'low' | 'medium' | 'high';
}

// Export all types for easy importing
export * from './database';