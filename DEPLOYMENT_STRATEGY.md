# Deployment Strategy v3.0.0

**Azure Marketplace Generator - Production Deployment Plan

---

## Current Branch Status

```
main              <- Production releases only
  ↑
develop           <- Integration branch (currently has bloat)
  ↑
storage-only      <- Clean, production-ready code ⭐ (YOU ARE HERE)
  ↑
feature/*         <- Feature branches (outdated)
```

---

## Your Questions Answered

### Q1: "If we have the working project on this branch, why would we need the other branches?"

**Answer**: You're absolutely right! Here's what each branch should be:

1. **`main`** - **Production releases only**
   - Always stable, always deployable
   - Only updated when you tag a release
   - This is what users/customers see

2. **`develop`** - **Active development branch**
   - Where you merge features before releasing
   - Should always be in a "releasable" state
   - Acts as staging for `main`

3. **Feature branches** - **Temporary**
   - `feature/azure-comprehensive-expansion` - Can be deleted
   - `feature/critical-storage-lifecycle-fix` - Can be deleted
   - `feature/repository-organization-monorepo` - Can be deleted
   - `backup/feature-repo-pre-rollback` - Can be deleted (backup only)

**Recommendation**: Delete all feature branches after merging `storage-only` → `develop` → `main`

---

### Q2: "Would the release be on the develop or main branch?"

**Answer**: **Releases ALWAYS happen on `main`**

Standard Git Flow:
```
storage-only (clean code)
    ↓
develop (merge here first, test)
    ↓
main (tag release here: v3.0.0)
```

**Why?**
- `main` = Production-ready, stable releases
- 
- `develop` = Integration and testing
- Users clone/download from `main`, not `develop`

---

## Recommended Deployment Plan

### Phase 1: Merge to develop (NOW)

```bash
# 1. Backup current develop (just in case)
git checkout develop
git tag -a v2.1.0-legacy -m "Backup before storage-only merge"
git push origin v2.1.0-legacy

# 2. Replace develop with storage-only
git reset --hard storage-only
git push --force origin develop

# 3. Verify
git log --oneline -5
```

**Result**: `develop` now has your clean code

---

### Phase 2: Real-World Testing (DO THIS)

Test the package with actual Azure deployment:

```bash
# 1. Generate templates
node dist/cli/index.js create storage \
  --publisher "HOI-Test-Production" \
  --name "prod-storage-test" \
  --output ./prod-test

# 2. Validate thoroughly
node dist/cli/index.js validate ./prod-test --arm-ttk

# 3. Package
node dist/cli/index.js package ./prod-test --output ./prod-test.zip

# 4. Deploy to Azure (REAL TEST)
az group create --name azmp-prod-test-rg --location eastus

az deployment group create \
  --resource-group azmp-prod-test-rg \
  --template-file ./prod-test/mainTemplate.json \
  --parameters \
    location=eastus \
    storageAccountName=azmptest$(date +%s | tail -c 6)

# 5. Verify resources created
az resource list --resource-group azmp-prod-test-rg --output table

# 6. Test UI Definition (optional)
# Upload to Partner Center sandbox and test the UI

# 7. Clean up
az group delete --name azmp-prod-test-rg --yes --no-wait
```

**Success Criteria:**

- ✅ Templates deploy without errors
- ✅ Storage account created correctly
- ✅ All resources configured as expected
- ✅ UI renders properly in Portal
- ✅ Validation passes in Partner Center

---

### Phase 3: Merge to main & Tag (AFTER TESTING)

```bash
# Only do this after successful Azure deployment test

# 1. Merge develop to main
git checkout main
git merge develop --ff-only
# or if you want to keep history clean:
git reset --hard develop

# 2. Push to main
git push --force origin main
# (--force is safe since you're the only developer)

# 3. Now tag the release
git tag -a v3.0.0 -m "Release v3.0.0: Production-ready storage AMA generator

- Clean codebase (95% size reduction)
- Production error handling
- Comprehensive logging
- Progress indicators
- Configuration file support
- All 78 tests passing
- ARM-TTK validation integrated
- Package command working perfectly"

# 4. Push the tag
git push origin v3.0.0

# 5. Create GitHub Release
# Go to: https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/releases/new
# Tag: v3.0.0
# Title: v3.0.0 - Production Storage Generator
# Upload: prod-test.zip as example
```

---

### Phase 4: Cleanup Branches (OPTIONAL)

```bash
# Delete old feature branches (local)
git branch -D feature/azure-comprehensive-expansion
git branch -D feature/critical-storage-lifecycle-fix
git branch -D feature/repository-organization-monorepo
git branch -D backup/feature-repo-pre-rollback

# Delete old feature branches (remote)
git push origin --delete feature/organize-root-files

# Keep storage-only for now (it's your working branch)
# You can delete it later after v3.0.0 is stable
```

---

## Branch Strategy Going Forward

### New Feature Development

```bash
# 1. Always start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/add-solution-template-support

# 3. Do your work, commit

# 4. Merge back to develop
git checkout develop
git merge feature/add-solution-template-support

# 5. Test on develop

# 6. When ready for release:
git checkout main
git merge develop
git tag -a v3.1.0 -m "Added solution template support"
git push origin main v3.1.0
```

---

## Proposed Workflow (TODAY)

### Step-by-Step Commands

```bash
# ═══════════════════════════════════════════════════
# STEP 1: BACKUP & MERGE TO DEVELOP
# ═══════════════════════════════════════════════════

# Backup old develop
git checkout develop
git tag -a v2.1.0-legacy -m "Backup before cleanup"
git push origin v2.1.0-legacy

# Replace with storage-only
git reset --hard storage-only
git push --force origin develop

# Verify
git log --oneline -3
echo "✅ Step 1 Complete: develop now has clean code"


# ═══════════════════════════════════════════════════
# STEP 2: REAL AZURE DEPLOYMENT TEST
# ═══════════════════════════════════════════════════

# Ensure you're on develop
git checkout develop

# Rebuild
npm run build

# Generate test package
node dist/cli/index.js create storage \
  --publisher "HOI-LTD" \
  --name "production-test-v3" \
  --output ./azure-prod-test

# Validate
node dist/cli/index.js validate ./azure-prod-test --arm-ttk

# Package
node dist/cli/index.js package ./azure-prod-test \
  --output ./azure-prod-test.zip

# Deploy to Azure
az group create \
  --name azmp-v3-test-rg \
  --location eastus

az deployment group create \
  --resource-group azmp-v3-test-rg \
  --template-file ./azure-prod-test/mainTemplate.json \
  --parameters location=eastus storageAccountName=azmpv3test$(date +%s | tail -c 6)

# Check results
az resource list \
  --resource-group azmp-v3-test-rg \
  --output table

# If successful:
echo "✅ Step 2 Complete: Real Azure deployment successful!"

# Clean up
az group delete --name azmp-v3-test-rg --yes --no-wait


# ═══════════════════════════════════════════════════
# STEP 3: MERGE TO MAIN (ONLY IF STEP 2 PASSED)
# ═══════════════════════════════════════════════════

git checkout main
git reset --hard develop
git push --force origin main

echo "✅ Step 3 Complete: main now matches develop"


# ═══════════════════════════════════════════════════
# STEP 4: TAG RELEASE (ONLY IF STEP 3 PASSED)
# ═══════════════════════════════════════════════════

git tag -a v3.0.0 -m "Release v3.0.0: Production-ready storage AMA generator"
git push origin v3.0.0

echo "✅ Step 4 Complete: v3.0.0 tagged and pushed"


# ═══════════════════════════════════════════════════
# STEP 5: CREATE GITHUB RELEASE
# ═══════════════════════════════════════════════════

# Manual step:
# 1. Go to: https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/releases/new
# 2. Select tag: v3.0.0
# 3. Title: v3.0.0 - Production-Ready Storage Generator
# 4. Description: Copy from RELEASE_READINESS.md
# 5. Attach: azure-prod-test.zip
# 6. Publish release

echo "✅ All Steps Complete! 🚀"
```

---

## Why This Approach?

### ✅ Advantages

1. **Safe**: Backup tags created before any force push
2. **Testable**: Real Azure deployment before tagging
3. **Clean**: Simple linear history on main
4. **Standard**: Follows Git Flow best practices
5. **Reversible**: Can always go back to backups

### ✅ Best Practices

- `main` = Always stable, always deployable
- `develop` = Integration testing
- Features merge to `develop` first
- Only tested code goes to `main`
- Tags only on `main`
- GitHub Releases only on `main`

---

## Emergency Rollback

If something goes wrong:

```bash
# Rollback develop
git checkout develop
git reset --hard v2.1.0-legacy
git push --force origin develop

# Rollback main (if you already pushed)
git checkout main
git reset --hard <previous-commit-sha>
git push --force origin main

# Remove bad tag (if created)
git tag -d v3.0.0
git push origin --delete v3.0.0
```

---

## Summary

### ✅ Your Plan (Recommended):

1. **NOW**: Merge `storage-only` → `develop` (replace)
2. **NEXT**: Real Azure deployment test
3. **THEN**: Merge `develop` → `main`
4. **FINALLY**: Tag v3.0.0 on `main` (only after successful test)

### ✅ Release Location:

- **Tags**: Always on `main` branch
- **GitHub Releases**: Always from `main` branch
- **Users**: Clone from `main` branch

### ✅ Branch Cleanup:

- Delete feature branches after merge
- Keep `storage-only` temporarily (can delete after v3.0.0 is stable)
- Keep `develop` and `main` permanently

---

## Testing Checklist Before v3.0.0

- [ ] Azure resource group created successfully
- [ ] ARM template deployed without errors
- [ ] Storage account created with correct settings
- [ ] UI Definition renders correctly (optional)
- [ ] All resources in expected state
- [ ] Clean deletion works
- [ ] No Azure errors or warnings
- [ ] Performance acceptable (< 5 min deployment)

Only proceed with tagging if ALL checks pass! ✅

---

**Date**: 2025-10-21  
**Status**: Ready for Phase 1 (Merge to develop)  
**Next**: Real Azure deployment testing
