#!/bin/bash

# Comprehensive TypeScript fix script for Azure Marketplace Generator

echo "🔧 Fixing TypeScript compilation errors..."

# 1. Fix CLI commands where _options was changed but usage wasn't updated
echo "Fixing CLI command parameter references..."

# For files where the parameter should be 'options' not '_options'
sed -i 's/\.action(async ([^,]*, _options: any)/\.action(async (\1, options: any)/g' \
  src/cli/commands/deploy.ts \
  src/cli/commands/help.ts \
  src/cli/commands/insights.ts \
  src/cli/commands/monitor.ts \
  src/cli/commands/package.ts \
  src/cli/commands/promote.ts \
  src/cli/commands/status.ts

# 2. Fix error variable references in catch blocks
echo "Fixing error variable references..."

# Replace _error back to error in usage, but keep catch (_error)
files_with_error_refs=(
  "src/services/ai-analytics-service.ts"
  "src/services/auto-deployment-service.ts"
  "src/services/enterprise-monitoring-service.ts"
)

for file in "${files_with_error_refs[@]}"; do
  if [ -f "$file" ]; then
    # Fix error references in error messages but keep catch blocks as _error
    sed -i 's/: ${error}/: ${_error}/g' "$file"
    sed -i 's/(error)/(_error)/g' "$file"
    sed -i 's/error instanceof Error/(_error instanceof Error)/g' "$file"
    sed -i 's/error\.message/(_error as Error)\.message/g' "$file"
  fi
done

# 3. Fix specific variable naming issues
echo "Fixing specific variable naming issues..."

# Fix app variable usage in enterprise monitoring
if [ -f "src/services/enterprise-monitoring-service.ts" ]; then
  sed -i 's/(_app: any) => app\./_app => _app\./g' src/services/enterprise-monitoring-service.ts
  sed -i 's/(\\_app: any) =>/(_app: any) =>/g' src/services/enterprise-monitoring-service.ts
fi

# Fix optimizations variable in insights
if [ -f "src/cli/commands/insights.ts" ]; then
  sed -i 's/: any, optimizations: any)/: any, _optimizations: any)/g' src/cli/commands/insights.ts
  sed -i 's/if (optimizations\./if (_optimizations\./g' src/cli/commands/insights.ts
  sed -i 's/of optimizations)/of _optimizations)/g' src/cli/commands/insights.ts
fi

# 4. Fix function parameter naming for unused variables
echo "Fixing unused function parameter naming..."

# Add underscore prefix to unused parameters
sed -i 's/customMetrics: any/_customMetrics: any/g' src/services/enterprise-monitoring-service.ts
sed -i 's/appName: any/_appName: any/g' src/services/enterprise-monitoring-service.ts
sed -i 's/, app: any)/, _app: any)/g' src/cli/commands/monitor.ts

# 5. Remove unused imports
echo "Removing unused imports..."
if [ -f "src/services/ai-analytics-service.ts" ]; then
  sed -i '/const.*execAsync.*=/d' src/services/ai-analytics-service.ts
fi

echo "✅ TypeScript fixes applied. Running compilation check..."

# Test compilation
if npx tsc --noEmit --skipLibCheck; then
  echo "✅ TypeScript compilation successful!"
  exit 0
else
  echo "❌ Still have TypeScript errors. Manual review needed."
  exit 1
fi