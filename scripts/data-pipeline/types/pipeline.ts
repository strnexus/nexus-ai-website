import { AITool } from './schema';

export interface PipelineConfig {
  sources: SourceConfig[];
  database: DatabaseConfig;
  quality: QualityConfig;
  deduplication: DeduplicationConfig;
  reviewQueue: ReviewQueueConfig;
}

export interface SourceConfig {
  name: string;
  type: 'theresanaiforthat' | 'producthunt' | 'ycombinator' | 'futuretools';
  baseUrl: string;
  enabled: boolean;
  credentials: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
  };
  rateLimit: {
    requests: number;
    period: 'hour' | 'day' | 'minute';
  };
  retryConfig: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface DatabaseConfig {
  connectionString: string;
  pool?: {
    min: number;
    max: number;
  };
}

export interface QualityConfig {
  minimumScore: number;
  autoFixEnabled: boolean;
  exclusionRules: string[];
  smbRelevanceThreshold: number;
}

export interface DeduplicationConfig {
  enabled: boolean;
  similarityThreshold: number;
  websiteMatchWeight: number;
  nameMatchWeight: number;
}

export interface ReviewQueueConfig {
  enabled: boolean;
  autoAssignment: boolean;
  notifications: {
    email?: string;
    slack?: {
      webhook: string;
      channel: string;
    };
  };
}

export interface PipelineResult {
  success: boolean;
  toolsProcessed: number;
  newTools: number;
  updatedTools: number;
  qualityFlags: number;
  duplicatesFound: number;
  errors: string[];
  executionTime: number;
}

export interface HealthStatus {
  dataFreshness: number;
  sourceAvailability: number;
  averageQuality: number;
  lastSuccessfulRun: Date | null;
  alerts: Alert[];
}

export interface Alert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

export interface ValidationResult {
  passed: boolean;
  score: QualityScore;
  issues: ValidationIssue[];
  canFix: boolean;
}

export interface ValidationIssue {
  field: string;
  type: 'missing' | 'invalid' | 'format' | 'quality';
  message: string;
  severity: 'low' | 'medium' | 'high';
  fixable: boolean;
}

export interface QualityScore {
  overall: number;
  dataCompleteness: number;
  credibilityScore: number;
  freshnessScore: number;
  flags: any[];
}

export interface DeduplicationResult {
  uniqueTools: AITool[];
  duplicateGroups: DuplicateGroup[];
  mergedTools: AITool[];
}

export interface DuplicateGroup {
  primary: AITool;
  duplicates: AITool[];
  confidence: number;
  reason: 'exact-match' | 'website-match' | 'name-similarity' | 'company-match';
}

export interface ReviewQueueItem {
  id: string;
  tool: AITool;
  reason: ReviewReason;
  priority: ReviewPriority;
  flaggedAt: Date;
  assignedTo?: string;
  status: ReviewStatus;
  validationResult?: ValidationResult;
}

export type ReviewReason = 
  | 'quality-flags'
  | 'duplicate-suspected'
  | 'pricing-unclear'
  | 'categorization-uncertain'
  | 'new-tool-verification'
  | 'user-report'
  | 'automated-concern';

export type ReviewPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ReviewStatus = 'pending' | 'in-review' | 'approved' | 'rejected' | 'needs-info';

export interface PipelineMetrics {
  timestamp: Date;
  toolsProcessed: number;
  newTools: number;
  updatedTools: number;
  qualityFlags: number;
  duplicatesFound: number;
  errors: number;
  executionTime: number;
  sourceBreakdown: {
    [sourceName: string]: {
      toolsFetched: number;
      errors: number;
      responseTime: number;
    };
  };
}