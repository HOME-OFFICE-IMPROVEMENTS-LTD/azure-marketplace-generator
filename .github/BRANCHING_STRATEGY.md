# Git Branching Strategy

## Branch Structure

### Core Branches
- `main` - Production-ready, stable code (protected)
- `develop` - Integration branch for feature testing

### Feature Branches  
- `feature/event-grid-integration` - Add Event Grid to storage template
- `feature/automation-workflows` - Pre-built automation templates
- `feature/marketplace-packaging` - Enhanced packaging for marketplace

### Resource Branches (Future)
- `resource/compute` - VM and container templates
- `resource/networking` - VNet, LB, firewall templates  
- `resource/database` - SQL, CosmosDB, PostgreSQL templates
- `resource/ai-services` - AI/ML service templates

### Release Branches
- `release/v1.0.0` - Prepare releases for marketplace
- `release/v1.1.0` - Version-specific release preparation

## Workflow Rules

1. **Never commit directly to main**
2. **Develop from feature branches**
3. **Merge to develop first, test, then PR to main**
4. **Main branch requires pull request reviews**
5. **Use semantic commit messages**

## Branch Naming Convention

```
feature/descriptive-name
resource/azure-service-type
release/version-number
hotfix/critical-fix-description
```

## Protection Rules (Recommended)

### Main Branch
- Require pull request reviews (2 reviewers)
- Require status checks to pass
- Require up-to-date branches
- Include administrators in restrictions

### Develop Branch  
- Require pull request reviews (1 reviewer)
- Allow force pushes for integration fixes