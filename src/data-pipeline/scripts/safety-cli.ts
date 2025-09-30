#!/usr/bin/env node

/**
 * Safety CLI for Data Pipeline
 * 
 * Command-line interface for manual safety operations, emergency controls,
 * circuit breaker management, and rollback operations.
 */

import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { DataPipeline } from '../DataPipeline';
import { SafetyGuards } from '../utils/SafetyGuards';
import { CircuitBreaker, CircuitState } from '../utils/CircuitBreaker';
import { Logger } from '../utils/Logger';

const logger = new Logger('SafetyCLI');
const program = new Command();

// Load default configuration
function loadConfig() {
  const configPath = join(process.cwd(), 'pipeline-config.json');
  if (existsSync(configPath)) {
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  }
  
  // Default configuration
  return {
    sources: {},
    processing: {},
    safety: {
      failureThreshold: 5,
      successThreshold: 3,
      circuitTimeout: 300000, // 5 minutes
      monitoringWindow: 600000, // 10 minutes
      criticalFailureThreshold: 2
    }
  };
}

// Initialize pipeline
const config = loadConfig();
const pipeline = new DataPipeline(config);

program
  .name('safety-cli')
  .description('Data Pipeline Safety Controls')
  .version('1.0.0');

/**
 * Health Check Command
 */
program
  .command('health')
  .description('Check pipeline and system health')
  .option('-v, --verbose', 'Show detailed health information')
  .action(async (options) => {
    try {
      console.log('🔍 Running health check...\n');
      
      const health = await pipeline.healthCheck();
      const stats = pipeline.getStatistics();
      
      // Overall health status
      const healthEmoji = health.healthy ? '✅' : '❌';
      console.log(`${healthEmoji} Overall Health: ${health.healthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      console.log(`🔌 Circuit State: ${health.circuitStatus.circuitState}`);
      console.log(`📊 System Health: ${stats.systemHealth.toUpperCase()}`);
      console.log(`🎯 Health Score: ${health.circuitStatus.healthScore}/100\n`);
      
      // Issues
      if (health.issues.length > 0) {
        console.log('⚠️  Issues Detected:');
        health.issues.forEach((issue, index) => {
          console.log(`   ${index + 1}. ${issue}`);
        });
        console.log();
      }
      
      // Recommendations
      if (health.recommendations.length > 0) {
        console.log('💡 Recommendations:');
        health.recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
        console.log();
      }
      
      // Verbose details
      if (options.verbose) {
        console.log('📈 Detailed Metrics:');
        console.log(`   Total Operations: ${stats.circuitBreaker.healthMetrics.totalOperations}`);
        console.log(`   Total Failures: ${stats.circuitBreaker.failures}`);
        console.log(`   Recent Failures: ${stats.circuitBreaker.recentFailures}`);
        console.log(`   Failure Rate: ${stats.circuitBreaker.healthMetrics.failureRate}%`);
        console.log(`   Uptime: ${Math.round(stats.circuitBreaker.healthMetrics.uptime / 60)} minutes`);
        
        if (stats.circuitBreaker.nextRetryAt) {
          console.log(`   Next Retry: ${stats.circuitBreaker.nextRetryAt}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Health check failed: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Circuit Breaker Status Command
 */
program
  .command('circuit')
  .description('Circuit breaker status and controls')
  .option('-r, --reset', 'Reset circuit breaker to closed state')
  .option('-o, --open <reason>', 'Force open circuit breaker')
  .option('-c, --close <reason>', 'Force close circuit breaker')
  .action(async (options) => {
    try {
      if (options.reset) {
        await pipeline.resetCircuitBreaker();
        console.log('✅ Circuit breaker reset to closed state');
        return;
      }
      
      if (options.open) {
        await pipeline.emergencyStop(options.open);
        console.log(`🚨 Circuit breaker forced OPEN: ${options.open}`);
        return;
      }
      
      if (options.close) {
        await pipeline.emergencyRecovery(options.close);
        console.log(`🔧 Circuit breaker forced CLOSED: ${options.close}`);
        return;
      }
      
      // Show status
      const stats = pipeline.getStatistics();
      const status = stats.circuitBreaker;
      
      console.log('🔌 Circuit Breaker Status\n');
      console.log(`State: ${status.state}`);
      console.log(`Can Execute: ${status.canExecute ? 'YES' : 'NO'}`);
      console.log(`Total Failures: ${status.failures}`);
      console.log(`Recent Failures: ${status.recentFailures}`);
      
      if (status.nextRetryAt) {
        console.log(`Next Retry: ${status.nextRetryAt}`);
      }
      
      console.log('\n📊 Metrics:');
      console.log(`   Operations: ${status.healthMetrics.totalOperations}`);
      console.log(`   Failure Rate: ${status.healthMetrics.failureRate}%`);
      console.log(`   Uptime: ${Math.round(status.healthMetrics.uptime / 60)} min`);
      
    } catch (error) {
      console.error(`❌ Circuit operation failed: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Safety Check Command
 */
program
  .command('check')
  .description('Run safety validation on current data')
  .option('-f, --file <path>', 'Path to data file to check')
  .option('-q, --quick', 'Run quick safety check only')
  .action(async (options) => {
    try {
      console.log('🛡️ Running safety validation...\n');
      
      const safetyGuards = new SafetyGuards();
      
      // Load data to check
      let dataToCheck = [];
      if (options.file && existsSync(options.file)) {
        const fileContent = readFileSync(options.file, 'utf-8');
        dataToCheck = JSON.parse(fileContent);
        console.log(`📁 Loaded ${dataToCheck.length} items from ${options.file}`);
      } else {
        // Load current data
        const currentDataPath = join(process.cwd(), 'data', 'ai-tools.json');
        if (existsSync(currentDataPath)) {
          const fileContent = readFileSync(currentDataPath, 'utf-8');
          dataToCheck = JSON.parse(fileContent);
          console.log(`📁 Loaded ${dataToCheck.length} items from current data`);
        } else {
          console.log('❌ No data found to check');
          process.exit(1);
        }
      }
      
      if (options.quick) {
        // Quick check
        const isValid = await safetyGuards.quickSafetyCheck(dataToCheck);
        console.log(`⚡ Quick Check: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
        return;
      }
      
      // Full safety check
      const previousData = await safetyGuards.loadPreviousData();
      const report = await safetyGuards.runSafetyChecks(dataToCheck, previousData);
      
      // Display results
      const overallEmoji = report.overall.passed ? '✅' : '❌';
      console.log(`${overallEmoji} Overall Result: ${report.overall.passed ? 'PASS' : 'FAIL'}`);
      console.log(`🎯 Severity: ${report.overall.severity.toUpperCase()}`);
      console.log(`📝 Message: ${report.overall.message}\n`);
      
      // Individual checks
      console.log('📋 Individual Checks:');
      Object.entries(report.checks).forEach(([name, result]) => {
        const emoji = result.passed ? '✅' : '❌';
        const severity = result.passed ? '' : ` [${result.severity.toUpperCase()}]`;
        console.log(`   ${emoji} ${name}${severity}: ${result.message}`);
      });
      
      // Recommendations
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
      }
      
      // Data snapshot
      console.log('\n📊 Data Snapshot:');
      console.log(`   Total Tools: ${report.dataSnapshot.totalTools}`);
      console.log(`   Average Quality: ${report.dataSnapshot.averageQuality}`);
      console.log(`   Source Distribution: ${Object.keys(report.dataSnapshot.sourceDistribution).length} sources`);
      
      if (!report.overall.passed) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error(`❌ Safety check failed: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Emergency Stop Command
 */
program
  .command('emergency-stop')
  .description('Emergency stop - immediately halt all pipeline operations')
  .argument('<reason>', 'Reason for emergency stop')
  .option('-f, --force', 'Force stop without confirmation')
  .action(async (reason, options) => {
    try {
      if (!options.force) {
        // Require confirmation for emergency stop
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
          rl.question(`🚨 EMERGENCY STOP: Are you sure you want to halt all pipeline operations?\nReason: ${reason}\nType 'yes' to confirm: `, resolve);
        });
        
        rl.close();
        
        if (answer.toLowerCase() !== 'yes') {
          console.log('❌ Emergency stop cancelled');
          return;
        }
      }
      
      await pipeline.emergencyStop(reason);
      console.log(`🚨 EMERGENCY STOP ACTIVATED: ${reason}`);
      console.log('⚠️  All pipeline operations have been halted');
      console.log('🔧 Use "safety-cli circuit --close <reason>" to resume operations');
      
    } catch (error) {
      console.error(`❌ Emergency stop failed: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Recovery Command
 */
program
  .command('recover')
  .description('Attempt to recover from emergency or failure state')
  .argument('<reason>', 'Reason for recovery')
  .option('-f, --force', 'Force recovery without validation')
  .action(async (reason, options) => {
    try {
      if (!options.force) {
        // Check system health before recovery
        const health = await pipeline.healthCheck();
        if (!health.healthy && health.issues.length > 0) {
          console.log('⚠️  System health issues detected:');
          health.issues.forEach((issue, index) => {
            console.log(`   ${index + 1}. ${issue}`);
          });
          console.log('\n💡 Consider addressing these issues before recovery');
          console.log('   Use --force to override this check\n');
          return;
        }
      }
      
      await pipeline.emergencyRecovery(reason);
      console.log(`🔧 RECOVERY INITIATED: ${reason}`);
      console.log('✅ Pipeline operations have been resumed');
      
      // Run health check after recovery
      const health = await pipeline.healthCheck();
      console.log(`\n📊 Post-recovery health: ${health.healthy ? 'HEALTHY' : 'NEEDS ATTENTION'}`);
      
    } catch (error) {
      console.error(`❌ Recovery failed: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Monitor Command
 */
program
  .command('monitor')
  .description('Real-time monitoring of pipeline health')
  .option('-i, --interval <seconds>', 'Update interval in seconds', '30')
  .action(async (options) => {
    const interval = parseInt(options.interval) * 1000;
    
    console.log('📊 Starting pipeline monitoring...');
    console.log(`🔄 Update interval: ${options.interval} seconds`);
    console.log('Press Ctrl+C to stop\n');
    
    const monitor = async () => {
      try {
        // Clear screen (basic)
        console.log('\n'.repeat(50));
        
        const health = await pipeline.healthCheck();
        const stats = pipeline.getStatistics();
        
        console.log('═══════════════════════════════════════════════');
        console.log(`📊 Pipeline Monitor - ${new Date().toLocaleTimeString()}`);
        console.log('═══════════════════════════════════════════════');
        
        const healthEmoji = health.healthy ? '✅' : '❌';
        console.log(`${healthEmoji} Health: ${health.healthy ? 'HEALTHY' : 'UNHEALTHY'}`);
        console.log(`🔌 Circuit: ${health.circuitStatus.circuitState}`);
        console.log(`🎯 Score: ${health.circuitStatus.healthScore}/100`);
        console.log(`📈 System: ${stats.systemHealth.toUpperCase()}`);
        
        if (!health.healthy) {
          console.log('\n⚠️  Current Issues:');
          health.issues.forEach(issue => console.log(`   • ${issue}`));
        }
        
        console.log('\n📊 Metrics:');
        console.log(`   Operations: ${stats.circuitBreaker.healthMetrics.totalOperations}`);
        console.log(`   Failures: ${stats.circuitBreaker.failures}`);
        console.log(`   Failure Rate: ${stats.circuitBreaker.healthMetrics.failureRate}%`);
        console.log(`   Uptime: ${Math.round(stats.circuitBreaker.healthMetrics.uptime / 60)} min`);
        
      } catch (error) {
        console.error(`❌ Monitor error: ${error.message}`);
      }
    };
    
    // Initial run
    await monitor();
    
    // Set up interval
    const intervalId = setInterval(monitor, interval);
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping monitor...');
      clearInterval(intervalId);
      process.exit(0);
    });
  });

/**
 * List Backups Command
 */
program
  .command('backups')
  .description('List available data backups for rollback')
  .option('-l, --limit <number>', 'Limit number of backups shown', '10')
  .action(async (options) => {
    try {
      const backupsDir = join(process.cwd(), 'data', 'backups');
      
      if (!existsSync(backupsDir)) {
        console.log('📁 No backups directory found');
        return;
      }
      
      const fs = require('fs');
      const files = fs.readdirSync(backupsDir)
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const filePath = join(backupsDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.mtime
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime())
        .slice(0, parseInt(options.limit));
      
      if (files.length === 0) {
        console.log('📁 No backup files found');
        return;
      }
      
      console.log('📦 Available Backups:\n');
      files.forEach((file, index) => {
        const sizeKB = Math.round(file.size / 1024);
        const timeAgo = Math.round((Date.now() - file.created.getTime()) / (1000 * 60));
        console.log(`${index + 1}. ${file.name}`);
        console.log(`   📅 Created: ${file.created.toLocaleString()}`);
        console.log(`   📊 Size: ${sizeKB} KB`);
        console.log(`   ⏰ Age: ${timeAgo} minutes ago\n`);
      });
      
    } catch (error) {
      console.error(`❌ Failed to list backups: ${error.message}`);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}