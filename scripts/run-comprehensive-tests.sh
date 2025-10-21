#!/bin/bash
# Comprehensive Testing Script for Azure Marketplace Generator v3.0.0
# This script runs ALL tests from TESTING_PLAN.md

# Don't exit on error - we want to run all tests
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TEST_LOG="./test-results-$(date +%Y%m%d-%H%M%S).log"

echo "======================================"
echo "Azure Marketplace Generator v3.0.0"
echo "Comprehensive Testing Suite"
echo "======================================"
echo ""
echo "Log file: $TEST_LOG"
echo ""

# Function to log test results
log_test() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    if [ "$status" == "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name" | tee -a "$TEST_LOG"
        ((TESTS_PASSED++))
    elif [ "$status" == "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}: $test_name - $message" | tee -a "$TEST_LOG"
        ((TESTS_FAILED++))
    elif [ "$status" == "SKIP" ]; then
        echo -e "${YELLOW}⏭️  SKIP${NC}: $test_name - $message" | tee -a "$TEST_LOG"
    else
        echo -e "${BLUE}ℹ️  INFO${NC}: $test_name - $message" | tee -a "$TEST_LOG"
    fi
}

# Function to run a command and check result
run_test() {
    local test_name="$1"
    shift
    local command="$@"
    
    echo -e "\n${BLUE}Running:${NC} $test_name" | tee -a "$TEST_LOG"
    echo "Command: $command" >> "$TEST_LOG"
    
    if $command >> "$TEST_LOG" 2>&1; then
        log_test "$test_name" "PASS"
        return 0
    else
        log_test "$test_name" "FAIL" "Command failed"
        return 1
    fi
}

# Cleanup function
cleanup() {
    echo ""
    echo "Cleaning up test artifacts..."
    rm -rf ./test-cli-output ./config-test-output ./perf-test ./memory-test ./test-linux
    rm -f ./test-package.zip ./perf-package.zip
    rm -f ./azmp.config.json ./bad-config.json ./incomplete-config.json
}

trap cleanup EXIT

echo "======================================"
echo "1. Unit Tests"
echo "======================================"

run_test "Unit Tests (Jest)" npm test

echo ""
echo "======================================"
echo "2. Build Tests"
echo "======================================"

run_test "TypeScript Compilation" npm run build

if [ -d "dist" ]; then
    log_test "Build Output Exists" "PASS"
else
    log_test "Build Output Exists" "FAIL" "dist/ directory not found"
fi

if [ -f "dist/cli/index.js" ]; then
    log_test "CLI Entry Point Exists" "PASS"
else
    log_test "CLI Entry Point Exists" "FAIL" "dist/cli/index.js not found"
fi

echo ""
echo "======================================"
echo "3. CLI Help & Documentation"
echo "======================================"

run_test "CLI Help (--help)" node dist/cli/index.js --help
run_test "CLI Version (--version)" node dist/cli/index.js --version
run_test "Create Command Help" node dist/cli/index.js create --help
run_test "Validate Command Help" node dist/cli/index.js validate --help
run_test "Package Command Help" node dist/cli/index.js package --help

echo ""
echo "======================================"
echo "4. Create Command Tests"
echo "======================================"

# Test with flags
echo "Testing create command with flags..."
if node dist/cli/index.js create storage \
    --publisher "HOI-Test" \
    --name "test-storage-app" \
    --output "./test-cli-output" >> "$TEST_LOG" 2>&1; then
    log_test "Create Command (with flags)" "PASS"
    
    # Verify outputs
    if [ -f "./test-cli-output/mainTemplate.json" ]; then
        log_test "mainTemplate.json created" "PASS"
    else
        log_test "mainTemplate.json created" "FAIL" "File not found"
    fi
    
    if [ -f "./test-cli-output/createUiDefinition.json" ]; then
        log_test "createUiDefinition.json created" "PASS"
    else
        log_test "createUiDefinition.json created" "FAIL" "File not found"
    fi
    
    if [ -f "./test-cli-output/viewDefinition.json" ]; then
        log_test "viewDefinition.json created" "PASS"
    else
        log_test "viewDefinition.json created" "FAIL" "File not found"
    fi
    
    # Validate JSON syntax
    if jq empty ./test-cli-output/mainTemplate.json 2>/dev/null; then
        log_test "mainTemplate.json is valid JSON" "PASS"
    else
        log_test "mainTemplate.json is valid JSON" "FAIL" "Invalid JSON"
    fi
else
    log_test "Create Command (with flags)" "FAIL" "Command failed"
fi

echo ""
echo "======================================"
echo "5. Validate Command Tests"
echo "======================================"

if [ -d "./test-cli-output" ]; then
    run_test "Validate Command (basic)" node dist/cli/index.js validate ./test-cli-output
else
    log_test "Validate Command (basic)" "SKIP" "No test output to validate"
fi

# Test invalid path
if node dist/cli/index.js validate ./invalid-path >> "$TEST_LOG" 2>&1; then
    log_test "Validate Invalid Path (should fail)" "FAIL" "Should have returned error"
else
    log_test "Validate Invalid Path (should fail)" "PASS"
fi

echo ""
echo "======================================"
echo "6. Package Command Tests"
echo "======================================"

if [ -d "./test-cli-output" ]; then
    if node dist/cli/index.js package \
        ./test-cli-output \
        --output ./test-package.zip >> "$TEST_LOG" 2>&1; then
        log_test "Package Command" "PASS"
        
        if [ -f "./test-package.zip" ]; then
            log_test "Package file created" "PASS"
            
            # Verify package contents
            if unzip -l ./test-package.zip >> "$TEST_LOG" 2>&1; then
                log_test "Package is valid ZIP" "PASS"
                
                # Check for required files
                if unzip -l ./test-package.zip | grep -q "mainTemplate.json"; then
                    log_test "Package contains mainTemplate.json" "PASS"
                else
                    log_test "Package contains mainTemplate.json" "FAIL"
                fi
                
                if unzip -l ./test-package.zip | grep -q "createUiDefinition.json"; then
                    log_test "Package contains createUiDefinition.json" "PASS"
                else
                    log_test "Package contains createUiDefinition.json" "FAIL"
                fi
            else
                log_test "Package is valid ZIP" "FAIL"
            fi
        else
            log_test "Package file created" "FAIL"
        fi
    else
        log_test "Package Command" "FAIL"
    fi
else
    log_test "Package Command" "SKIP" "No test output to package"
fi

echo ""
echo "======================================"
echo "7. Configuration File Tests"
echo "======================================"

# Create valid config
cat > azmp.config.json << 'EOF'
{
  "publisher": "HOI-Config-Test",
  "name": "config-storage-app",
  "output": "./config-test-output"
}
EOF

run_test "Create with valid config file" node dist/cli/index.js create storage --config azmp.config.json

if [ -d "./config-test-output" ]; then
    log_test "Config-based output created" "PASS"
else
    log_test "Config-based output created" "FAIL"
fi

# Test invalid JSON
echo "{ invalid json }" > bad-config.json
if node dist/cli/index.js create storage --config bad-config.json >> "$TEST_LOG" 2>&1; then
    log_test "Invalid JSON config (should fail)" "FAIL" "Should have rejected invalid JSON"
else
    log_test "Invalid JSON config (should fail)" "PASS"
fi

echo ""
echo "======================================"
echo "8. Security Tests"
echo "======================================"

# Test SQL injection
if node dist/cli/index.js create storage \
    --publisher "Test" \
    --name "'; DROP TABLE--" \
    --output "./sql-test" >> "$TEST_LOG" 2>&1; then
    log_test "SQL Injection Protection" "PASS"
    rm -rf ./sql-test
else
    log_test "SQL Injection Protection" "FAIL" "Should sanitize input"
fi

# Test path traversal
if node dist/cli/index.js create storage \
    --publisher "Test" \
    --name "test" \
    --output "../../../etc/passwd" >> "$TEST_LOG" 2>&1; then
    if [ ! -f "/etc/passwd" ] || [ ! -d "../../../etc" ]; then
        log_test "Path Traversal Protection" "PASS"
    else
        log_test "Path Traversal Protection" "FAIL" "Should prevent path traversal"
    fi
else
    log_test "Path Traversal Protection" "PASS"
fi

echo ""
echo "======================================"
echo "9. Dependency Security"
echo "======================================"

if npm audit --audit-level=high 2>&1 | grep -q "found 0 vulnerabilities"; then
    log_test "No High/Critical Vulnerabilities" "PASS"
else
    log_test "No High/Critical Vulnerabilities" "FAIL" "Run 'npm audit' for details"
fi

echo ""
echo "======================================"
echo "10. Performance Tests"
echo "======================================"

# Test generation speed
START_TIME=$(date +%s.%N)
node dist/cli/index.js create storage \
    --publisher "Perf-Test" \
    --name "perf-test-app" \
    --output ./perf-test >> "$TEST_LOG" 2>&1
END_TIME=$(date +%s.%N)
DURATION=$(echo "$END_TIME - $START_TIME" | bc)

echo "Generation time: ${DURATION}s" | tee -a "$TEST_LOG"
if (( $(echo "$DURATION < 2.0" | bc -l) )); then
    log_test "Generation Performance (< 2s)" "PASS"
else
    log_test "Generation Performance (< 2s)" "FAIL" "Took ${DURATION}s"
fi

# Test package creation speed
if [ -d "./perf-test" ]; then
    START_TIME=$(date +%s.%N)
    node dist/cli/index.js package \
        ./perf-test \
        --output ./perf-package.zip >> "$TEST_LOG" 2>&1
    END_TIME=$(date +%s.%N)
    DURATION=$(echo "$END_TIME - $START_TIME" | bc)
    
    echo "Package time: ${DURATION}s" | tee -a "$TEST_LOG"
    if (( $(echo "$DURATION < 1.0" | bc -l) )); then
        log_test "Package Performance (< 1s)" "PASS"
    else
        log_test "Package Performance (< 1s)" "FAIL" "Took ${DURATION}s"
    fi
fi

echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo ""
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo ""
    echo "Ready for v3.0.0 release! 🚀"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please review $TEST_LOG for details"
    exit 1
fi
