# Data Schema & Quality Rules Design

## Overview
This document defines the unified data schema for AI tools and establishes quality rules to ensure SMB-relevant, high-quality data in the Nexus AI tools database.

---

## UNIFIED DATA SCHEMA

### Core Tool Entity
```typescript
interface AITool {
  // Primary Identifiers
  id: string;                    // Internal UUID
  slug: string;                  // URL-friendly identifier
  name: string;                  // Tool name
  tagline?: string;              // Brief description/slogan
  description: string;           // Detailed description (max 500 chars)
  
  // URLs and Links
  website: string;               // Primary website URL
  logo?: string;                 // Logo image URL
  screenshot?: string;           // Product screenshot URL
  
  // Categorization
  categories: Category[];        // Primary categories
  tags: string[];               // Flexible tagging system
  industries: Industry[];       // Target industries
  businessTypes: BusinessType[]; // Target business sizes
  useCases: string[];           // Specific use cases
  
  // Pricing Information
  pricing: PricingInfo;
  
  // Features & Capabilities
  features: Feature[];
  integrations: Integration[];
  
  // Quality & Scoring
  qualityScore: QualityScore;
  smbRelevanceScore: number;     // 0-100
  
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
```

### Supporting Types

#### Categories (Hierarchical)
```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  parent?: string;              // Parent category ID
  description?: string;
  icon?: string;
}

// Primary Categories for SMBs
const PRIMARY_CATEGORIES = [
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
```

#### Business Types & Industries
```typescript
interface BusinessType {
  id: string;
  name: string;
  employeeRange: string;        // "1-10", "11-50", "51-200"
  revenueRange?: string;        // "$0-1M", "$1M-10M"
  description: string;
}

interface Industry {
  id: string;
  name: string;
  slug: string;
  description: string;
  keywords: string[];           // For matching
}

// SMB-Focused Industries
const SMB_INDUSTRIES = [
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
```

#### Pricing Information
```typescript
interface PricingInfo {
  model: PricingModel;
  hasFree: boolean;
  freeDescription?: string;      // What's included in free tier
  startingPrice?: number;
  currency: string;              // Default: USD
  billingCycle?: BillingCycle;
  priceRange?: PriceRange;
  customPricing?: boolean;
  trialInfo?: TrialInfo;
  pricingUrl?: string;           // Link to pricing page
}

type PricingModel = 
  | 'free'
  | 'freemium' 
  | 'subscription'
  | 'one-time'
  | 'usage-based'
  | 'custom'
  | 'contact-sales';

type BillingCycle = 'monthly' | 'yearly' | 'one-time' | 'usage-based';

interface PriceRange {
  min: number;
  max: number;
  description: string;          // e.g., "per user per month"
}

interface TrialInfo {
  hasTrial: boolean;
  trialDays?: number;
  trialDescription?: string;
}
```

#### Features & Integrations
```typescript
interface Feature {
  name: string;
  description?: string;
  category: FeatureCategory;
  isCore: boolean;              // Core feature vs add-on
  availableIn: string[];        // Which pricing tiers
}

type FeatureCategory = 
  | 'core-functionality'
  | 'integration'
  | 'analytics'
  | 'collaboration'
  | 'security'
  | 'support'
  | 'customization';

interface Integration {
  name: string;
  type: IntegrationType;
  category: string;
  url?: string;
  description?: string;
  isNative: boolean;            // Native vs third-party integration
}

type IntegrationType = 
  | 'api'
  | 'webhook'
  | 'zapier'
  | 'native'
  | 'plugin'
  | 'export-import';
```

#### Quality & Scoring
```typescript
interface QualityScore {
  overall: number;              // 0-100 composite score
  dataCompleteness: number;     // How complete is the data
  credibilityScore: number;     // Source credibility
  freshnessScore: number;       // How recent is the data
  userRating?: number;          // If available from reviews
  
  // Quality flags
  flags: QualityFlag[];
}

interface QualityFlag {
  type: QualityFlagType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  detectedAt: Date;
}

type QualityFlagType = 
  | 'incomplete-data'
  | 'outdated-info'
  | 'broken-links'
  | 'pricing-unclear'
  | 'spam-detected'
  | 'duplicate-suspected'
  | 'enterprise-only'
  | 'discontinued';
```

#### Source Information
```typescript
interface SourceInfo {
  primarySource: DataSource;
  sources: SourceEntry[];       // All sources this tool appears in
  lastSourceUpdate: Date;
  confidence: number;           // 0-100 confidence in data accuracy
}

interface SourceEntry {
  source: DataSource;
  sourceId: string;             // ID in source system
  url?: string;                 // Source URL
  lastSeen: Date;
  status: 'active' | 'removed' | 'updated';
}

type DataSource = 
  | 'theresanaiforthat'
  | 'producthunt'
  | 'yc-companies'
  | 'futuretools'
  | 'manual-entry'
  | 'website-analysis'
  | 'user-submission';
```

#### Analytics & Reviews
```typescript
interface PopularityMetrics {
  productHuntVotes?: number;
  githubStars?: number;
  twitterMentions?: number;
  trafficRank?: number;
  trendinessScore: number;      // 0-100 based on multiple factors
  lastUpdated: Date;
}

interface ReviewSummary {
  averageRating?: number;       // 1-5 stars
  reviewCount?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  commonPraise?: string[];
  commonComplaints?: string[];
  lastReviewDate?: Date;
}
```

---

## QUALITY RULES & FILTERS

### 1. SMB Relevance Scoring Algorithm

```typescript
function calculateSMBRelevanceScore(tool: AITool): number {
  let score = 0;
  
  // Pricing Relevance (40% weight)
  const pricingScore = evaluatePricingForSMB(tool.pricing);
  score += pricingScore * 0.4;
  
  // Target Audience (30% weight)
  const targetScore = evaluateTargetAudience(tool);
  score += targetScore * 0.3;
  
  // Features Complexity (20% weight)
  const complexityScore = evaluateComplexity(tool.features);
  score += complexityScore * 0.2;
  
  // Use Case Alignment (10% weight)
  const useCaseScore = evaluateUseCases(tool.useCases);
  score += useCaseScore * 0.1;
  
  return Math.round(score);
}

function evaluatePricingForSMB(pricing: PricingInfo): number {
  // Free tools get high score
  if (pricing.hasFree) return 90;
  
  // Freemium gets good score
  if (pricing.model === 'freemium') return 85;
  
  // Check starting price thresholds
  if (!pricing.startingPrice) return 50; // Unknown pricing
  
  if (pricing.startingPrice <= 25) return 90;
  if (pricing.startingPrice <= 50) return 80;
  if (pricing.startingPrice <= 100) return 70;
  if (pricing.startingPrice <= 200) return 60;
  if (pricing.startingPrice <= 500) return 40;
  
  return 20; // Too expensive for SMB
}
```

### 2. Quality Validation Rules

#### Must-Have Data (Blocking)
```typescript
const REQUIRED_FIELDS: (keyof AITool)[] = [
  'name',
  'description',
  'website',
  'categories'
];

const MINIMUM_DESCRIPTION_LENGTH = 50;
const MAXIMUM_DESCRIPTION_LENGTH = 500;
```

#### Quality Filters (Scoring)
```typescript
interface QualityRule {
  name: string;
  check: (tool: AITool) => QualityRuleResult;
  weight: number;               // Impact on quality score
  required: boolean;            // Blocking vs scoring
}

const QUALITY_RULES: QualityRule[] = [
  {
    name: 'valid-website',
    check: (tool) => validateWebsite(tool.website),
    weight: 20,
    required: true
  },
  {
    name: 'pricing-clarity',
    check: (tool) => validatePricing(tool.pricing),
    weight: 15,
    required: false
  },
  {
    name: 'description-quality',
    check: (tool) => validateDescription(tool.description),
    weight: 15,
    required: true
  },
  {
    name: 'categorization-accuracy',
    check: (tool) => validateCategories(tool.categories),
    weight: 10,
    required: true
  },
  {
    name: 'feature-completeness',
    check: (tool) => validateFeatures(tool.features),
    weight: 10,
    required: false
  }
];
```

### 3. Exclusion Rules (No All-in-Ones like Canva)

```typescript
// Tools to exclude based on characteristics
const EXCLUSION_RULES = [
  {
    name: 'all-in-one-platforms',
    description: 'Exclude overly broad platforms that do everything',
    check: (tool: AITool): boolean => {
      const allInOneKeywords = [
        'all-in-one',
        'complete platform',
        'everything you need',
        'entire workflow',
        'full suite'
      ];
      
      const hasAllInOneKeywords = allInOneKeywords.some(keyword =>
        tool.description.toLowerCase().includes(keyword) ||
        tool.tagline?.toLowerCase().includes(keyword)
      );
      
      const tooManyCategories = tool.categories.length > 4;
      const tooManyUseCases = tool.useCases.length > 8;
      
      return hasAllInOneKeywords || tooManyCategories || tooManyUseCases;
    }
  },
  {
    name: 'enterprise-only',
    description: 'Exclude enterprise-only solutions',
    check: (tool: AITool): boolean => {
      const enterpriseKeywords = [
        'enterprise',
        'large organization',
        'fortune 500',
        'contact sales',
        'custom deployment'
      ];
      
      const hasEnterpriseKeywords = enterpriseKeywords.some(keyword =>
        tool.description.toLowerCase().includes(keyword)
      );
      
      const expensivePricing = tool.pricing.startingPrice && 
        tool.pricing.startingPrice > 1000;
      
      const onlyCustomPricing = tool.pricing.model === 'custom' && 
        !tool.pricing.hasFree;
      
      return hasEnterpriseKeywords || expensivePricing || onlyCustomPricing;
    }
  },
  {
    name: 'discontinued-tools',
    description: 'Exclude tools that are no longer available',
    check: (tool: AITool): boolean => {
      return tool.status === 'discontinued' || 
             tool.qualityScore.flags.some(flag => 
               flag.type === 'discontinued' && flag.severity === 'high'
             );
    }
  }
];
```

### 4. Deduplication Logic

```typescript
interface DeduplicationResult {
  duplicates: DuplicateGroup[];
  unique: AITool[];
  merged: AITool[];
}

interface DuplicateGroup {
  primary: AITool;              // Keep this one
  duplicates: AITool[];         // Merge/remove these
  confidence: number;           // 0-100 confidence in duplication
  reason: DuplicationReason;
}

type DuplicationReason = 
  | 'exact-match'
  | 'website-match'
  | 'name-similarity'
  | 'company-match';

function detectDuplicates(tools: AITool[]): DeduplicationResult {
  const duplicateGroups: DuplicateGroup[] = [];
  const processed = new Set<string>();
  
  for (const tool of tools) {
    if (processed.has(tool.id)) continue;
    
    const duplicates = findDuplicatesFor(tool, tools);
    if (duplicates.length > 0) {
      duplicateGroups.push({
        primary: selectPrimary([tool, ...duplicates]),
        duplicates: duplicates,
        confidence: calculateDuplicationConfidence(tool, duplicates),
        reason: determineDuplicationReason(tool, duplicates[0])
      });
      
      // Mark all as processed
      [tool, ...duplicates].forEach(t => processed.add(t.id));
    }
  }
  
  return {
    duplicates: duplicateGroups,
    unique: tools.filter(t => !processed.has(t.id)),
    merged: duplicateGroups.map(g => mergeToolData(g.primary, g.duplicates))
  };
}

function findDuplicatesFor(target: AITool, tools: AITool[]): AITool[] {
  return tools.filter(tool => {
    if (tool.id === target.id) return false;
    
    // Exact website match (high confidence)
    if (normalizeUrl(tool.website) === normalizeUrl(target.website)) {
      return true;
    }
    
    // Name similarity (medium confidence)
    const nameSimilarity = calculateStringSimilarity(
      tool.name.toLowerCase(),
      target.name.toLowerCase()
    );
    if (nameSimilarity > 0.85) return true;
    
    // Company/domain match
    const toolDomain = extractDomain(tool.website);
    const targetDomain = extractDomain(target.website);
    if (toolDomain === targetDomain && toolDomain !== '') return true;
    
    return false;
  });
}
```

### 5. Manual Review Queue Rules

```typescript
interface ReviewQueueItem {
  tool: AITool;
  reason: ReviewReason;
  priority: ReviewPriority;
  flaggedAt: Date;
  assignedTo?: string;
  status: ReviewStatus;
}

type ReviewReason = 
  | 'quality-flags'
  | 'duplicate-suspected'
  | 'pricing-unclear'
  | 'categorization-uncertain'
  | 'new-tool-verification'
  | 'user-report'
  | 'automated-concern';

type ReviewPriority = 'low' | 'medium' | 'high' | 'urgent';
type ReviewStatus = 'pending' | 'in-review' | 'approved' | 'rejected' | 'needs-info';

// Auto-queue rules
const REVIEW_QUEUE_RULES = [
  {
    trigger: 'quality-score-low',
    condition: (tool: AITool) => tool.qualityScore.overall < 60,
    priority: 'medium' as ReviewPriority
  },
  {
    trigger: 'multiple-quality-flags',
    condition: (tool: AITool) => tool.qualityScore.flags.length >= 3,
    priority: 'high' as ReviewPriority
  },
  {
    trigger: 'new-tool-high-price',
    condition: (tool: AITool) => 
      !tool.lastVerified && 
      tool.pricing.startingPrice && 
      tool.pricing.startingPrice > 200,
    priority: 'medium' as ReviewPriority
  },
  {
    trigger: 'smb-relevance-low',
    condition: (tool: AITool) => tool.smbRelevanceScore < 40,
    priority: 'low' as ReviewPriority
  }
];
```

---

## DATA VALIDATION PIPELINE

### Validation Stages
```typescript
interface ValidationPipeline {
  stages: ValidationStage[];
}

interface ValidationStage {
  name: string;
  validator: (tool: AITool) => ValidationResult;
  blocking: boolean;            // Stop processing if fails
  canFix: boolean;             // Auto-fix if possible
}

const VALIDATION_PIPELINE: ValidationPipeline = {
  stages: [
    {
      name: 'required-fields',
      validator: validateRequiredFields,
      blocking: true,
      canFix: false
    },
    {
      name: 'data-types',
      validator: validateDataTypes,
      blocking: true,
      canFix: true
    },
    {
      name: 'url-validation',
      validator: validateUrls,
      blocking: false,
      canFix: true
    },
    {
      name: 'content-quality',
      validator: validateContentQuality,
      blocking: false,
      canFix: false
    },
    {
      name: 'smb-relevance',
      validator: validateSMBRelevance,
      blocking: false,
      canFix: false
    },
    {
      name: 'exclusion-rules',
      validator: checkExclusionRules,
      blocking: true,
      canFix: false
    }
  ]
};
```

---

## IMPLEMENTATION CHECKLIST

### Schema Implementation
- [ ] Define TypeScript interfaces
- [ ] Create database migration scripts
- [ ] Set up validation functions
- [ ] Implement scoring algorithms

### Quality Rules
- [ ] Implement SMB relevance scoring
- [ ] Create quality validation pipeline
- [ ] Set up exclusion rule engine
- [ ] Build deduplication logic

### Review System
- [ ] Create review queue data structure
- [ ] Implement auto-flagging rules
- [ ] Build review dashboard UI
- [ ] Set up notification system

### Testing
- [ ] Unit tests for validation functions
- [ ] Integration tests for scoring
- [ ] Test data quality with sample datasets
- [ ] Validate deduplication accuracy

This schema and rule system provides a robust foundation for maintaining high-quality, SMB-relevant AI tool data while enabling automated processing and quality control.