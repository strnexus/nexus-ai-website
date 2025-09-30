# 🔐 GitHub Secrets and Environment Setup Guide

This document provides step-by-step instructions for configuring GitHub repository secrets and environment variables required for the AI tools data pipeline.

## 🚨 Security Notice

**NEVER commit API keys, tokens, or sensitive data to version control.** All sensitive configuration must be stored as GitHub repository secrets.

## 📋 Required Secrets

### 1. **API Keys**

#### There Is An AI For That (TAIFT)
- **Secret Name**: `TAIFT_API_KEY`
- **Description**: API key for accessing theresanaiforthat.com data
- **How to obtain**: 
  1. Visit [theresanaiforthat.com/api](https://theresanaiforthat.com/api)
  2. Create an account or log in
  3. Generate API key from dashboard
- **Format**: `taift_xxxxxxxxxxxxxxxxxx`

#### Product Hunt
- **Secret Names**: 
  - `PH_CLIENT_ID`
  - `PH_CLIENT_SECRET` 
  - `PH_ACCESS_TOKEN`
- **Description**: Product Hunt API credentials for accessing AI tool listings
- **How to obtain**:
  1. Visit [api.producthunt.com](https://api.producthunt.com)
  2. Create a new application
  3. Copy Client ID, Client Secret, and generate Access Token
- **Format**: 
  - Client ID: `ph_xxxxxxxxxx`
  - Client Secret: `ph_secret_xxxxxxxxxxxxxxxxxx`
  - Access Token: `ph_token_xxxxxxxxxxxxxxxxxx`

#### Future Tools (Optional)
- **Secret Name**: `FUTURETOOLS_API_KEY`
- **Description**: API key for Future Tools data (if available)
- **Format**: `ft_xxxxxxxxxxxxxxxxxx`

### 2. **Database Configuration**

#### Primary Database
- **Secret Name**: `DATABASE_URL`
- **Description**: Primary database connection string for storing processed data
- **Format**: `postgresql://username:password@host:port/database`
- **Recommended**: Use PostgreSQL on services like:
  - [Supabase](https://supabase.com) (Free tier available)
  - [Neon](https://neon.tech) (Free tier available) 
  - [Railway](https://railway.app) (Free tier available)

#### Backup Database (Optional)
- **Secret Name**: `BACKUP_DATABASE_URL`
- **Description**: Backup database for redundancy
- **Format**: Same as DATABASE_URL

### 3. **Notification Services**

#### Slack Notifications
- **Secret Name**: `SLACK_WEBHOOK`
- **Description**: Slack webhook URL for pipeline notifications
- **How to obtain**:
  1. Go to your Slack workspace
  2. Create a new app at [api.slack.com](https://api.slack.com/apps)
  3. Enable Incoming Webhooks
  4. Create webhook for your channel
- Format: Set as a GitHub Actions secret named SLACK_WEBHOOK. Do not include actual URLs in the repository. Example placeholder: `https://hooks.slack.com/services/{{SLACK_WEBHOOK_TOKEN}}` (replace in CI at runtime).

#### Email Notifications (Optional)
- **Secret Names**:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASSWORD`
  - `NOTIFICATION_EMAIL`
- **Description**: SMTP configuration for email alerts

### 4. **GitHub Integration**

#### GitHub Token (Auto-generated)
- **Secret Name**: `GITHUB_TOKEN`
- **Description**: Automatically provided by GitHub Actions
- **Note**: No manual setup required

#### Custom GitHub Token (Optional)
- **Secret Name**: `GH_PERSONAL_TOKEN`
- **Description**: Personal access token for enhanced GitHub API access
- **How to obtain**:
  1. Go to GitHub Settings > Developer settings > Personal access tokens
  2. Generate new token with `repo` and `workflow` scopes
- **Format**: `ghp_xxxxxxxxxxxxxxxxxxxx`

## 🔧 Setting Up Secrets in GitHub

### Step 1: Navigate to Repository Settings
1. Go to your GitHub repository
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** > **Actions**

### Step 2: Add Repository Secrets
For each required secret:

1. Click **New repository secret**
2. Enter the **Name** (exactly as listed above)
3. Enter the **Value** (the actual API key/credential)
4. Click **Add secret**

### Step 3: Verify Secrets
After adding all secrets, you should see them listed in the repository secrets section. The values will be hidden for security.

## 🔍 Environment Variables

### Production Environment
The following environment variables are automatically set by GitHub Actions:

```bash
# Runtime Environment
NODE_ENV=production
LOG_LEVEL=info
PIPELINE_TIMEOUT=2700  # 45 minutes

# Performance Settings  
CONCURRENT_REQUESTS_LIMIT=5
REQUEST_TIMEOUT_MS=30000
RETRY_MAX_ATTEMPTS=3

# Quality Settings
QUALITY_MINIMUM_SCORE=60
SMB_RELEVANCE_THRESHOLD=40
DEDUPLICATION_ENABLED=true
```

### Development Environment
Create a `.env` file locally for development (DO NOT COMMIT):

```bash
# Copy from .env.example and fill in real values
THERESANAIFORTHAT_API_KEY=your_taift_key_here
PRODUCTHUNT_CLIENT_ID=your_ph_client_id
PRODUCTHUNT_CLIENT_SECRET=your_ph_secret
PRODUCTHUNT_ACCESS_TOKEN=your_ph_token
DATABASE_URL=postgresql://localhost:5432/nexus_dev
SLACK_WEBHOOK=your_slack_webhook_url_here
```

## ✅ Testing Configuration

### 1. Local Testing
After setting up your local `.env` file:

```bash
# Test database connection
npm run test:db

# Test API connections
npm run test:apis

# Test full pipeline (dry run)
npm run pipeline -- --dry-run --verbose
```

### 2. GitHub Actions Testing
1. Push changes to a feature branch
2. Manually trigger the workflow:
   - Go to **Actions** tab
   - Select **Weekly AI Tools Data Refresh**
   - Click **Run workflow**
   - Enable **dry_run** mode for testing

### 3. Health Check
Use the safety CLI to verify configuration:

```bash
# Check system health
npx ts-node src/data-pipeline/scripts/safety-cli.ts health --verbose

# Test circuit breaker
npx ts-node src/data-pipeline/scripts/safety-cli.ts circuit

# Validate safety systems
npx ts-node src/data-pipeline/scripts/safety-cli.ts check --quick
```

## 🔒 Security Best Practices

### 1. **Principle of Least Privilege**
- Only grant minimum required permissions to API keys
- Use read-only keys where possible
- Regularly rotate keys and tokens

### 2. **Secret Rotation**
- Rotate API keys quarterly or when team members leave
- Update secrets immediately if suspected compromise
- Monitor API usage for unusual activity

### 3. **Environment Separation**
- Use separate API keys for development and production
- Never use production secrets in development
- Use different database instances for each environment

### 4. **Monitoring and Alerting**
- Monitor API usage and rate limits
- Set up alerts for authentication failures
- Track secret usage in GitHub Actions logs

### 5. **Access Control**
- Limit repository access to necessary team members
- Use branch protection rules for production deployments
- Require pull request reviews for workflow changes

## 🚨 Emergency Procedures

### If Secrets Are Compromised:

1. **Immediate Actions**:
   - Revoke compromised API keys immediately
   - Generate new keys/tokens
   - Update GitHub secrets with new values

2. **Assessment**:
   - Review recent API usage logs
   - Check for unauthorized data access
   - Identify potential impact scope

3. **Recovery**:
   - Update all affected systems
   - Test pipeline functionality
   - Monitor for unusual activity

4. **Prevention**:
   - Review access controls
   - Audit team access
   - Update security procedures

## 📞 Support and Troubleshooting

### Common Issues:

1. **"Invalid API Key" Errors**:
   - Verify secret name matches exactly
   - Check API key format and validity
   - Ensure key has required permissions

2. **Database Connection Failures**:
   - Verify DATABASE_URL format
   - Check network connectivity
   - Confirm database is running

3. **Workflow Permission Errors**:
   - Verify GITHUB_TOKEN has required scopes
   - Check repository settings permissions
   - Review branch protection rules

### Getting Help:
- Check workflow logs in GitHub Actions
- Use safety CLI health checks
- Review API provider documentation
- Contact team leads for credential issues

## ✅ Configuration Checklist

- [ ] All required API keys added to GitHub secrets
- [ ] Database connection configured and tested
- [ ] Slack webhook setup for notifications
- [ ] Local development environment configured
- [ ] GitHub Actions workflow permissions verified
- [ ] Safety systems tested and operational
- [ ] Emergency procedures documented and accessible
- [ ] Team members have appropriate repository access
- [ ] Secret rotation schedule established
- [ ] Monitoring and alerting configured