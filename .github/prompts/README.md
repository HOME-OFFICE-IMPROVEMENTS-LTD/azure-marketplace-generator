# Development Prompts & Templates Index

## 📋 Available Prompt Categories

This directory contains comprehensive prompts and templates to ensure professional development standards and prevent common mistakes in our Azure Marketplace Generator project.

### 🚀 Prompt Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| `GIT_WORKFLOW_PROMPTS.md` | Git workflow standards and PR requirements | Before any Git operation |
| `ARM_TEMPLATE_PROMPTS.md` | ARM template development and validation | Before editing ARM templates |
| `AZURE_OPERATIONS_PROMPTS.md` | Azure resource operations and best practices | Before Azure operations |
| `MARKETPLACE_COMPLIANCE_PROMPTS.md` | Partner Center and marketplace validation | Before marketplace submissions |
| `DEVELOPMENT_ENVIRONMENT_PROMPTS.md` | Environment setup and dependency management | During environment setup |
| `DOCUMENTATION_STANDARDS_PROMPTS.md` | Documentation writing and maintenance | Before creating/updating docs |

### 🔧 How to Use These Prompts

#### Before Git Operations
```bash
# Always check Git workflow prompts before:
cat .github/prompts/GIT_WORKFLOW_PROMPTS.md
# - Creating branches
# - Making commits  
# - Creating pull requests
# - Merging code
```

#### Before ARM Template Changes
```bash
# Always check ARM template prompts before:
cat .github/prompts/ARM_TEMPLATE_PROMPTS.md
# - Editing mainTemplate.json
# - Updating createUiDefinition.json
# - Adding new resources
# - Changing API versions
```

#### Before Azure Operations
```bash
# Always check Azure operations prompts before:
cat .github/prompts/AZURE_OPERATIONS_PROMPTS.md
# - Creating Azure resources
# - Modifying configurations
# - Deploying to Azure
# - Managing permissions
```

#### Before Marketplace Submissions
```bash
# Always check marketplace compliance prompts before:
cat .github/prompts/MARKETPLACE_COMPLIANCE_PROMPTS.md
# - Publishing to Partner Center
# - Updating marketplace listings
# - Submitting for certification
# - Making marketplace changes
```

### 🚨 Critical Reminder System

#### Daily Development Checklist
```bash
# Start of day routine:
□ Review current sprint/task requirements
□ Check Git status and current branch
□ Verify Azure CLI authentication
□ Review any relevant prompt files for planned work
□ Run npm install if package.json changed
□ Verify development environment is properly configured
```

#### Before Each Commit
```bash
# Mandatory pre-commit checks:
□ Code tested locally
□ ARM-TTK validation passed (if templates changed)
□ Lint checks passed
□ Commit message follows conventional format
□ No secrets or hardcoded values added
□ Documentation updated if needed
```

#### Before Each Pull Request
```bash
# Mandatory PR checks:
□ All CI/CD checks passing
□ Code review completed
□ ARM template validation successful
□ No merge conflicts
□ Description clearly explains changes
□ Related issues referenced
```

### 🎯 Integration with Development Workflow

#### VS Code Integration
```json
// Add to VS Code settings.json for quick access:
{
  "workbench.startupEditor": "none",
  "files.associations": {
    "*.prompts.md": "markdown"
  },
  "markdown.preview.breaks": true,
  "markdown.preview.linkify": true
}
```

#### Git Hooks Integration
```bash
# Consider adding Git hooks that reference these prompts:
# .git/hooks/pre-commit
#!/bin/bash
echo "🚨 Reminder: Check .github/prompts/GIT_WORKFLOW_PROMPTS.md before committing"
```

### 📊 Prompt Effectiveness Tracking

#### Usage Metrics
```bash
# Track prompt effectiveness by monitoring:
□ Reduced validation failures
□ Fewer rollbacks and hotfixes
□ Improved code review feedback
□ Faster marketplace approval times
□ Decreased support tickets
□ Better team compliance metrics
```

#### Continuous Improvement
```bash
# Regular prompt maintenance:
□ Update prompts based on new lessons learned
□ Add new scenarios from support tickets
□ Incorporate feedback from team members
□ Update with latest Azure/marketplace changes
□ Archive outdated information
□ Improve clarity based on usage patterns
```

### 🔄 Version Control for Prompts

#### Prompt Versioning Strategy
```bash
# Treat prompts as critical documentation:
□ Version control all prompt changes
□ Review prompt updates in PRs
□ Document reasons for prompt changes
□ Test prompt effectiveness
□ Communicate prompt updates to team
□ Archive old versions when updated
```

### 🎓 Training and Onboarding

#### New Team Member Onboarding
```bash
# Required reading for new developers:
1. Read all prompt files in this directory
2. Practice using prompts in development environment
3. Complete sample Git workflow using prompts
4. Validate ARM template using prompts
5. Demonstrate understanding in code review
```

#### Knowledge Sharing
```bash
# Regular team activities:
□ Quarterly prompt review sessions
□ Share prompt success stories
□ Discuss prompt improvements
□ Add new prompts based on team needs
□ Update prompts with industry best practices
```

### 🛠️ Tools and Automation

#### Automated Prompt Reminders
```bash
# Consider implementing:
□ IDE extensions that show relevant prompts
□ Git hooks that display prompt excerpts
□ CI/CD checks that reference prompt requirements
□ Slack bots that remind about prompt usage
□ Dashboard showing prompt compliance metrics
```

### 📞 Support and Feedback

#### Getting Help
```bash
# If prompts are unclear or incomplete:
□ Create GitHub issue with prompt improvement suggestions
□ Discuss in team meetings
□ Update prompts with clarifications
□ Share experiences and lessons learned
```

#### Contributing to Prompts
```bash
# How to improve these prompts:
1. Identify gaps or unclear instructions
2. Create feature branch for prompt updates
3. Update relevant prompt files
4. Test changes with team members
5. Create PR with clear explanation of improvements
6. Document prompt changes in changelog
```

---

## 🎯 Success Metrics

Using these prompts consistently should result in:
- ✅ Zero direct commits to main branch
- ✅ 100% ARM-TTK validation pass rate
- ✅ Faster marketplace approval times
- ✅ Reduced production issues
- ✅ Improved code review quality
- ✅ Better team collaboration
- ✅ Consistent development practices

---

*Last updated: 2025-10-04*
*Remember: Professional development requires professional processes. Use these prompts religiously!*