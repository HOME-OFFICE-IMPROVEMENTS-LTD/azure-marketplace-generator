# 🛡️ PRODUCTION STANDARDS ENFORCEMENT

## ⚡ CRITICAL REQUIREMENTS (Must Fix Before Any Development)

### 📋 Repository Essentials

- [ ] **LICENSE** - Legal requirement for any repository
- [ ] **SECURITY.md** - Security vulnerability reporting process  
- [ ] **CODE_OF_CONDUCT.md** - Community interaction guidelines
- [ ] **CONTRIBUTING.md** - Development and contribution process

### 🔒 Security Standards

- [ ] **No hardcoded secrets** - Use Key Vault references only
- [ ] **No sensitive data in git** - Audit all files before commit
- [ ] **ARM-TTK security validation** - All templates must pass security tests
- [ ] **Dependency scanning** - Regular dependency vulnerability checks

### 📁 File Organization

- [ ] **Proper .gitignore** - Exclude all generated/temporary files
- [ ] **No test outputs in repo** - Clean test artifacts before commit
- [ ] **Consistent naming** - Follow kebab-case for files/folders
- [ ] **Documentation up to date** - README reflects current state

### 🔧 Development Standards

- [ ] **TypeScript strict mode** - No any types, proper error handling
- [ ] **Comprehensive testing** - Unit tests for all business logic
- [ ] **ARM-TTK validation** - 100% pass rate required
- [ ] **Clean commit messages** - Conventional commit format

## 🚨 ENFORCEMENT RULES

### Before ANY code changes

1. **Run security audit**: `npm audit fix`
2. **Validate ARM templates**: `azmp validate`  
3. **Check for secrets**: `git secrets --scan`
4. **Lint codebase**: `npm run lint`

### Before git commit

1. **Clean test outputs**: Remove all generated files
2. **Update documentation**: Reflect any changes made
3. **Run full validation**: Complete ARM-TTK + TypeScript checks
4. **Security review**: Manual check for any sensitive data

## ❌ AUTOMATIC REJECTION CRITERIA

- Any hardcoded secrets or credentials
- ARM templates failing security validation
- Missing required documentation files
- Test artifacts committed to git
- Dependency vulnerabilities above moderate

## 📊 STANDARDS COMPLIANCE CHECKLIST

Use this before ANY development work:

```bash
# Security Audit
npm audit --audit-level moderate
git secrets --scan

# Code Quality  
npm run lint
npm run test
tsc --noEmit

# ARM Template Validation
azmp validate packages/marketplace/**/*

# Documentation Check
ls -la LICENSE SECURITY.md CODE_OF_CONDUCT.md CONTRIBUTING.md
```

## 🎯 SENIOR ENGINEER RESPONSIBILITIES

- **Challenge unsafe practices** - No exceptions for convenience
- **Enforce standards consistently** - Production-level requirements always
- **Security-first mindset** - Assume repository will be public
- **Documentation quality** - Professional, comprehensive, current

**NO SHORTCUTS. NO EXCEPTIONS. PRODUCTION STANDARDS ALWAYS.**
