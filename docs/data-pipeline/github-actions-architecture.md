# GitHub Actions CI/CD Pipeline Architecture

## Overview
This document outlines the automated workflow architecture for the Nexus AI tools data pipeline using GitHub Actions. The system provides weekly automated data refresh with human oversight and safety mechanisms.

---

## WORKFLOW ARCHITECTURE

### Core Principles
1. **Safety First**: All changes require human review via PRs
2. **Transparency**: Comprehensive diff reports and logging
3. **Reliability**: Robust error handling and rollback mechanisms
4. **Efficiency**: Automated execution with manual oversight
5. **Security**: Proper secrets management and environment isolation

### Workflow Components

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Ecosystem                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌──────────────────┐               │
│  │   Scheduled     │    │    Manual        │               │
│  │   Trigger       │    │    Trigger       │               │
│  │  (Weekly Cron)  │    │  (Workflow Dispatch) │          │
│  └─────────────────┘    └──────────────────┘               │
│           │                       │                        │
│           └───────┬───────────────┘                        │
│                   │                                        │
│         ┌─────────▼─────────┐                              │
│         │   Main Data       │                              │
│         │   Refresh         │                              │
│         │   Workflow        │                              │
│         └─────────┬─────────┘                              │
│                   │                                        │
│    ┌──────────────┼──────────────┐                         │
│    │              │              │                         │
│    ▼              ▼              ▼                         │
│ ┌──────┐    ┌──────────┐    ┌──────────┐                  │
│ │ Data │    │   Diff   │    │    PR    │                  │
│ │Fetch │    │Generation│    │ Creation │                  │
│ │ Job  │    │   Job    │    │   Job    │                  │
│ └──────┘    └──────────┘    └──────────┘                  │
│                   │              │                        │
│         ┌─────────▼─────────┐    │                        │
│         │   Notification    │    │                        │
│         │      Job          │    │                        │
│         └───────────────────┘    │                        │
│                                  │                        │
│              ┌───────────────────▼───────────────────┐    │
│              │         Review Process                │    │
│              │                                       │    │
│              │  ┌─────────┐    ┌─────────────┐      │    │
│              │  │ Human   │    │  Automated  │      │    │
│              │  │ Review  │    │   Tests     │      │    │
│              │  │         │    │             │      │    │
│              │  └─────────┘    └─────────────┘      │    │
│              │                                       │    │
│              │  ┌─────────┐    ┌─────────────┐      │    │
│              │  │ Approve │    │   Reject    │      │    │
│              │  │  & Merge│    │ & Rollback  │      │    │
│              │  │         │    │             │      │    │
│              │  └─────────┘    └─────────────┘      │    │
│              └───────────────────────────────────────┘    │
│                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## WORKFLOW DEFINITIONS

### 1. **Main Data Refresh Workflow** (`data-refresh.yml`)
**Trigger**: Weekly schedule (Sundays 2 AM UTC) + Manual dispatch
**Purpose**: Execute complete data pipeline and create PR with changes

```yaml
name: Weekly AI Tools Data Refresh
on:
  schedule:
    - cron: '0 2 * * 0'  # Every Sunday at 2 AM UTC
  workflow_dispatch:     # Manual trigger
```

**Jobs Sequence**:
1. **Environment Setup** (5 minutes)
2. **Data Pipeline Execution** (20-30 minutes)
3. **Diff Generation** (5 minutes)  
4. **PR Creation** (2 minutes)
5. **Notification** (1 minute)

### 2. **Health Check Workflow** (`health-check.yml`)
**Trigger**: Daily schedule + API webhook
**Purpose**: Monitor pipeline health and data freshness

```yaml
name: Data Pipeline Health Check
on:
  schedule:
    - cron: '0 8 * * *'   # Daily at 8 AM UTC
  repository_dispatch:
    types: [health-check]
```

### 3. **Emergency Rollback Workflow** (`emergency-rollback.yml`)
**Trigger**: Manual dispatch only
**Purpose**: Quick rollback of problematic data changes

```yaml
name: Emergency Data Rollback
on:
  workflow_dispatch:
    inputs:
      pr_number:
        description: 'PR number to rollback'
        required: true
      reason:
        description: 'Rollback reason'
        required: true
```

### 4. **PR Validation Workflow** (`pr-validation.yml`)
**Trigger**: PR creation/update on data files
**Purpose**: Validate data changes before merge

```yaml
name: Data Changes Validation
on:
  pull_request:
    paths:
      - 'data/**'
      - 'scripts/data-pipeline/**'
```

---

## DETAILED WORKFLOW SPECIFICATIONS

### Main Data Refresh Workflow

#### **Job 1: Environment Setup**
```yaml
setup:
  runs-on: ubuntu-latest
  outputs:
    cache-key: ${{ steps.cache.outputs.cache-hit }}
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: 'scripts/data-pipeline/package-lock.json'
    
    - name: Install dependencies
      run: |
        cd scripts/data-pipeline
        npm ci
    
    - name: Validate environment
      run: |
        cd scripts/data-pipeline
        npm run validate-env
```

#### **Job 2: Data Pipeline Execution**
```yaml
pipeline:
  needs: setup
  runs-on: ubuntu-latest
  timeout-minutes: 45
  steps:
    - name: Run data pipeline
      env:
        THERESANAIFORTHAT_API_KEY: ${{ secrets.TAIFT_API_KEY }}
        PRODUCTHUNT_CLIENT_ID: ${{ secrets.PH_CLIENT_ID }}
        PRODUCTHUNT_CLIENT_SECRET: ${{ secrets.PH_CLIENT_SECRET }}
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
      run: |
        cd scripts/data-pipeline
        npm run refresh -- --output-format=json --generate-report
    
    - name: Upload pipeline results
      uses: actions/upload-artifact@v4
      with:
        name: pipeline-results
        path: |
          scripts/data-pipeline/output/
          scripts/data-pipeline/logs/
        retention-days: 30
```

#### **Job 3: Diff Generation**
```yaml
diff:
  needs: pipeline
  runs-on: ubuntu-latest
  steps:
    - name: Download pipeline results
      uses: actions/download-artifact@v4
      with:
        name: pipeline-results
        path: ./results
    
    - name: Generate human-readable diff
      run: |
        cd scripts/data-pipeline
        npm run generate-diff -- \
          --previous=data/ai-tools.json \
          --current=./results/output/ai-tools.json \
          --format=markdown \
          --output=./diff-report.md
    
    - name: Upload diff report
      uses: actions/upload-artifact@v4
      with:
        name: diff-report
        path: scripts/data-pipeline/diff-report.md
```

#### **Job 4: PR Creation**
```yaml
create-pr:
  needs: [pipeline, diff]
  runs-on: ubuntu-latest
  if: ${{ needs.pipeline.outputs.changes-detected == 'true' }}
  steps:
    - name: Download artifacts
      uses: actions/download-artifact@v4
    
    - name: Create data update branch
      run: |
        git config user.name "nexus-data-bot[bot]"
        git config user.email "nexus-data-bot[bot]@users.noreply.github.com"
        
        # Create unique branch name
        BRANCH_NAME="data-refresh/$(date +%Y-%m-%d-%H%M%S)"
        git checkout -b "$BRANCH_NAME"
        
        # Copy new data files
        cp results/output/* data/
        
        # Commit changes
        git add data/
        git commit -m "🤖 Weekly AI tools data refresh $(date +%Y-%m-%d)"
        git push origin "$BRANCH_NAME"
        
        echo "BRANCH_NAME=$BRANCH_NAME" >> $GITHUB_ENV
    
    - name: Create Pull Request
      uses: peter-evans/create-pull-request@v5
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        branch: ${{ env.BRANCH_NAME }}
        title: "🤖 Weekly AI Tools Data Refresh - $(date +%Y-%m-%d)"
        body-path: scripts/data-pipeline/diff-report.md
        labels: |
          data-refresh
          automated
          review-required
        reviewers: |
          svetkars
        assignees: |
          svetkars
        draft: false
```

---

## SAFETY MECHANISMS

### 1. **Pre-execution Validation**
- Environment variable validation
- API key testing
- Database connectivity check
- Dependency verification

### 2. **Data Quality Gates**
```yaml
quality-gates:
  - name: Minimum tool count
    condition: new_tools_count >= (previous_count * 0.95)
    action: fail_if_false
  
  - name: Maximum quality flags
    condition: quality_flags_ratio <= 0.15
    action: warn_if_false
  
  - name: Duplicate detection rate
    condition: duplicate_rate <= 0.30
    action: warn_if_false
  
  - name: SMB relevance score
    condition: average_smb_score >= 60
    action: fail_if_false
```

### 3. **Rollback Mechanisms**
- **Automatic rollback**: If quality gates fail
- **Manual rollback**: Emergency workflow for quick reversion
- **Gradual rollback**: Staged reversion for partial failures

### 4. **Review Process**
- **Required reviewers**: At least 1 human reviewer
- **Status checks**: All CI checks must pass
- **Branch protection**: Main branch protected from direct pushes
- **Auto-merge prevention**: No auto-merge for data changes

---

## MONITORING AND ALERTING

### Success Notifications
```yaml
- name: Success notification
  uses: 8398a7/action-slack@v3
  with:
    status: success
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
    message: |
      ✅ Weekly data refresh completed successfully!
      
      📊 Summary:
      • New tools: ${{ env.NEW_TOOLS }}
      • Updated tools: ${{ env.UPDATED_TOOLS }}
      • Quality flags: ${{ env.QUALITY_FLAGS }}
      • PR: #${{ env.PR_NUMBER }}
```

### Failure Notifications
```yaml
- name: Failure notification
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
    message: |
      ❌ Weekly data refresh failed!
      
      🔍 Details:
      • Workflow: ${{ github.workflow }}
      • Run: ${{ github.run_id }}
      • Error: Check logs for details
      • Action required: Manual investigation needed
```

### Health Monitoring
```yaml
health-metrics:
  - pipeline_success_rate: 95%
  - data_freshness: 85%
  - quality_score: 75%
  - processing_time: <30min
  - pr_merge_rate: 90%
```

---

## ENVIRONMENT CONFIGURATION

### Repository Secrets Required
```
# API Keys
TAIFT_API_KEY                    # There Is An AI For That API key
PH_CLIENT_ID                     # Product Hunt client ID
PH_CLIENT_SECRET                 # Product Hunt client secret
PH_ACCESS_TOKEN                  # Product Hunt access token

# Database
DATABASE_URL                     # PostgreSQL connection string

# Notifications
SLACK_WEBHOOK                    # Slack webhook for notifications
NOTIFICATION_EMAIL               # Email for critical alerts

# GitHub
GITHUB_TOKEN                     # GitHub token for PR creation (auto-provided)
PR_REVIEWER_TEAM                 # GitHub team for automatic reviewer assignment

# Security
PIPELINE_ENCRYPTION_KEY          # For encrypting sensitive pipeline data
API_SIGNING_SECRET               # For API request signing (if enabled)
```

### Environment Variables
```yaml
env:
  NODE_ENV: production
  LOG_LEVEL: info
  PIPELINE_DRY_RUN: false
  QUALITY_MINIMUM_SCORE: 60
  SMB_RELEVANCE_THRESHOLD: 40
  CONCURRENT_REQUESTS_LIMIT: 5
  MAX_EXECUTION_TIME: 2700  # 45 minutes
```

---

## SECURITY CONSIDERATIONS

### 1. **Secrets Management**
- All API keys stored as repository secrets
- No secrets in logs or outputs
- Masked sensitive data in workflow runs
- Regular secret rotation schedule

### 2. **Branch Protection**
- Main branch requires PR reviews
- Status checks must pass before merge
- No direct pushes to main branch
- Signed commits required for data changes

### 3. **Access Control**
- Workflow triggers limited to repository maintainers
- PR approvals required from designated reviewers
- Emergency rollback restricted to administrators
- Audit logging for all data changes

### 4. **Data Validation**
- Input sanitization for all external data
- Schema validation before database writes
- Content security checks for malicious data
- Regular security scanning of dependencies

---

## DEPLOYMENT STRATEGY

### Phase 1: Setup and Testing
- [ ] Create workflow files
- [ ] Configure repository secrets
- [ ] Set up branch protection rules
- [ ] Test with dry-run executions

### Phase 2: Staged Rollout  
- [ ] Enable workflows with manual triggers only
- [ ] Validate end-to-end process
- [ ] Refine notification and alerting
- [ ] Train team on review process

### Phase 3: Full Automation
- [ ] Enable scheduled executions
- [ ] Monitor for 2 weeks with close oversight
- [ ] Optimize performance and reliability
- [ ] Document operational procedures

### Phase 4: Optimization
- [ ] Implement advanced monitoring
- [ ] Add performance metrics
- [ ] Optimize execution time
- [ ] Enhance error handling

This architecture provides a robust, secure, and maintainable CI/CD pipeline for automated data refresh while maintaining human oversight and safety mechanisms.