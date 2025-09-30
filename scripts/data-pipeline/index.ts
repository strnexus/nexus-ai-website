#!/usr/bin/env tsx

/**
 * AI Tools Data Pipeline
 * 
 * Main entry point for the automated data refresh pipeline
 * Fetches, processes, and validates AI tool data from multiple sources
 */

import { program } from 'commander';
import { logger } from './utils/logger';
import { DataPipeline } from './core/DataPipeline';
import { loadConfig } from './config/config';
import { validateEnvironment } from './utils/environment';

async function main() {
  program
    .name('ai-tools-pipeline')
    .description('Automated AI tools data refresh pipeline')
    .version('1.0.0');

  program
    .command('refresh')
    .description('Run the complete data refresh pipeline')
    .option('-s, --source <source>', 'Run specific source only')
    .option('-d, --dry-run', 'Dry run mode (no database writes)')
    .option('-v, --verbose', 'Verbose logging')
    .action(async (options) => {
      try {
        if (options.verbose) {
          logger.level = 'debug';
        }

        logger.info('🚀 Starting AI Tools Data Pipeline');

        // Validate environment
        validateEnvironment();

        // Load configuration
        const config = await loadConfig();
        
        // Initialize pipeline
        const pipeline = new DataPipeline(config);
        
        // Run pipeline
        const result = await pipeline.run({
          sourceFilter: options.source,
          dryRun: options.dryRun
        });

        logger.info('✅ Pipeline completed successfully', {
          toolsProcessed: result.toolsProcessed,
          newTools: result.newTools,
          updatedTools: result.updatedTools,
          qualityFlags: result.qualityFlags,
          duplicatesFound: result.duplicatesFound
        });

      } catch (error) {
        logger.error('❌ Pipeline failed', error);
        process.exit(1);
      }
    });

  program
    .command('validate')
    .description('Validate existing data quality')
    .option('-f, --fix', 'Auto-fix issues where possible')
    .action(async (options) => {
      try {
        logger.info('🔍 Starting data validation');
        
        const config = await loadConfig();
        const pipeline = new DataPipeline(config);
        
        const result = await pipeline.validateData({
          autoFix: options.fix
        });

        logger.info('✅ Validation completed', result);

      } catch (error) {
        logger.error('❌ Validation failed', error);
        process.exit(1);
      }
    });

  program
    .command('monitor')
    .description('Check pipeline health and data freshness')
    .action(async () => {
      try {
        logger.info('📊 Checking pipeline health');
        
        const config = await loadConfig();
        const pipeline = new DataPipeline(config);
        
        const health = await pipeline.getHealthStatus();
        
        console.log('\n📊 Pipeline Health Report:');
        console.log(`Data Freshness: ${health.dataFreshness}%`);
        console.log(`Source Availability: ${health.sourceAvailability}%`);
        console.log(`Quality Score: ${health.averageQuality}%`);
        console.log(`Last Successful Run: ${health.lastSuccessfulRun}`);
        
        if (health.alerts.length > 0) {
          console.log('\n⚠️  Active Alerts:');
          health.alerts.forEach(alert => {
            console.log(`- ${alert.severity}: ${alert.message}`);
          });
        }

      } catch (error) {
        logger.error('❌ Health check failed', error);
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error', error);
    process.exit(1);
  });
}

export { main };