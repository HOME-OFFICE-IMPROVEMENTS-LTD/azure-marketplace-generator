# Git Workflow Prompts & Templates

## 🚨 MANDATORY CHECKS BEFORE ANY GIT OPERATION

### Pre-Commit Checklist
```bash
# STOP! Before any git add/commit, verify:
□ Are you on the correct branch? (NOT main!)
□ Have you tested your changes locally?
□ Have you run ARM-TTK validation if templates changed?
□ Does your commit follow conventional commit format?
□ Have you updated documentation if needed?
```

### Branch Creation Prompt
```bash
# Creating a new feature branch:
# Template: git checkout -b feature/[issue-number]-[brief-description]
# Example: git checkout -b feature/123-event-grid-integration
git checkout develop
git pull origin develop
git checkout -b feature/[FILL-DESCRIPTION]
```

### Commit Message Template
```bash
# MANDATORY FORMAT:
# type(scope): description [closes #issue]
#
# Types: feat, fix, docs, style, refactor, test, chore
# Scope: template, cli, docs, deployment, marketplace
#
# Examples:
git commit -m "feat(template): add Customer Usage Attribution tracking [closes #123]"
git commit -m "fix(marketplace): resolve Partner Center validation errors [closes #456]"
git commit -m "docs(deployment): update ARM template documentation [closes #789]"
```

### Pull Request Creation Prompt
```bash
# 🚨 NEVER MERGE DIRECTLY TO MAIN! 
# Always create a Pull Request:

1. Push your feature branch:
   git push origin feature/your-branch-name

2. Create PR via GitHub UI targeting 'develop' branch

3. PR Title Template: "[Type] Brief description [closes #issue]"
   Example: "[Feature] Add Event Grid integration [closes #123]"

4. PR Description Template:
   ## Changes Made
   - [ ] Brief description of changes
   - [ ] ARM template modifications
   - [ ] Documentation updates
   
   ## Testing Done
   - [ ] Local testing completed
   - [ ] ARM-TTK validation passed
   - [ ] Marketplace validation passed
   
   ## Checklist
   - [ ] Code follows project standards
   - [ ] Documentation updated
   - [ ] No breaking changes
   - [ ] Ready for review
```

### Pre-Merge Validation
```bash
# Before merging any PR:
□ All CI/CD checks passed?
□ Code review completed and approved?
□ ARM-TTK validation successful?
□ Marketplace compatibility verified?
□ Documentation updated?
□ No merge conflicts?
```

### Emergency Hotfix Process
```bash
# For critical production fixes:
git checkout main
git pull origin main
git checkout -b hotfix/[issue-description]
# Make minimal fix
git commit -m "hotfix: [description] [closes #issue]"
git push origin hotfix/[issue-description]
# Create PR to main AND develop
```

## 🔄 Standard Workflow Reminder

1. **Always start from develop**: `git checkout develop && git pull origin develop`
2. **Create feature branch**: `git checkout -b feature/description`
3. **Make changes and test**: Local validation + ARM-TTK
4. **Commit with template**: Use conventional commit format
5. **Push and create PR**: Target develop branch
6. **Review and merge**: After approval and validation
7. **Clean up**: Delete feature branch after merge

## ⚠️ What NOT To Do

- ❌ Never commit directly to main branch
- ❌ Never merge without PR review
- ❌ Never push without testing
- ❌ Never use generic commit messages
- ❌ Never skip ARM-TTK validation
- ❌ Never merge failing CI/CD builds