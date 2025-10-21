# Force-Push Clean Repository Plan

## Current Situation

### Remote Repository (OLD - Bloated)
- **Size**: 1.28 MB
- **origin/develop**: `bce2b1f` - Contains 58,000+ lines
- **origin/main**: `f4dccfe` - v2.1.0 
- **Extra branches**: 4 dependabot PRs, old feature branches
- **Status**: Completely different from local version

### Local Repository (NEW - Clean)
- **develop**: `8b988b9` - Only ~2,900 lines (95% reduction)
- **storage-only**: Same as develop
- **main**: `f4dccfe` - Still old version
- **Status**: Production-ready v3.0.0

### The Divergence
```
Common ancestor: f4dccfe (v2.1.0)
├── Remote develop → bce2b1f (organize files) ❌ OLD
└── Local develop  → 8b988b9 (v3.0.0 clean) ✅ NEW
```

---

## 🚀 Force-Push Strategy

### Phase 1: Backup Storage-Only Branch
Push the clean branch as backup before modifying develop:

```bash
git push origin storage-only --force
```

**Result**: Remote will have clean code as backup

---

### Phase 2: Disable Branch Protection

**Option A - Using GitHub Web UI:**
1. Go to: https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/settings/branch_protection_rules
2. Find rule for `develop`
3. **Temporarily disable** or delete the rule
4. Proceed with force-push
5. Re-enable after completion

**Option B - Using gh CLI (if you have admin access):**
```bash
# This might require organization admin permissions
gh api repos/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/branches/develop/protection \
  --method DELETE
```

---

### Phase 3: Force-Push Develop

Once protection is disabled:

```bash
# Force-push clean develop to remote
git push origin develop --force

# Verify
git log origin/develop --oneline -5
```

**Expected Result:**
```
8b988b9 (HEAD -> develop, origin/develop, storage-only) feat: production-ready v3.0.0
13f70bf chore: clean up test artifacts and temporary files
ab45969 docs: Add comprehensive deployment strategy
e47d720 docs: Add comprehensive testing and release readiness
68fcd22 fix: Package command path validation
```

---

### Phase 4: Update Main Branch

```bash
# Switch to main
git checkout main

# Reset to match develop
git reset --hard develop

# Force-push main
git push origin main --force
```

---

### Phase 5: Re-Enable Branch Protection

Go back to GitHub settings and re-enable branch protection for `develop`.

---

### Phase 6: Clean Up Remote Branches

Delete old dependabot and feature branches:

```bash
# List all remote branches
git branch -r

# Delete old branches (one at a time or use gh CLI)
gh api repos/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/git/refs/heads/dependabot/github_actions/actions/setup-node-6 \
  --method DELETE

# Or delete via git
git push origin --delete dependabot/github_actions/actions/setup-node-6
git push origin --delete dependabot/npm_and_yarn/development-dependencies-4f592605d1
git push origin --delete dependabot/npm_and_yarn/inquirer-12.10.0
git push origin --delete dependabot/npm_and_yarn/production-dependencies-482cb5ac36
git push origin --delete feature/organize-root-files
```

---

## Alternative: Nuclear Option (Clean Slate)

If you prefer to start completely fresh:

### Option 1: Delete and Recreate Repository

1. **Backup locally** (you already have everything)
2. **Delete remote repo** on GitHub
3. **Create new repo** with same name
4. **Push clean version**:
   ```bash
   git remote set-url origin git@github.com:HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator.git
   git push origin develop --force
   git push origin main --force
   git push origin storage-only --force
   ```

### Option 2: Keep Repository, Force Everything

Just force-push without worrying about protection:

```bash
# Push all clean branches
git push origin develop --force
git push origin main --force  
git push origin storage-only --force

# If it fails due to protection, temporarily remove it via GitHub UI
```

---

## Recommended Execution Order

1. ✅ **Backup first**: Push `storage-only` branch
2. ⚠️ **Disable protection**: Via GitHub UI
3. 🚀 **Force-push**: Replace `develop` and `main`
4. 🔒 **Re-enable protection**: Via GitHub UI
5. 🧹 **Cleanup**: Delete old branches
6. 🎉 **Verify**: Check repository size reduction

---

## After Force-Push

### Expected Repository State
- **develop**: Clean v3.0.0 code (~2,900 lines)
- **main**: Clean v3.0.0 code (same as develop)
- **storage-only**: Backup of clean code
- **Size**: Should be much smaller (< 500 KB)

### Next Steps
1. ✅ Verify all branches updated
2. ✅ Run tests on GitHub Actions
3. ✅ Deploy to Azure for Phase 2 testing
4. ✅ Tag v3.0.0 on main after Azure validation

---

## Safety Notes

✅ **Safe to proceed because:**
- Local version is production-ready (78/78 tests passing)
- Manual testing completed successfully
- Documentation is comprehensive
- Old version is bloated and no longer needed
- You have local backup of everything
- v2.1.0 tag still exists as legacy reference

⚠️ **Things to remember:**
- Anyone with the old remote checked out will need to force-pull
- Old PRs/branches will be orphaned (but we're cleaning those up)
- This is essentially a "v3.0.0 clean slate" release

---

**Ready to execute? Start with Phase 1 (backup storage-only branch).**
