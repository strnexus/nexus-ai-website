#!/usr/bin/env node

/**
 * Environment Validation Script
 * 
 * Validates that all required environment variables and secrets are properly
 * configured for the AI tools data pipeline.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔍 Validating Environment Configuration...\n');

// Track validation results
let errors = [];
let warnings = [];
let validations = 0;

/**
 * Validate a required environment variable
 */
function validateRequired(name, description, format) {
  validations++;
  const value = process.env[name];
  
  if (!value) {
    errors.push(`❌ ${name}: Required ${description} is missing`);
    return false;
  }
  
  if (format && !format.test(value)) {
    errors.push(`❌ ${name}: Invalid format for ${description}`);
    return false;
  }
  
  // Don't log actual secret values
  const displayValue = name.includes('KEY') || name.includes('SECRET') || name.includes('TOKEN') || name.includes('PASSWORD')
    ? `[HIDDEN - ${value.length} chars]`
    : value;
  
  console.log(`✅ ${name}: ${displayValue}`);
  return true;
}

/**
 * Validate an optional environment variable
 */
function validateOptional(name, description, format) {
  validations++;
  const value = process.env[name];
  
  if (!value) {
    console.log(`⚠️  ${name}: Optional ${description} not set`);
    return null;
  }
  
  if (format && !format.test(value)) {
    warnings.push(`⚠️  ${name}: Invalid format for ${description}`);
    return false;
  }
  
  const displayValue = name.includes('KEY') || name.includes('SECRET') || name.includes('TOKEN') || name.includes('PASSWORD')
    ? `[HIDDEN - ${value.length} chars]`
    : value;
  
  console.log(`✅ ${name}: ${displayValue}`);
  return true;
}

/**
 * Test database connection
 */
async function testDatabaseConnection(connectionString) {
  if (!connectionString) return false;
  
  try {
    // For this validation, we'll just check the format
    // In a real implementation, you'd test the actual connection
    const dbUrl = new URL(connectionString);
    
    if (dbUrl.protocol !== 'postgresql:' && dbUrl.protocol !== 'postgres:') {
      throw new Error('Only PostgreSQL databases are supported');
    }
    
    console.log(`✅ Database connection format valid: ${dbUrl.hostname}:${dbUrl.port}${dbUrl.pathname}`);
    return true;
  } catch (error) {
    console.log(`❌ Database connection invalid: ${error.message}`);
    return false;
  }
}

/**
 * Test Slack webhook
 */
function testSlackWebhook(webhook) {
  if (!webhook) return null;
  
  try {
    const url = new URL(webhook);
    
    if (url.hostname !== 'hooks.slack.com') {
      throw new Error('Not a valid Slack webhook URL');
    }
    
    console.log(`✅ Slack webhook format valid`);
    return true;
  } catch (error) {
    console.log(`❌ Slack webhook invalid: ${error.message}`);
    return false;
  }
}

/**
 * Check file system permissions
 */
function checkFileSystemPermissions() {
  const requiredDirs = ['data', 'data/backups', 'data/reports', 'logs'];
  let allGood = true;
  
  for (const dir of requiredDirs) {
    try {
      const fullPath = path.join(process.cwd(), dir);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
      
      // Test write permissions
      const testFile = path.join(fullPath, '.permission-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      console.log(`✅ Directory writable: ${dir}`);
    } catch (error) {
      console.log(`❌ Directory permission error for ${dir}: ${error.message}`);
      allGood = false;
    }
  }
  
  return allGood;
}

/**
 * Main validation function
 */
async function validateEnvironment() {
  console.log('='.repeat(60));
  console.log('🔑 API KEYS VALIDATION');
  console.log('='.repeat(60));
  
  // Required API Keys
  validateRequired('THERESANAIFORTHAT_API_KEY', 'There Is An AI For That API key', /^taift_/);
  validateRequired('PRODUCTHUNT_CLIENT_ID', 'Product Hunt client ID', /^ph_/);
  validateRequired('PRODUCTHUNT_CLIENT_SECRET', 'Product Hunt client secret', /^ph_secret_/);
  validateRequired('PRODUCTHUNT_ACCESS_TOKEN', 'Product Hunt access token', /^ph_token_/);
  
  // Optional API Keys
  validateOptional('FUTURETOOLS_API_KEY', 'Future Tools API key', /^ft_/);
  
  console.log('\n' + '='.repeat(60));
  console.log('🗄️  DATABASE CONFIGURATION');
  console.log('='.repeat(60));
  
  const dbUrl = process.env.DATABASE_URL;
  if (validateRequired('DATABASE_URL', 'database connection string', /^postgres/)) {
    await testDatabaseConnection(dbUrl);
  }
  
  validateOptional('BACKUP_DATABASE_URL', 'backup database connection string', /^postgres/);
  
  console.log('\n' + '='.repeat(60));
  console.log('📢 NOTIFICATION SERVICES');
  console.log('='.repeat(60));
  
  const slackWebhook = process.env.SLACK_WEBHOOK;
  if (validateOptional('SLACK_WEBHOOK', 'Slack webhook URL', /^https:\/\/hooks\.slack\.com/)) {
    testSlackWebhook(slackWebhook);
  }
  
  validateOptional('SLACK_CRITICAL_CHANNEL', 'Slack critical alerts channel');
  validateOptional('SMTP_HOST', 'SMTP host');
  validateOptional('SMTP_PORT', 'SMTP port', /^\d+$/);
  validateOptional('SMTP_USER', 'SMTP username');
  validateOptional('SMTP_PASSWORD', 'SMTP password');
  validateOptional('NOTIFICATION_EMAIL', 'notification email', /^.+@.+\..+$/);
  
  console.log('\n' + '='.repeat(60));
  console.log('⚙️  PIPELINE CONFIGURATION');
  console.log('='.repeat(60));
  
  validateOptional('NODE_ENV', 'environment mode');
  validateOptional('LOG_LEVEL', 'logging level');
  validateOptional('PIPELINE_DRY_RUN', 'dry run mode', /^(true|false)$/);
  validateOptional('CONCURRENT_REQUESTS_LIMIT', 'concurrent requests limit', /^\d+$/);
  validateOptional('REQUEST_TIMEOUT_MS', 'request timeout', /^\d+$/);
  validateOptional('RETRY_MAX_ATTEMPTS', 'retry attempts', /^\d+$/);
  
  console.log('\n' + '='.repeat(60));
  console.log('🛡️  SAFETY CONFIGURATION');
  console.log('='.repeat(60));
  
  validateOptional('CIRCUIT_FAILURE_THRESHOLD', 'circuit breaker failure threshold', /^\d+$/);
  validateOptional('CIRCUIT_SUCCESS_THRESHOLD', 'circuit breaker success threshold', /^\d+$/);
  validateOptional('CIRCUIT_TIMEOUT_MS', 'circuit breaker timeout', /^\d+$/);
  validateOptional('SAFETY_MAX_VOLUME_INCREASE_PERCENT', 'max volume increase percent', /^\d+$/);
  validateOptional('SAFETY_MIN_AVERAGE_QUALITY', 'minimum average quality', /^\d+(\.\d+)?$/);
  
  console.log('\n' + '='.repeat(60));
  console.log('📁 FILE SYSTEM PERMISSIONS');  
  console.log('='.repeat(60));
  
  checkFileSystemPermissions();
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 VALIDATION SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`Total validations: ${validations}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);
  
  if (errors.length > 0) {
    console.log('\n🚨 ERRORS (must be fixed):');
    errors.forEach(error => console.log(`  ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (should be addressed):');
    warnings.forEach(warning => console.log(`  ${warning}`));
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n🎉 All validations passed! Environment is properly configured.');
    process.exit(0);
  } else if (errors.length === 0) {
    console.log('\n✅ Required configuration is valid. Some optional settings have warnings.');
    process.exit(0);
  } else {
    console.log('\n❌ Environment configuration has errors that must be fixed.');
    process.exit(1);
  }
}

/**
 * Additional validation functions for GitHub Actions context
 */
function validateGitHubContext() {
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.log('\n' + '='.repeat(60));
    console.log('🏃 GITHUB ACTIONS CONTEXT');
    console.log('='.repeat(60));
    
    validateOptional('GITHUB_TOKEN', 'GitHub Actions token');
    validateOptional('GITHUB_REPOSITORY', 'GitHub repository');
    validateOptional('GITHUB_REF', 'GitHub ref');
    validateOptional('GITHUB_SHA', 'GitHub SHA');
    validateOptional('GITHUB_RUN_ID', 'GitHub run ID');
    validateOptional('GITHUB_RUN_NUMBER', 'GitHub run number');
    validateOptional('GITHUB_ACTOR', 'GitHub actor');
    
    console.log(`✅ Running in GitHub Actions context`);
  } else {
    console.log('\nℹ️  Not running in GitHub Actions context (local development)');
  }
}

/**
 * Show configuration recommendations
 */
function showRecommendations() {
  console.log('\n' + '='.repeat(60));
  console.log('💡 CONFIGURATION RECOMMENDATIONS');
  console.log('='.repeat(60));
  
  const recommendations = [
    'Ensure API keys have appropriate rate limits configured',
    'Use separate API keys for development and production',
    'Set up database connection pooling for production',
    'Configure log rotation to prevent disk space issues',
    'Set up monitoring alerts for pipeline failures',
    'Test emergency rollback procedures regularly',
    'Keep API key documentation updated with rotation schedules',
    'Use GitHub Environments for better secret management',
    'Configure branch protection rules for production deployments',
    'Set up automated secret rotation where possible'
  ];
  
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
}

// Run validation
async function main() {
  try {
    await validateEnvironment();
    validateGitHubContext();
    showRecommendations();
  } catch (error) {
    console.error('❌ Validation failed with error:', error.message);
    process.exit(1);
  }
}

// Handle command line usage
if (require.main === module) {
  main();
}

module.exports = {
  validateEnvironment,
  validateRequired,
  validateOptional,
  testDatabaseConnection,
  testSlackWebhook,
  checkFileSystemPermissions
};