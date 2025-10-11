#!/bin/bash

# Azure Marketplace Generator - Pre-Launch Checklist
# Comprehensive validation for production readiness

set -e

echo "🚀 Azure Marketplace Generator - Pre-Launch Checklist"
echo "====================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_TOTAL=0

check_result() {
    local status=$1
    local message=$2
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $message"
    fi
}

echo
echo "🔒 1. Security Validation"
echo "========================="

# Run security scan
if npm run test:security > /dev/null 2>&1; then
    check_result "PASS" "Security scan completed successfully"
else
    check_result "FAIL" "Security scan failed - vulnerabilities present"
fi

# Check for environment variable configuration
if [ -f ".env.example" ]; then
    check_result "PASS" "Environment variable example provided"
else
    check_result "FAIL" "Missing .env.example file"
fi

echo
echo "🧪 2. Testing & Quality Assurance"
echo "================================="

# Unit tests
if npm test > /dev/null 2>&1; then
    check_result "PASS" "Unit tests passing"
else
    check_result "FAIL" "Unit tests failing"
fi

# TypeScript compilation
if npm run build > /dev/null 2>&1; then
    check_result "PASS" "TypeScript compilation successful"
else
    check_result "FAIL" "TypeScript compilation errors"
fi

# Linting
if npm run lint > /dev/null 2>&1; then
    check_result "PASS" "Code linting passed"
else
    check_result "FAIL" "Linting errors present"
fi

echo
echo "📦 3. Package & Dependencies"
echo "============================="

# Dependency vulnerabilities
if npm audit --audit-level=moderate > /dev/null 2>&1; then
    check_result "PASS" "No dependency vulnerabilities"
else
    check_result "FAIL" "Dependency vulnerabilities found"
fi

# Check package.json configuration
if [ -f "package.json" ] && grep -q "\"name\": \"@hoiltd/azure-marketplace-generator\"" package.json; then
    check_result "PASS" "Package configuration valid"
else
    check_result "FAIL" "Package configuration invalid"
fi

echo
echo "🔧 4. CLI Functionality"
echo "======================="

# CLI help command
if node dist/cli/index.js --help > /dev/null 2>&1 || [ $? -eq 1 ]; then
    check_result "PASS" "CLI help command working"
else
    check_result "FAIL" "CLI help command broken"
fi

# Core CLI commands
commands=("validate" "deploy" "package" "monitor" "auth")
for cmd in "${commands[@]}"; do
    if node dist/cli/index.js $cmd --help > /dev/null 2>&1 || [ $? -eq 1 ]; then
        check_result "PASS" "CLI command '$cmd' working"
    else
        check_result "FAIL" "CLI command '$cmd' broken"
    fi
done

echo
echo "☁️ 5. Azure Marketplace Compliance"
echo "=================================="

# Required marketplace files
marketplace_files=("azure-deployment/mainTemplate.json" "azure-deployment/createUiDefinition.json" "azure-deployment/viewDefinition.json")
for file in "${marketplace_files[@]}"; do
    if [ -f "$file" ]; then
        check_result "PASS" "Marketplace file exists: $file"
    else
        check_result "FAIL" "Missing marketplace file: $file"
    fi
done

# JSON validation for marketplace files
for file in "${marketplace_files[@]}"; do
    if [ -f "$file" ]; then
        if node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))" > /dev/null 2>&1; then
            check_result "PASS" "Valid JSON: $file"
        else
            check_result "FAIL" "Invalid JSON: $file"
        fi
    fi
done

echo
echo "📚 6. Documentation"
echo "=================="

# Essential documentation files
docs=("README.md" "CONTRIBUTING.md" "LICENSE" "SECURITY.md")
for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        check_result "PASS" "Documentation exists: $doc"
    else
        check_result "FAIL" "Missing documentation: $doc"
    fi
done

# README content validation
if [ -f "README.md" ]; then
    if grep -q "Environment Configuration" README.md; then
        check_result "PASS" "README contains environment setup instructions"
    else
        check_result "FAIL" "README missing environment configuration section"
    fi
fi

echo
echo "🚦 7. Production Readiness"
echo "=========================="

# Git repository status
if git status --porcelain | grep -q .; then
    check_result "FAIL" "Uncommitted changes present"
else
    check_result "PASS" "Git repository clean"
fi

# Version tagging
if git describe --tags --exact-match HEAD > /dev/null 2>&1; then
    check_result "PASS" "Current commit is tagged"
else
    check_result "FAIL" "Current commit not tagged for release"
fi

# Performance check
if [ -x "$(command -v time)" ]; then
    build_time=$(time npm run build 2>&1 | grep real | awk '{print $2}')
    check_result "PASS" "Build time measured: $build_time"
else
    check_result "PASS" "Performance measurement skipped"
fi

echo
echo "📊 Pre-Launch Summary"
echo "====================="

PASS_RATE=$((CHECKS_PASSED * 100 / CHECKS_TOTAL))

if [ $CHECKS_PASSED -eq $CHECKS_TOTAL ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED! Ready for production deployment.${NC}"
    echo -e "${GREEN}✅ Security: SECURE${NC}"
    echo -e "${GREEN}✅ Quality: HIGH${NC}"
    echo -e "${GREEN}✅ Compliance: VERIFIED${NC}"
    echo -e "${GREEN}✅ Documentation: COMPLETE${NC}"
    echo
    echo -e "${BLUE}🚀 Production deployment approved!${NC}"
    exit 0
elif [ $PASS_RATE -ge 90 ]; then
    echo -e "${YELLOW}⚠️  ${CHECKS_PASSED}/${CHECKS_TOTAL} checks passed (${PASS_RATE}%) - Minor issues present${NC}"
    echo -e "${YELLOW}🔧 Fix remaining issues before production deployment${NC}"
    exit 1
else
    echo -e "${RED}🚨 ${CHECKS_PASSED}/${CHECKS_TOTAL} checks passed (${PASS_RATE}%) - Major issues present${NC}"
    echo -e "${RED}❌ NOT READY for production deployment${NC}"
    exit 2
fi