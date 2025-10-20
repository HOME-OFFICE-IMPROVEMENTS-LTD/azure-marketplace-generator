# Repository Cleanup & Preparation Checklist

**Date**: October 20, 2025  
**Version**: 2.1.0-storage-baseline  
**Purpose**: Prepare repository for public release with storage-first focus

---

## 🎯 Cleanup Strategy

### **Philosophy: Storage is the Foundation**
- Storage is NOT just another category—it's the **platform foundation**
- Everything in Azure eventually needs storage (data, logs, artifacts, backups)
- A complete platform can be built on storage alone
- Other categories will come as plugins when ready

---

## 📋 Cleanup Tasks

### ✅ **1. Conda Environment** (COMPLETED)
- [x] Deactivate conda: `conda deactivate`
- [x] Disable auto-activation: `conda config --set auto_activate_base false`

### 🗑️ **2. Remove Legacy/Temp Files**

#### Directories to Archive/Remove:
- [ ] `temp/` → Archive to `.archive/temp-2024/`
- [ ] `temp-test/` → Delete (empty test directory)
- [ ] `test-output/` → Archive to `.archive/test-output/`
- [ ] `output/` → Clean old files, keep structure
- [ ] `templates/webapp/` → Move to `.archive/future-categories/webapp/`
- [ ] `templates/vm/` → Move to `.archive/future-categories/vm/`
- [ ] `templates/security/` → Move to `.archive/future-categories/security/`
- [ ] `packages/archive/` → Already archived, verify no duplicates

#### Files to Review:
- [ ] Root-level duplicate MD files (CLEANUP_PLAN.md, REPOSITORY_CLEANUP_COMPLETE.md, etc.)
- [ ] Old shell scripts (test-mcp-ecosystem.sh in root, deploy-secure-storage.sh)
- [ ] Legacy config files (branch-protection.json, develop-branch-protection.json)

---

### 📝 **3. Documentation Updates**

#### Root-Level Files to Update:
- [ ] **README.md** - Major rewrite for storage-first approach
- [ ] **ROADMAP.md** - Create new with phased strategy
- [ ] **QUICK_START.md** - Update for storage-only examples
- [ ] **DEVELOPMENT.md** - Add plugin architecture notes

#### Root-Level Files to Archive:
- [ ] `CLEANUP_PLAN.md` → `.archive/docs/`
- [ ] `REPOSITORY_CLEANUP_COMPLETE.md` → `.archive/docs/`
- [ ] `STRATEGIC_NEXT_STEPS.md` → Merge into ROADMAP.md, then archive
- [ ] `STREAMING_IMPLEMENTATION.md` → `.archive/docs/technical/`
- [ ] `TEST_HARNESS.md` → Move to `docs/testing/`
- [ ] `TEST_STATUS.md` → Move to `docs/testing/`
- [ ] `CLI_TEST_REPORT.md` → `.archive/docs/`

#### docs/ Directory:
- [ ] Review all 50+ MD files
- [ ] Archive outdated/superseded docs
- [ ] Keep only: ARCHITECTURE, API, TESTING, DEPLOYMENT guides
- [ ] Update remaining docs to reflect storage-first approach

---

### 📦 **4. Package.json Cleanup**

#### Scripts to Review/Remove:
```json
{
  "scripts": {
    // KEEP:
    "build": "...",
    "dev": "...",
    "test": "...",
    "lint": "...",
    
    // REVIEW:
    "test:arm-ttk": "...",        // Keep if used
    "streaming-demo": "...",       // Archive?
    "streaming-test": "...",       // Archive?
    "benchmark": "...",            // Keep for performance testing
    
    // REMOVE:
    // Any unused scripts
  }
}
```

#### Dependencies to Audit:
- [ ] Review all 54 production dependencies
- [ ] Identify unused packages (especially MCP-related if not core)
- [ ] Document which are essential vs. optional

---

### 🏗️ **5. Source Code Cleanup**

#### Files to Update:
- [ ] `src/cli/commands/create.ts` - Remove webapp/vm/security mentions
- [ ] `src/cli/commands/help.ts` - Update examples to storage-only
- [ ] `src/cli/index.ts` - Update welcome message

#### Templates to Keep:
- [x] `src/templates/storage/` - Core working templates
- [x] `templates/storage/` - Keep if different from src/templates

#### Templates to Archive:
- [ ] `templates/webapp/` → `.archive/future-categories/`
- [ ] `templates/vm/` → `.archive/future-categories/`
- [ ] `templates/security/` → `.archive/future-categories/`

---

### 📊 **6. Test Cleanup**

#### Tests to Keep:
- [x] All passing tests (10/10 suites)
- [x] Storage-specific tests
- [x] Core validation tests

#### Tests to Review:
- [ ] Remove tests for unimplemented categories (webapp, vm, etc.)
- [ ] Update test descriptions to reflect storage-first approach

---

## 📄 **7. New/Updated Files to Create**

### **ROADMAP.md** (New)
```markdown
# Azure Marketplace Generator - Roadmap

## 🎯 Vision: Storage-First Platform

Storage is the foundation of cloud infrastructure. This roadmap reflects our
philosophy that a complete platform can be built on storage alone, with other
categories added as mature plugins.

## Phase 1: Storage Foundation (CURRENT - v2.1.0)
- ✅ Storage account generation
- ✅ Blob container management
- ✅ Data Lake Gen2 support
- ✅ Marketplace-ready templates
- ✅ Validation & testing framework

## Phase 2: Core + Plugin Architecture (v3.0.0 - Next 2-3 weeks)
- [ ] Extract minimal core engine
- [ ] Design plugin interface
- [ ] Convert storage to reference plugin
- [ ] Plugin loader and registry
- [ ] Documentation for plugin developers

## Phase 3: Additional Categories (v3.1.0+ - Future)
- [ ] Compute plugin (VMs, Container Instances)
- [ ] WebApp plugin (App Service, Functions)
- [ ] Database plugin (SQL, Cosmos DB)
- [ ] Networking plugin (VNet, Load Balancer)
- [ ] Security plugin (Key Vault, Security Center)

Each category will be:
- ✅ Optional (install only what you need)
- ✅ Independently versioned
- ✅ Community-contributable
- ✅ Fully tested before release
```

### **README.md** (Major Update)
- Emphasize storage as foundation
- Remove mentions of unimplemented categories
- Add "Why Storage First?" section
- Update quick start to storage examples only
- Add link to ROADMAP.md for future categories

### **CONTRIBUTING.md** (Update)
- Add plugin development guidelines
- Explain storage-first philosophy
- Set expectations for new category contributions

---

## 🚨 **What NOT to Touch**

### Keep As-Is:
- ✅ `test-storage-output/` - Proof of working implementation
- ✅ `src/core/` - Core generation engine
- ✅ `src/cli/` - CLI framework (update content only)
- ✅ `dist/` - Built artifacts
- ✅ `node_modules/` - Dependencies
- ✅ All passing tests
- ✅ `package-lock.json` - Dependency lock
- ✅ `.github/` workflows
- ✅ Essential config files (tsconfig.json, jest.config.js, eslint.config.mjs)

---

## ✅ **Success Criteria**

After cleanup:
- [ ] No mention of unimplemented categories in user-facing docs
- [ ] README.md clearly states "storage-first" approach
- [ ] ROADMAP.md explains vision and timeline
- [ ] All temp/test directories archived
- [ ] Repository size reduced by >30%
- [ ] Documentation is clear and accurate
- [ ] All tests still passing
- [ ] No broken links in documentation

---

## 📦 **Archive Structure**

Create `.archive/` directory:
```
.archive/
├── temp-2024/
│   └── (contents of temp/)
├── test-output/
│   └── (old test outputs)
├── future-categories/
│   ├── webapp/
│   ├── vm/
│   └── security/
├── docs/
│   ├── outdated/
│   └── technical/
└── scripts/
    └── (unused scripts)
```

Add `.archive/` to `.gitignore` if not pushing to remote.

---

## 🎯 **Timeline**

- **Today**: Document cleanup plan, conda setup
- **Tomorrow**: Execute cleanup, update docs
- **Day 3**: Test, verify, commit changes
- **Day 4**: Review with fresh eyes, final adjustments
- **Day 5**: Ready for release

---

## 📝 **Notes**

- Take backups before deleting anything
- Test after each major change
- Document decisions in commit messages
- Keep this checklist updated as you progress

---

**Status**: DRAFT - Ready to Execute  
**Last Updated**: October 20, 2025
