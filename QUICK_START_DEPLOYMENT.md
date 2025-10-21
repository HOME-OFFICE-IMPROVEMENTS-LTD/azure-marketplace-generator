# Quick Start: Deploy to Production

## Your Approved Plan ✅

**Strategy**: Replace `develop` → Test with Azure → Merge to `main` → Tag v3.0.0

---

## Phase 1: Merge to develop (NOW)

```bash
./scripts/phase1-merge-to-develop.sh
```

**What it does:**
- ✅ Backs up current `develop` as `v2.1.0-legacy` tag
- ✅ Replaces `develop` with clean `storage-only` code
- ✅ Force pushes to origin (safe, you're the only dev)

**Result**: `develop` now has production-ready code

---

## Phase 2: Real Azure Deployment Test (NEXT)

```bash
./scripts/phase2-azure-deployment-test.sh
```

**What it does:**
- ✅ Builds and generates templates
- ✅ Validates with ARM-TTK
- ✅ Creates marketplace package
- ✅ **Deploys to real Azure subscription**
- ✅ Verifies resources created correctly
- ✅ Offers to clean up test resources

**Requirements:**
- Azure CLI installed: `az --version`
- Logged in: `az login`
- Active subscription

**Result**: Verified working deployment in Azure

---

## Phase 3: Merge to main & Tag (ONLY AFTER PHASE 2 SUCCESS)

```bash
# 1. Merge develop to main
git checkout main
git reset --hard develop
git push --force origin main

# 2. Tag the release
git tag -a v3.0.0 -m "Release v3.0.0: Production-ready storage AMA generator"
git push origin v3.0.0

# 3. Create GitHub Release
# Go to: https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/releases/new
# - Tag: v3.0.0
# - Title: v3.0.0 - Production Storage Generator  
# - Upload: azure-prod-test.zip
# - Description: Copy from RELEASE_READINESS.md
```

---

## Key Points

### Release Branch
**Releases are ALWAYS on `main`**, not `develop`:
- `main` = Production releases, stable, users clone from here
- `develop` = Active development, integration testing
- Tags = Always on `main` branch

### Why This Order?
1. **develop first** = Test integration before production
2. **Azure test** = Verify real deployment works
3. **main last** = Only merge to production after testing
4. **Tag after merge** = Tag the stable main branch

### Branch Cleanup (Later)
After v3.0.0 is stable, you can delete:
```bash
# Feature branches (outdated)
git branch -D feature/azure-comprehensive-expansion
git branch -D feature/critical-storage-lifecycle-fix
git branch -D feature/repository-organization-monorepo
git branch -D backup/feature-repo-pre-rollback

# Optional: delete storage-only (after stable)
git branch -D storage-only
```

**Keep forever:**
- `main` (production)
- `develop` (active development)

---

## Emergency Rollback

If something goes wrong:

```bash
# Rollback develop
git checkout develop
git reset --hard v2.1.0-legacy
git push --force origin develop

# Rollback main (if already pushed)
git checkout main  
git reset --hard <previous-sha>
git push --force origin main

# Remove bad tag
git tag -d v3.0.0
git push origin --delete v3.0.0
```

---

## Testing Checklist ✅

Before tagging v3.0.0, verify:

- [ ] Azure resource group created
- [ ] ARM template deployed successfully
- [ ] Storage account exists and configured correctly
- [ ] No deployment errors or warnings
- [ ] Resources can be deleted cleanly
- [ ] Package file valid (azure-prod-test.zip)
- [ ] All 78 unit tests still passing

---

## What You Said ✅

> "I would go with option 1, but hold with the tag and release until we test properly with maybe live Azure deployment"

**Perfect!** This plan does exactly that:
1. ✅ Option 1: Replace develop (not merge)
2. ✅ Hold tag: Tag only AFTER Azure test succeeds
3. ✅ Live deployment: Phase 2 deploys to real Azure
4. ✅ Release on main: Tags always on main branch

---

## Commands Summary

```bash
# Phase 1 (NOW)
./scripts/phase1-merge-to-develop.sh

# Phase 2 (NEXT - requires Azure)
./scripts/phase2-azure-deployment-test.sh

# Phase 3 (AFTER Azure test passes)
git checkout main && git reset --hard develop
git push --force origin main
git tag -a v3.0.0 -m "Release v3.0.0"
git push origin v3.0.0
```

---

**Status**: Ready for Phase 1  
**Date**: 2025-10-21  
**Next Action**: Run `./scripts/phase1-merge-to-develop.sh`
