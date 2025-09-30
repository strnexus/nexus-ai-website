import { readFileSync, writeFileSync, existsSync } from 'fs';
import { logger } from './logger';
import { AITool } from '../types/schema';
import { formatDuration, percentage, wordCount } from './helpers';

export interface DiffOptions {
  previousFile: string;
  currentFile: string;
  outputFile?: string;
  format: 'markdown' | 'json' | 'html';
  includeStats?: boolean;
  includeSamples?: boolean;
  maxSampleSize?: number;
  includeDetails?: boolean;
}

export interface DiffResult {
  summary: DiffSummary;
  changes: ToolChange[];
  stats: DiffStats;
  report?: string;
}

export interface DiffSummary {
  totalPrevious: number;
  totalCurrent: number;
  newTools: number;
  removedTools: number;
  updatedTools: number;
  unchangedTools: number;
  significantChanges: number;
}

export interface ToolChange {
  type: 'added' | 'removed' | 'updated' | 'unchanged';
  toolId: string;
  toolName: string;
  changes?: FieldChange[];
  significance: 'low' | 'medium' | 'high';
  summary: string;
}

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'modified' | 'added' | 'removed';
  impact: 'low' | 'medium' | 'high';
}

export interface DiffStats {
  processingTime: number;
  categoriesAffected: string[];
  qualityScoreChanges: {
    improved: number;
    degraded: number;
    unchanged: number;
  };
  pricingChanges: {
    increased: number;
    decreased: number;
    newFree: number;
    newPaid: number;
  };
  dataCompleteness: {
    previous: number;
    current: number;
    change: number;
  };
}

export class DiffGenerator {
  private options: DiffOptions;
  
  constructor(options: DiffOptions) {
    this.options = options;
  }

  async generate(): Promise<DiffResult> {
    const startTime = Date.now();
    logger.info('📊 Starting diff generation', {
      previous: this.options.previousFile,
      current: this.options.currentFile,
      format: this.options.format
    });

    try {
      // Load data files
      const previousData = this.loadDataFile(this.options.previousFile);
      const currentData = this.loadDataFile(this.options.currentFile);

      // Generate diff
      const result = await this.compareData(previousData, currentData);
      
      // Add processing time
      result.stats.processingTime = Date.now() - startTime;

      // Generate report if requested
      if (this.options.outputFile) {
        result.report = this.generateReport(result);
        writeFileSync(this.options.outputFile, result.report);
        logger.info('📄 Diff report written', { file: this.options.outputFile });
      }

      logger.info('✅ Diff generation completed', {
        duration: formatDuration(result.stats.processingTime),
        newTools: result.summary.newTools,
        updatedTools: result.summary.updatedTools,
        removedTools: result.summary.removedTools
      });

      return result;

    } catch (error) {
      logger.error('❌ Diff generation failed', error);
      throw error;
    }
  }

  private loadDataFile(filePath: string): AITool[] {
    if (!existsSync(filePath) || filePath === '/dev/null') {
      logger.warn('📄 Data file not found, treating as empty', { file: filePath });
      return [];
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      // Handle different data formats
      if (Array.isArray(data)) {
        return data;
      } else if (data.tools && Array.isArray(data.tools)) {
        return data.tools;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      } else {
        throw new Error('Unrecognized data format');
      }
    } catch (error) {
      logger.error('❌ Failed to load data file', { file: filePath, error });
      throw new Error(`Failed to load ${filePath}: ${error.message}`);
    }
  }

  private async compareData(previous: AITool[], current: AITool[]): Promise<DiffResult> {
    // Create lookups for efficient comparison
    const previousMap = new Map(previous.map(tool => [tool.id, tool]));
    const currentMap = new Map(current.map(tool => [tool.id, tool]));

    const changes: ToolChange[] = [];
    let significantChanges = 0;

    // Find new tools (in current but not in previous)
    for (const tool of current) {
      if (!previousMap.has(tool.id)) {
        const change: ToolChange = {
          type: 'added',
          toolId: tool.id,
          toolName: tool.name,
          significance: this.calculateAdditionSignificance(tool),
          summary: `New ${tool.categories.map(c => c.name).join(', ')} tool added`
        };
        changes.push(change);
        
        if (change.significance === 'high') significantChanges++;
      }
    }

    // Find removed tools (in previous but not in current)
    for (const tool of previous) {
      if (!currentMap.has(tool.id)) {
        const change: ToolChange = {
          type: 'removed',
          toolId: tool.id,
          toolName: tool.name,
          significance: this.calculateRemovalSignificance(tool),
          summary: `${tool.categories.map(c => c.name).join(', ')} tool removed`
        };
        changes.push(change);
        
        if (change.significance === 'high') significantChanges++;
      }
    }

    // Find updated tools
    for (const currentTool of current) {
      const previousTool = previousMap.get(currentTool.id);
      if (previousTool) {
        const fieldChanges = this.compareTools(previousTool, currentTool);
        
        if (fieldChanges.length > 0) {
          const significance = this.calculateUpdateSignificance(fieldChanges);
          const change: ToolChange = {
            type: 'updated',
            toolId: currentTool.id,
            toolName: currentTool.name,
            changes: fieldChanges,
            significance,
            summary: this.summarizeChanges(fieldChanges)
          };
          changes.push(change);
          
          if (change.significance === 'high') significantChanges++;
        } else {
          // Tool exists but unchanged
          changes.push({
            type: 'unchanged',
            toolId: currentTool.id,
            toolName: currentTool.name,
            significance: 'low',
            summary: 'No changes detected'
          });
        }
      }
    }

    // Generate summary
    const summary: DiffSummary = {
      totalPrevious: previous.length,
      totalCurrent: current.length,
      newTools: changes.filter(c => c.type === 'added').length,
      removedTools: changes.filter(c => c.type === 'removed').length,
      updatedTools: changes.filter(c => c.type === 'updated').length,
      unchangedTools: changes.filter(c => c.type === 'unchanged').length,
      significantChanges
    };

    // Generate stats
    const stats = this.generateStats(previous, current, changes);

    return {
      summary,
      changes,
      stats
    };
  }

  private compareTools(previous: AITool, current: AITool): FieldChange[] {
    const changes: FieldChange[] = [];
    
    // Compare key fields
    const fieldsToCompare = [
      'name', 'description', 'tagline', 'website', 'pricing', 
      'categories', 'tags', 'features', 'qualityScore', 'smbRelevanceScore'
    ];

    for (const field of fieldsToCompare) {
      const change = this.compareField(field, previous[field], current[field]);
      if (change) {
        changes.push(change);
      }
    }

    return changes;
  }

  private compareField(fieldName: string, oldValue: any, newValue: any): FieldChange | null {
    // Handle null/undefined values
    if (oldValue === newValue) return null;
    if (oldValue == null && newValue == null) return null;

    // Deep comparison for objects and arrays
    const oldStr = JSON.stringify(oldValue);
    const newStr = JSON.stringify(newValue);
    
    if (oldStr === newStr) return null;

    // Determine change type
    let changeType: FieldChange['changeType'];
    if (oldValue == null) changeType = 'added';
    else if (newValue == null) changeType = 'removed';
    else changeType = 'modified';

    // Determine impact
    const impact = this.calculateFieldImpact(fieldName, oldValue, newValue);

    return {
      field: fieldName,
      oldValue,
      newValue,
      changeType,
      impact
    };
  }

  private calculateFieldImpact(fieldName: string, oldValue: any, newValue: any): FieldChange['impact'] {
    // High impact fields
    if (['name', 'website', 'pricing'].includes(fieldName)) {
      return 'high';
    }

    // Medium impact fields
    if (['description', 'categories', 'qualityScore', 'smbRelevanceScore'].includes(fieldName)) {
      // For scores, check magnitude of change
      if (fieldName.includes('Score') && typeof oldValue === 'number' && typeof newValue === 'number') {
        const change = Math.abs(newValue - oldValue);
        if (change >= 20) return 'high';
        if (change >= 10) return 'medium';
        return 'low';
      }
      return 'medium';
    }

    // Low impact fields
    return 'low';
  }

  private calculateAdditionSignificance(tool: AITool): ToolChange['significance'] {
    // High significance for high SMB relevance or quality
    if (tool.smbRelevanceScore >= 80 || tool.qualityScore.overall >= 85) {
      return 'high';
    }
    
    // Medium significance for decent tools
    if (tool.smbRelevanceScore >= 60 || tool.qualityScore.overall >= 70) {
      return 'medium';
    }
    
    return 'low';
  }

  private calculateRemovalSignificance(tool: AITool): ToolChange['significance'] {
    // High significance if removing a high-quality or popular tool
    if (tool.smbRelevanceScore >= 80 || (tool.popularity?.trendinessScore || 0) >= 80) {
      return 'high';
    }
    
    return 'medium'; // Removals are generally notable
  }

  private calculateUpdateSignificance(fieldChanges: FieldChange[]): ToolChange['significance'] {
    const highImpactChanges = fieldChanges.filter(c => c.impact === 'high').length;
    const mediumImpactChanges = fieldChanges.filter(c => c.impact === 'medium').length;

    if (highImpactChanges > 0) return 'high';
    if (mediumImpactChanges >= 2) return 'medium';
    if (mediumImpactChanges >= 1 || fieldChanges.length >= 3) return 'medium';
    
    return 'low';
  }

  private summarizeChanges(fieldChanges: FieldChange[]): string {
    const highImpactChanges = fieldChanges.filter(c => c.impact === 'high');
    
    if (highImpactChanges.length > 0) {
      const fields = highImpactChanges.map(c => c.field).join(', ');
      return `Updated ${fields}`;
    }

    const changedFields = fieldChanges.map(c => c.field).slice(0, 3);
    if (fieldChanges.length > 3) {
      return `Updated ${changedFields.join(', ')} and ${fieldChanges.length - 3} other fields`;
    }
    
    return `Updated ${changedFields.join(', ')}`;
  }

  private generateStats(previous: AITool[], current: AITool[], changes: ToolChange[]): DiffStats {
    // Categories affected
    const categoriesSet = new Set<string>();
    for (const change of changes) {
      if (change.type !== 'unchanged') {
        // Find tool in current data to get categories
        const tool = current.find(t => t.id === change.toolId) || 
                    previous.find(t => t.id === change.toolId);
        if (tool) {
          tool.categories.forEach(cat => categoriesSet.add(cat.name));
        }
      }
    }

    // Quality score changes
    let qualityImproved = 0;
    let qualityDegraded = 0;
    let qualityUnchanged = 0;

    for (const change of changes) {
      if (change.type === 'updated' && change.changes) {
        const qualityChange = change.changes.find(c => c.field === 'qualityScore');
        if (qualityChange) {
          const oldScore = qualityChange.oldValue?.overall || 0;
          const newScore = qualityChange.newValue?.overall || 0;
          
          if (newScore > oldScore) qualityImproved++;
          else if (newScore < oldScore) qualityDegraded++;
          else qualityUnchanged++;
        }
      }
    }

    // Pricing changes
    let pricingIncreased = 0;
    let pricingDecreased = 0;
    let newFree = 0;
    let newPaid = 0;

    for (const change of changes) {
      if (change.type === 'updated' && change.changes) {
        const pricingChange = change.changes.find(c => c.field === 'pricing');
        if (pricingChange) {
          const oldPrice = pricingChange.oldValue?.startingPrice || 0;
          const newPrice = pricingChange.newValue?.startingPrice || 0;
          
          if (oldPrice === 0 && newPrice > 0) newPaid++;
          else if (oldPrice > 0 && newPrice === 0) newFree++;
          else if (newPrice > oldPrice) pricingIncreased++;
          else if (newPrice < oldPrice) pricingDecreased++;
        }
      }
    }

    // Data completeness
    const previousCompleteness = this.calculateDataCompleteness(previous);
    const currentCompleteness = this.calculateDataCompleteness(current);

    return {
      processingTime: 0, // Set by caller
      categoriesAffected: Array.from(categoriesSet),
      qualityScoreChanges: {
        improved: qualityImproved,
        degraded: qualityDegraded,
        unchanged: qualityUnchanged
      },
      pricingChanges: {
        increased: pricingIncreased,
        decreased: pricingDecreased,
        newFree,
        newPaid
      },
      dataCompleteness: {
        previous: previousCompleteness,
        current: currentCompleteness,
        change: currentCompleteness - previousCompleteness
      }
    };
  }

  private calculateDataCompleteness(tools: AITool[]): number {
    if (tools.length === 0) return 0;

    const requiredFields = ['name', 'description', 'website', 'categories', 'pricing'];
    let totalScore = 0;

    for (const tool of tools) {
      let toolScore = 0;
      for (const field of requiredFields) {
        if (tool[field] && 
            (typeof tool[field] !== 'string' || tool[field].trim().length > 0) &&
            (!Array.isArray(tool[field]) || tool[field].length > 0)) {
          toolScore++;
        }
      }
      totalScore += toolScore / requiredFields.length;
    }

    return Math.round((totalScore / tools.length) * 100);
  }

  private generateReport(result: DiffResult): string {
    switch (this.options.format) {
      case 'markdown':
        return this.generateMarkdownReport(result);
      case 'json':
        return JSON.stringify(result, null, 2);
      case 'html':
        return this.generateHtmlReport(result);
      default:
        throw new Error(`Unsupported format: ${this.options.format}`);
    }
  }

  private generateMarkdownReport(result: DiffResult): string {
    const { summary, changes, stats } = result;
    const timestamp = new Date().toISOString();

    let report = `# 🤖 AI Tools Data Refresh Report

Generated: ${new Date(timestamp).toLocaleString()}  
Processing Time: ${formatDuration(stats.processingTime)}

## 📊 Summary

| Metric | Count | Change |
|--------|-------|---------|
| **Total Tools** | ${summary.totalCurrent.toLocaleString()} | ${summary.totalCurrent - summary.totalPrevious >= 0 ? '+' : ''}${(summary.totalCurrent - summary.totalPrevious).toLocaleString()} |
| **✨ New Tools** | ${summary.newTools.toLocaleString()} | - |
| **🔄 Updated Tools** | ${summary.updatedTools.toLocaleString()} | - |
| **🗑️ Removed Tools** | ${summary.removedTools.toLocaleString()} | - |
| **📈 Significant Changes** | ${summary.significantChanges.toLocaleString()} | - |
| **📊 Data Completeness** | ${stats.dataCompleteness.current}% | ${stats.dataCompleteness.change >= 0 ? '+' : ''}${stats.dataCompleteness.change}% |

`;

    // Add stats if requested
    if (this.options.includeStats) {
      report += `## 📈 Quality & Pricing Changes

### 🎯 Quality Scores
- **Improved**: ${stats.qualityScoreChanges.improved} tools
- **Degraded**: ${stats.qualityScoreChanges.degraded} tools
- **Unchanged**: ${stats.qualityScoreChanges.unchanged} tools

### 💰 Pricing Changes
- **Price Increased**: ${stats.pricingChanges.increased} tools
- **Price Decreased**: ${stats.pricingChanges.decreased} tools
- **New Free Tools**: ${stats.pricingChanges.newFree} tools
- **New Paid Tools**: ${stats.pricingChanges.newPaid} tools

### 🏷️ Categories Affected
${stats.categoriesAffected.length > 0 ? 
  stats.categoriesAffected.map(cat => `- ${cat}`).join('\n') : 
  'No categories affected'
}

`;
    }

    // Add significant changes
    const significantChanges = changes.filter(c => c.significance === 'high');
    if (significantChanges.length > 0) {
      report += `## 🚨 Significant Changes

${significantChanges.slice(0, 10).map(change => {
        let emoji = '';
        switch (change.type) {
          case 'added': emoji = '✨'; break;
          case 'removed': emoji = '🗑️'; break;
          case 'updated': emoji = '🔄'; break;
        }
        return `### ${emoji} ${change.toolName}
**Type**: ${change.type}  
**Summary**: ${change.summary}`;
      }).join('\n\n')}

${significantChanges.length > 10 ? `\n*... and ${significantChanges.length - 10} more significant changes*\n` : ''}
`;
    }

    // Add samples if requested
    if (this.options.includeSamples) {
      const sampleSize = this.options.maxSampleSize || 5;
      
      // New tools samples
      const newTools = changes.filter(c => c.type === 'added').slice(0, sampleSize);
      if (newTools.length > 0) {
        report += `## ✨ New Tools (Sample)

${newTools.map(tool => `- **${tool.toolName}** - ${tool.summary}`).join('\n')}

`;
      }

      // Updated tools samples
      const updatedTools = changes.filter(c => c.type === 'updated').slice(0, sampleSize);
      if (updatedTools.length > 0) {
        report += `## 🔄 Updated Tools (Sample)

${updatedTools.map(tool => `- **${tool.toolName}** - ${tool.summary}`).join('\n')}

`;
      }

      // Removed tools
      const removedTools = changes.filter(c => c.type === 'removed');
      if (removedTools.length > 0) {
        report += `## 🗑️ Removed Tools

${removedTools.map(tool => `- **${tool.toolName}** - ${tool.summary}`).join('\n')}

`;
      }
    }

    // Add detailed changes if requested
    if (this.options.includeDetails) {
      const detailedChanges = changes.filter(c => 
        c.type === 'updated' && c.changes && c.changes.length > 0
      ).slice(0, 10);

      if (detailedChanges.length > 0) {
        report += `## 🔍 Detailed Changes (Sample)

${detailedChanges.map(change => {
          const highImpactChanges = change.changes?.filter(c => c.impact === 'high') || [];
          return `### ${change.toolName}

${highImpactChanges.map(fieldChange => {
            const oldVal = typeof fieldChange.oldValue === 'object' ? 
              JSON.stringify(fieldChange.oldValue, null, 2) : String(fieldChange.oldValue);
            const newVal = typeof fieldChange.newValue === 'object' ? 
              JSON.stringify(fieldChange.newValue, null, 2) : String(fieldChange.newValue);
              
            return `**${fieldChange.field}** (${fieldChange.changeType}):
- **Before**: ${oldVal.length > 100 ? oldVal.substring(0, 100) + '...' : oldVal}
- **After**: ${newVal.length > 100 ? newVal.substring(0, 100) + '...' : newVal}`;
          }).join('\n\n')}`;
        }).join('\n\n')}

`;
      }
    }

    report += `---

## 📋 Review Checklist

- [ ] Review significant changes for accuracy
- [ ] Verify new tools are appropriate for SMB audience
- [ ] Check that removed tools are no longer relevant
- [ ] Confirm quality score changes are reasonable
- [ ] Validate pricing information updates

## ⏭️ Next Steps

1. **Review the changes** above carefully
2. **Approve and merge** this PR if changes look good
3. **Monitor data quality** after merge
4. **Update documentation** if schema changes occurred

---
*🤖 This report was automatically generated by the Nexus AI data pipeline*
`;

    return report;
  }

  private generateHtmlReport(result: DiffResult): string {
    // HTML report generation (basic implementation)
    return `<!DOCTYPE html>
<html>
<head>
    <title>AI Tools Data Refresh Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .new { color: green; }
        .updated { color: orange; }
        .removed { color: red; }
    </style>
</head>
<body>
    <h1>🤖 AI Tools Data Refresh Report</h1>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Processing Time:</strong> ${formatDuration(result.stats.processingTime)}</p>
    
    <h2>📊 Summary</h2>
    <table>
        <tr><th>Metric</th><th>Count</th></tr>
        <tr><td>Total Tools</td><td>${result.summary.totalCurrent.toLocaleString()}</td></tr>
        <tr><td class="new">New Tools</td><td>${result.summary.newTools.toLocaleString()}</td></tr>
        <tr><td class="updated">Updated Tools</td><td>${result.summary.updatedTools.toLocaleString()}</td></tr>
        <tr><td class="removed">Removed Tools</td><td>${result.summary.removedTools.toLocaleString()}</td></tr>
    </table>
    
    <!-- Additional HTML content would go here -->
</body>
</html>`;
  }
}

// CLI interface for the diff generator
export async function generateDiff(options: DiffOptions): Promise<DiffResult> {
  const generator = new DiffGenerator(options);
  return await generator.generate();
}