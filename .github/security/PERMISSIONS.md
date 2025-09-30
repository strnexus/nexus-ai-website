# 🔐 GitHub Actions Permissions Configuration

This document outlines the required permissions and security settings for the AI tools data pipeline GitHub Actions workflows.

## 📋 Required Repository Permissions

### 1. **Workflow Permissions**
Configure in: Repository Settings → Actions → General → Workflow permissions

**Required Setting**: `Read and write permissions`

**Rationale**: 
- Create/update data files in the repository
- Create pull requests with data changes
- Write workflow run summaries and logs
- Upload artifacts and generate reports

### 2. **Token Permissions**
The `GITHUB_TOKEN` automatically has the following permissions needed:

- ✅ **contents: write** - Read and write repository files
- ✅ **pull-requests: write** - Create and update pull requests  
- ✅ **actions: read** - Access workflow artifacts and logs
- ✅ **metadata: read** - Access repository metadata

## 🔧 Repository Security Settings

### 1. **Branch Protection Rules**
Configure for `main` branch:

```yaml
Branch Protection Settings:
✅ Require a pull request before merging
✅ Require approvals (minimum: 1)
✅ Dismiss stale PR approvals when new commits are pushed
✅ Require review from code owners
✅ Require status checks to pass before merging
   - Required checks: "Execute Data Pipeline"
✅ Require branches to be up to date before merging
✅ Restrict pushes that create files larger than 100MB
✅ Allow force pushes: false
✅ Allow deletions: false
```

### 2. **Secrets Access Control**

#### Environment-based Secrets (Recommended)
Create environments for better secret management:

1. **Production Environment**:
   ```yaml
   Name: production
   Protection Rules:
   - Required reviewers: [repository admins]
   - Wait timer: 5 minutes
   - Environment secrets:
     - TAIFT_API_KEY
     - DATABASE_URL
     - SLACK_WEBHOOK
     - All production secrets
   ```

2. **Development Environment**:
   ```yaml
   Name: development  
   Protection Rules: none
   Environment secrets:
   - TAIFT_API_KEY (development key)
   - DATABASE_URL (development database)
   - SLACK_WEBHOOK (development channel)
   ```

#### Repository-level Secrets
For simpler setup, use repository secrets:

```yaml
Required Secrets:
- TAIFT_API_KEY
- PH_CLIENT_ID
- PH_CLIENT_SECRET
- PH_ACCESS_TOKEN
- DATABASE_URL
- SLACK_WEBHOOK

Optional Secrets:
- FUTURETOOLS_API_KEY
- BACKUP_DATABASE_URL
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
- GH_PERSONAL_TOKEN
```

### 3. **Actions Security Settings**

#### Fork Pull Request Policy
Configure in: Repository Settings → Actions → General

```yaml
Fork pull request workflows from outside collaborators:
✅ Require approval for first-time contributors
✅ Require approval for all outside collaborators  
```

#### Workflow Run Approval
```yaml
Settings:
✅ Require approval for workflows in private repositories
✅ Approve workflow runs that require approval
```

## 🔒 Security Best Practices

### 1. **Principle of Least Privilege**

```yaml
# Use environment-specific secrets
Environment: Production
Secrets:
  - PROD_DATABASE_URL
  - PROD_SLACK_WEBHOOK
  - PROD_API_KEYS

Environment: Development  
Secrets:
  - DEV_DATABASE_URL
  - DEV_SLACK_WEBHOOK
  - DEV_API_KEYS
```

### 2. **Secret Rotation Schedule**

```yaml
Quarterly Rotation:
- API Keys (TAIFT, Product Hunt, Future Tools)
- Database passwords
- Webhook URLs

Annual Rotation:
- GitHub Personal Access Tokens
- SMTP credentials

On Team Changes:
- All secrets when team members leave
- Webhook URLs when Slack membership changes
```

### 3. **Access Monitoring**

#### Audit Log Monitoring
Monitor for:
- Secret access in workflow logs
- Unusual API usage patterns  
- Failed authentication attempts
- Workflow modification by unauthorized users

#### Usage Tracking
```yaml
Monthly Reviews:
- API key usage statistics
- Database connection logs
- Workflow execution frequency
- Failed workflow runs and causes
```

## 🚨 Emergency Security Procedures

### 1. **Suspected Secret Compromise**

**Immediate Actions** (within 1 hour):
1. Revoke compromised API keys from provider dashboards
2. Generate new secrets
3. Update GitHub repository secrets
4. Review recent workflow logs for unauthorized usage

**Assessment** (within 24 hours):
1. Audit API usage logs from providers
2. Check database access logs
3. Review GitHub audit logs
4. Assess potential data exposure

**Recovery** (within 48 hours):
1. Test all workflows with new secrets
2. Update documentation with new procedures
3. Notify team of security incident
4. Implement additional monitoring if needed

### 2. **Workflow Compromise**

**If malicious workflow changes detected**:
1. Immediately disable GitHub Actions for the repository
2. Review recent commits and pull requests  
3. Reset `main` branch to known-good state
4. Review and approve all pending pull requests
5. Re-enable Actions after security review

### 3. **Repository Access Breach**

**If unauthorized repository access**:
1. Remove suspicious collaborators immediately
2. Change all repository secrets
3. Review commit history for malicious changes
4. Enable additional branch protection rules
5. Require all team members to re-authenticate

## ⚙️ Workflow-Specific Permissions

### 1. **Data Refresh Workflow**
```yaml
# .github/workflows/data-refresh.yml
permissions:
  contents: write        # Update data files
  pull-requests: write   # Create PRs
  actions: read         # Access artifacts
  checks: write         # Update status checks
```

### 2. **Emergency Rollback Workflow**  
```yaml
# .github/workflows/emergency-rollback.yml
permissions:
  contents: write        # Rollback data files
  pull-requests: write   # Create emergency PRs
  actions: read         # Access previous artifacts
  issues: write         # Create incident issues
```

### 3. **Monitoring Workflows**
```yaml
# Future monitoring workflows
permissions:
  contents: read         # Read repository state
  actions: read         # Access workflow status
  pull-requests: read   # Check PR status
```

## 🔍 Security Validation Checklist

### Initial Setup
- [ ] Repository permissions set to "Read and write"
- [ ] All required secrets added with correct names
- [ ] Branch protection rules configured for main branch
- [ ] Environments created with appropriate protection rules
- [ ] Fork pull request policies configured
- [ ] Team access permissions reviewed and minimal

### Ongoing Security
- [ ] Monthly secret rotation schedule established
- [ ] Audit log monitoring configured
- [ ] API usage tracking implemented  
- [ ] Emergency procedures documented and tested
- [ ] Team security training completed
- [ ] Security incident response plan established

### Pre-Production Deployment
- [ ] Test workflows in development environment
- [ ] Validate all secrets work correctly
- [ ] Test emergency rollback procedures
- [ ] Verify monitoring and alerting
- [ ] Complete security review with team
- [ ] Document any deviations from best practices

## 📞 Emergency Contacts

### Security Incidents
- **Repository Owner**: [Your GitHub username]
- **Security Team**: [Team contact info]
- **On-Call Engineer**: [Contact info]

### Service Providers
- **GitHub Support**: [Enterprise support if available]
- **Database Provider**: [Support contact]
- **API Providers**: [Support contacts for each API]

## 🔗 Useful Links

- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Managing Repository Secrets](https://docs.github.com/en/actions/reference/encrypted-secrets)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests)
- [GitHub Security Advisories](https://docs.github.com/en/code-security/security-advisories)