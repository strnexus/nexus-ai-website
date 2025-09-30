#!/usr/bin/env tsx

/**
 * CLI script for generating diff reports between data files
 */

import { Command } from 'commander';
import { resolve } from 'path';
import { generateDiff, DiffOptions } from '../utils/DiffGenerator';
import { logger } from '../utils/logger';

const program = new Command();

program
  .name('generate-diff')
  .description('Generate diff reports between AI tools data files')
  .version('1.0.0');

program
  .option('-p, --previous <file>', 'Path to previous data file', 'data/ai-tools.json')
  .option('-c, --current <file>', 'Path to current data file', 'output/ai-tools.json')
  .option('-o, --output <file>', 'Output file path', 'diff-report.md')
  .option('-f, --format <format>', 'Output format (markdown, json, html)', 'markdown')
  .option('--include-stats', 'Include detailed statistics', false)
  .option('--include-samples', 'Include sample changes', false)
  .option('--include-details', 'Include detailed field changes', false)
  .option('--max-sample-size <number>', 'Maximum number of samples to include', '5')
  .option('--quiet', 'Suppress console output', false)
  .action(async (options) => {
    try {
      // Set log level
      if (options.quiet) {
        logger.level = 'error';
      }

      // Resolve file paths
      const previousFile = resolve(process.cwd(), options.previous);
      const currentFile = resolve(process.cwd(), options.current);
      const outputFile = options.output ? resolve(process.cwd(), options.output) : undefined;

      logger.info('🔍 Starting diff generation', {
        previous: previousFile,
        current: currentFile,
        output: outputFile,
        format: options.format
      });

      // Validate format
      const validFormats = ['markdown', 'json', 'html'];
      if (!validFormats.includes(options.format)) {
        throw new Error(`Invalid format: ${options.format}. Valid options: ${validFormats.join(', ')}`);
      }

      // Configure diff options
      const diffOptions: DiffOptions = {
        previousFile,
        currentFile,
        outputFile,
        format: options.format as 'markdown' | 'json' | 'html',
        includeStats: options.includeStats,
        includeSamples: options.includeSamples,
        includeDetails: options.includeDetails,
        maxSampleSize: parseInt(options.maxSampleSize, 10)
      };

      // Generate diff
      const result = await generateDiff(diffOptions);

      // Output summary
      if (!options.quiet) {
        console.log('\n📊 Diff Generation Summary:');
        console.log(`├─ Total Previous: ${result.summary.totalPrevious.toLocaleString()}`);
        console.log(`├─ Total Current: ${result.summary.totalCurrent.toLocaleString()}`);
        console.log(`├─ New Tools: ${result.summary.newTools.toLocaleString()}`);
        console.log(`├─ Updated Tools: ${result.summary.updatedTools.toLocaleString()}`);
        console.log(`├─ Removed Tools: ${result.summary.removedTools.toLocaleString()}`);
        console.log(`├─ Significant Changes: ${result.summary.significantChanges.toLocaleString()}`);
        console.log(`└─ Processing Time: ${result.stats.processingTime}ms`);

        if (outputFile) {
          console.log(`\n📄 Report written to: ${outputFile}`);
        }

        if (result.summary.significantChanges > 0) {
          console.log('\n🚨 Significant changes detected - please review carefully');
        }
      }

      // Exit codes for CI/CD
      if (result.summary.newTools > 0 || result.summary.updatedTools > 0 || result.summary.removedTools > 0) {
        process.exit(0); // Changes detected - success
      } else {
        process.exit(1); // No changes - might be an issue
      }

    } catch (error) {
      logger.error('❌ Diff generation failed', error);
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// Add example usage
program.addHelpText('after', `
Examples:
  $ npm run generate-diff
  $ npm run generate-diff -- --previous=data/backup.json --current=data/current.json
  $ npm run generate-diff -- --format=json --output=changes.json
  $ npm run generate-diff -- --include-stats --include-samples --include-details
  $ npm run generate-diff -- --quiet > /dev/null

Notes:
  - The script exits with code 0 if changes are detected (normal operation)
  - It exits with code 1 if no changes are found or if an error occurs
  - Use --quiet flag to suppress console output for CI/CD environments
`);

// Parse command line arguments
if (require.main === module) {
  program.parse(process.argv);
}

export { program as generateDiffProgram };