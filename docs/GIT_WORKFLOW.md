# Git Workflow Process - HOILTD Azure Marketplace Generator

## Overview
This repository follows a **GitFlow-inspired workflow** with strict branch protection rules to ensure code quality, security compliance, and proper review processes.

## Branch Structure

### 🔄 Main Branches

#### `main`
- **Purpose**: Production-ready code only
- **Protection**: Full branch protection with required PR reviews
- **Merges**: Only from `develop` branch via Pull Request
- **Deployment**: Triggers production deployments when tagged
- **Rules**: No direct pushes allowed, requires 1+ approved reviews

#### `develop` (Default Branch)
- **Purpose**: Integration branch for feature development
- **Protection**: Branch protection with required status checks
- **Merges**: Feature branches merge here first
- **Rules**: No direct pushes, requires PR reviews and passing CI

### 🌿 Supporting Branches

#### Feature Branches: `feature/[description]`
- **Source**: Created from `develop`
- **Merge Target**: `develop` branch
- **Naming**: `feature/add-new-template`, `feature/fix-security-issue`
- **Lifecycle**: Deleted after successful merge

#### Release Branches: `release/[version]`
- **Source**: Created from `develop` when ready for release
- **Purpose**: Final testing and bug fixes for release
- **Merge Target**: Both `main` and `develop`
- **Naming**: `release/v1.2.0`

#### Hotfix Branches: `hotfix/[description]`
- **Source**: Created from `main` for critical production fixes
- **Merge Target**: Both `main` and `develop`
- **Naming**: `hotfix/critical-security-patch`
- **Urgency**: Only for production-critical issues

## Workflow Process

### 🚀 Standard Feature Development

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Develop and Commit**
   ```bash
   git add .
   git commit -m "feat: implement new feature"
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request**
   - **Base**: `develop` branch
   - **Target**: Your feature branch
   - **Reviews**: Minimum 1 approval required
   - **Checks**: All CI/CD checks must pass

4. **Merge to Develop**
   - After approval and passing checks
   - Use "Squash and merge" for clean history
   - Delete feature branch after merge

### 📦 Release Process

1. **Create Release Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.2.0
   ```

2. **Final Testing & Bug Fixes**
   - Final testing and documentation updates
   - Version bumps in package.json
   - Only bug fixes, no new features

3. **Merge to Main**
   ```bash
   # Create PR: release/v1.2.0 → main
   # After approval and testing
   git checkout main
   git merge --no-ff release/v1.2.0
   git tag -a v1.2.0 -m "Release version 1.2.0"
   git push origin main --tags
   ```

4. **Merge Back to Develop**
   ```bash
   git checkout develop
   git merge --no-ff release/v1.2.0
   git push origin develop
   ```

### 🚨 Hotfix Process

1. **Create Hotfix Branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-issue
   ```

2. **Fix and Test**
   ```bash
   # Make minimal changes to fix critical issue
   git commit -m "hotfix: resolve critical security vulnerability"
   git push origin hotfix/critical-issue
   ```

3. **Merge to Main and Develop**
   ```bash
   # Create PR: hotfix/critical-issue → main
   # After approval and testing
   git checkout main
   git merge --no-ff hotfix/critical-issue
   git tag -a v1.2.1 -m "Hotfix version 1.2.1"
   git push origin main --tags

   # Also merge to develop
   git checkout develop
   git merge --no-ff hotfix/critical-issue
   git push origin develop
   ```

## Branch Protection Rules

### Main Branch Protection
- ✅ Require pull request reviews (1+ approvals)
- ✅ Dismiss stale reviews when new commits are pushed
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require signed commits
- ❌ Do not allow force pushes
- ❌ Do not allow deletions

### Develop Branch Protection
- ✅ Require pull request reviews (1+ approvals)
- ✅ Dismiss stale reviews when new commits are pushed
- ✅ Require status checks to pass before merging
- ✅ Required status checks:
  - Security Scan/security-scan
  - 🔒 Enterprise Security & ARM-TTK Validation/🏢 HOILTD Security Compliance
- ❌ Do not allow force pushes
- ❌ Do not allow deletions

## CI/CD Integration

### Automatic Triggers
- **Security Scans**: Run on all pushes to `main` and `develop`
- **Pull Request Checks**: Run on all PRs targeting `main` or `develop`
- **Production Deployment**: Triggered only by tags on `main` branch
- **Dependency Updates**: Daily scans and automated PRs to `develop`

### Required Checks
All PRs must pass these checks before merging:
1. **Security Scan** - GitHub Enterprise security scanning
2. **Enterprise Security Compliance** - HOILTD security policies
3. **TypeScript Compilation** - Strict mode compilation
4. **Unit Tests** - All tests must pass
5. **ARM-TTK Validation** - Azure template validation

## Best Practices

### ✅ Do's
- Always create feature branches from `develop`
- Write descriptive commit messages using conventional commits
- Keep PRs focused and small
- Run tests locally before pushing
- Update documentation with new features
- Use semantic versioning for releases

### ❌ Don'ts
- Never push directly to `main` or `develop`
- Don't merge without passing all required checks
- Don't commit secrets or sensitive data
- Don't force push to protected branches
- Don't skip code reviews
- Don't merge your own PRs without approval

## Emergency Procedures

### Production Outage
1. Create hotfix branch from `main`
2. Implement minimal fix
3. Fast-track PR review with admin override if necessary
4. Deploy immediately after merge
5. Follow up with post-mortem

### Security Vulnerability
1. Create private security branch
2. Implement fix
3. Coordinate with security team
4. Merge via emergency hotfix process
5. Coordinate disclosure timeline

## Repository Admins

Repository administrators can:
- Override branch protection rules in emergencies
- Force merge critical hotfixes
- Create and manage release branches
- Configure repository settings and policies

## Support

For questions about this workflow:
1. Check this documentation first
2. Consult the team lead
3. Create an issue in the repository
4. Contact the DevOps team

---

**Last Updated**: October 12, 2025
**Version**: 1.0
**Maintainer**: HOME-OFFICE-IMPROVEMENTS-LTD DevOps Team