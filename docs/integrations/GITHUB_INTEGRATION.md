# GitHub Integration Guide

Complete guide for GitHub integration features in Azure Marketplace Generator.

## Overview

Azure Marketplace Generator provides comprehensive GitHub integration for modern development workflows, including automated pull request management, GitFlow workflow automation, and continuous integration.

## Initial Setup

### Prerequisites

Before using GitHub features, ensure you have:

1. GitHub CLI installed: `gh --version`
2. GitHub personal access token with required permissions
3. Git repository with develop branch configured
4. Azure CLI authenticated: `az account show`

### Authentication Setup

Configure GitHub authentication:

```bash
# Login to GitHub CLI
gh auth login

# Verify authentication
gh auth status

# Set environment variable (optional)
export GITHUB_TOKEN="your-token-here"
```

### Repository Configuration

Initialize GitHub integration in your project:

```bash
# Clone or initialize repository
git clone https://github.com/your-org/your-repo
cd your-repo

# Set up develop branch
git checkout -b develop
git push -u origin develop

# Configure default branch
gh repo edit --default-branch develop
```

## GitFlow Workflow

### Branch Strategy

The tool implements GitFlow branching model:

- `main` - Production releases only
- `develop` - Integration branch for features
- `feature/*` - Individual feature development
- `hotfix/*` - Critical production fixes
- `release/*` - Release preparation

### Automated Workflow

Create feature branches and pull requests automatically:

```bash
# Start new feature with automated workflow
azmp workflow feature/oauth-integration "Add OAuth2 authentication"

# This command:
# 1. Creates feature/oauth-integration branch from develop
# 2. Sets up branch tracking
# 3. Creates initial commit if template specified
# 4. Opens pull request to develop branch
```

### Workflow Options

```bash
# Specify base branch (default: develop)
azmp workflow feature/new-feature "Description" --base develop

# Generate Azure template during workflow
azmp workflow feature/storage-solution "New storage" --template storage

# Run validation before creating PR
azmp workflow hotfix/security-fix "Fix vulnerability" --validate
```

## Pull Request Management

### Listing Pull Requests

View all open pull requests:

```bash
# List all open PRs
azmp pr --list

# Output shows:
# #42  feature/oauth-integration     Add OAuth2 authentication     (open)
# #41  feature/storage-template      New storage solution          (draft)
```

### Creating Pull Requests

Create PRs from current branch:

```bash
# Basic PR creation
azmp pr --create "Add new authentication system"

# PR with description
azmp pr --create "Add OAuth2 support" --body "Implements OAuth2 authentication flow with Azure AD integration"

# Create draft PR
azmp pr --create "Work in progress" --draft

# Specify target branch
azmp pr --create "Hotfix for production" --base main
```

### PR Status and Checks

Monitor pull request status:

```bash
# Show status of current branch PR
azmp pr --status

# Show specific PR status
azmp pr --status 42

# Check CI/CD status
azmp pr --checks

# Check specific PR CI/CD status
azmp pr --checks 42
```

### PR Review Process

Manage pull request reviews:

```bash
# Approve PR
azmp pr --approve 42

# Approve with comment
azmp pr --approve 42 --body "LGTM! Great implementation"

# Request changes
azmp pr --review 42 --body "Please address the security concerns"

# Interactive review
azmp pr --review 42
```

### Merging Pull Requests

Complete the PR lifecycle:

```bash
# Merge approved PR (default: merge commit)
azmp pr --merge 42

# Squash and merge
azmp pr --merge 42 --method squash

# Rebase and merge
azmp pr --merge 42 --method rebase

# Merge with confirmation
azmp pr --merge 42 --body "Merging approved feature"
```

## Branch Protection

### Protection Rules

Recommended protection settings for main and develop branches:

```bash
# View current protection rules
gh api repos/:owner/:repo/branches/main/protection

# Protection typically includes:
# - Require pull request reviews
# - Require status checks to pass
# - Require branches to be up to date
# - Restrict push to branch
```

### Bypass Protection

For hotfixes or emergency situations:

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# Make changes and push
git add .
git commit -m "Fix critical security vulnerability"
git push -u origin hotfix/critical-security-fix

# Create PR targeting main
azmp pr --create "Critical security fix" --base main
```

## CI/CD Integration

### GitHub Actions Workflow

Example workflow file (`.github/workflows/azmp.yml`):

```yaml
name: AZMP Validation and Deployment

on:
  pull_request:
    branches: [develop, main]
  push:
    branches: [develop, main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install AZMP
        run: npm install -g @azure/marketplace-generator

      - name: Validate Templates
        run: azmp validate . --intelligent --security

      - name: Package Application
        run: azmp package . --analysis-only --quality-threshold 85

      - name: Upload Validation Report
        uses: actions/upload-artifact@v3
        with:
          name: validation-report
          path: validation-report.json

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy to Azure
        run: azmp deploy package.zip --environment prod
```

### Required Secrets

Configure these secrets in GitHub repository settings:

- `AZURE_CREDENTIALS` - Azure service principal credentials
- `AZURE_TENANT_ID` - Azure tenant ID
- `AZURE_SUBSCRIPTION_ID` - Azure subscription ID

### Status Checks

Monitor workflow status through AZMP CLI:

```bash
# Check workflow status
azmp pr --checks

# Watch workflows in real-time
azmp monitor --workflows --watch

# Get detailed workflow information
gh workflow list
gh workflow view "AZMP Validation and Deployment"
```

## Advanced Features

### Automated Code Review

Request automated reviews using GitHub Copilot:

```bash
# Request Copilot review
gh pr review --request-changes --body "@github-copilot review this PR"

# Request specific review focus
gh pr review --body "@github-copilot please review the security implications"
```

### Template Integration

Generate templates during workflow creation:

```bash
# Create feature with storage template
azmp workflow feature/enterprise-storage "Enterprise storage solution" --template storage

# Create with custom template
azmp workflow feature/custom-solution "Custom solution" --template custom --config custom-config.json
```

### Multi-Repository Support

Manage multiple repositories:

```bash
# Switch repository context
gh repo set-default your-org/another-repo

# Work with specific repository
azmp pr --list --repo your-org/specific-repo

# Clone and setup new repository
gh repo clone your-org/new-repo
cd new-repo
azmp workflow setup
```

## Best Practices

### Branch Naming

Follow consistent naming conventions:

```bash
# Features
feature/user-authentication
feature/storage-optimization
feature/monitoring-dashboard

# Hotfixes
hotfix/security-vulnerability
hotfix/data-corruption-fix
hotfix/performance-regression

# Releases
release/v1.2.0
release/v2.0.0-beta
```

### Commit Messages

Use conventional commit format:

```bash
# Feature commits
feat: add OAuth2 authentication support
feat(storage): implement enterprise storage template

# Bug fixes
fix: resolve template validation error
fix(packaging): handle large file optimization

# Documentation
docs: update GitHub integration guide
docs(api): add CLI command reference
```

### PR Descriptions

Include comprehensive PR descriptions:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [x] Unit tests pass
- [x] Integration tests pass
- [x] Manual testing completed

## Checklist
- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Documentation updated
- [ ] Breaking changes documented
```

### Review Guidelines

Follow structured review process:

1. Automated validation must pass
2. At least one approval required
3. Security review for sensitive changes
4. Performance impact assessment
5. Documentation updates verified

## Troubleshooting

### Common Issues

**Authentication Failures**
```bash
# Re-authenticate GitHub CLI
gh auth logout
gh auth login

# Verify token permissions
gh auth status
```

**Branch Protection Violations**
```bash
# Check protection rules
gh api repos/:owner/:repo/branches/main/protection

# Use feature branch workflow
azmp workflow feature/fix "Description"
```

**PR Creation Failures**
```bash
# Ensure branch is pushed
git push -u origin feature-branch

# Check repository permissions
gh repo view
```

**Workflow Status Issues**
```bash
# Check workflow runs
gh workflow list
gh run list

# View specific run logs
gh run view <run-id>
```

### Debug Commands

Enable verbose logging:

```bash
# Enable debug mode
export DEBUG=azmp:github

# Verbose PR operations
azmp pr --status --verbose

# Check GitHub API rate limits
gh api rate_limit
```

## Integration Examples

### Complete Feature Development

```bash
# 1. Start feature
azmp workflow feature/payment-gateway "Add payment gateway integration"

# 2. Develop feature (make changes)
# ... edit files ...

# 3. Validate changes
azmp validate . --intelligent --fix

# 4. Update PR
git add .
git commit -m "feat: implement payment gateway integration"
git push

# 5. Check status
azmp pr --status
azmp pr --checks

# 6. Merge when approved
azmp pr --merge --method squash
```

### Hotfix Process

```bash
# 1. Create hotfix
azmp workflow hotfix/critical-bug "Fix critical production bug" --base main

# 2. Implement fix
# ... fix code ...

# 3. Test and validate
azmp validate . --security
azmp package . --quality-threshold 95

# 4. Fast-track review
azmp pr --create "URGENT: Fix critical production bug"
azmp pr --approve <pr-number> --body "Emergency fix approved"
azmp pr --merge <pr-number> --method squash

# 5. Deploy immediately
azmp deploy package.zip --environment prod
```

This integration enables seamless collaboration and automation, making GitHub an integral part of your Azure marketplace development workflow.