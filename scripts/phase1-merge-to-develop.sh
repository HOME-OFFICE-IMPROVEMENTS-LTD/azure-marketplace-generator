#!/bin/bash
# Phase 1: Merge storage-only to develop
# Run this script to safely replace develop with storage-only

set -e

echo "════════════════════════════════════════════════════════"
echo "Phase 1: Merge storage-only → develop"
echo "════════════════════════════════════════════════════════"
echo ""

# Confirm current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "storage-only" ]; then
    echo "⚠️  Warning: You're not on storage-only branch"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted"
        exit 1
    fi
fi

echo ""
echo "Step 1: Backup current develop branch..."
git checkout develop
git tag -a v2.1.0-legacy -m "Backup before storage-only merge - $(date +%Y-%m-%d)"
echo "✅ Created backup tag: v2.1.0-legacy"

echo ""
echo "Step 2: Replace develop with storage-only..."
git reset --hard storage-only
echo "✅ Local develop updated"

echo ""
echo "Step 3: Push to remote..."
read -p "Push to origin/develop? This will FORCE PUSH. (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push --force origin develop
    git push origin v2.1.0-legacy
    echo "✅ Remote develop updated"
else
    echo "⏭️  Skipped remote push"
fi

echo ""
echo "Step 4: Verify..."
echo ""
echo "Last 5 commits on develop:"
git log --oneline -5
echo ""

echo "════════════════════════════════════════════════════════"
echo "✅ Phase 1 Complete!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Review the changes above"
echo "2. Run Phase 2: Real Azure deployment test"
echo "   → See DEPLOYMENT_STRATEGY.md for commands"
echo ""
