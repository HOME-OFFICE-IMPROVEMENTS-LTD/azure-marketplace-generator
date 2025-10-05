#!/bin/bash

# 🧪 Azure DevOps & Lighthouse Testing Utility for HOILTD
# Tests both Azure DevOps and Lighthouse Performance MCP servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Default test configuration
TEST_EMAIL="${1:-info@hoiltd.com}"
TEST_ORGANIZATION="${AZURE_DEVOPS_ORG_URL:-https://dev.azure.com/home-office-improvements-ltd}"
TEST_PROJECT="${AZURE_DEVOPS_PROJECT:-azure-marketplace-generator}"

echo -e "${BLUE}🧪 Azure DevOps & Lighthouse Testing for HOILTD${NC}"
echo -e "${BLUE}===================================================${NC}"
echo -e "${YELLOW}Testing for: ${TEST_EMAIL}${NC}"
echo -e "${YELLOW}Organization: ${TEST_ORGANIZATION}${NC}"
echo -e "${YELLOW}Project: ${TEST_PROJECT}${NC}"
echo ""

# Function to check environment variables
check_environment() {
    echo -e "${YELLOW}🔍 Checking environment variables...${NC}"
    
    local required_vars=(
        "AZURE_DEVOPS_ORG_URL"
        "AZURE_DEVOPS_PAT"
        "AZURE_DEVOPS_PROJECT"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
            echo -e "${RED}   ❌ Missing: $var${NC}"
        else
            echo -e "${GREEN}   ✅ Found: $var${NC}"
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Missing required environment variables${NC}"
        echo -e "${YELLOW}💡 Please set the following variables:${NC}"
        for var in "${missing_vars[@]}"; do
            echo -e "${BLUE}   export $var=<your-value>${NC}"
        done
        return 1
    fi
    
    echo -e "${GREEN}✅ All required environment variables are set${NC}"
    return 0
}

# Function to test Azure DevOps connectivity
test_azure_devops() {
    echo -e "${PURPLE}🏢 Testing Azure DevOps connectivity...${NC}"
    
    # Check if Azure DevOps extension is available
    if ! command -v az &> /dev/null; then
        echo -e "${RED}❌ Azure CLI not found${NC}"
        return 1
    fi
    
    # Test basic Azure DevOps operations
    echo -e "${BLUE}   Testing Azure DevOps organization access...${NC}"
    
    # Extract organization name from URL
    local org_name
    org_name=$(echo "$AZURE_DEVOPS_ORG_URL" | sed 's|https://dev.azure.com/||')
    
    # Test Azure DevOps API access using curl (more reliable than az devops commands)
    local response
    response=$(curl -s -H "Authorization: Basic $(echo -n ":$AZURE_DEVOPS_PAT" | base64)" \
        "$AZURE_DEVOPS_ORG_URL/_apis/projects?api-version=7.1" 2>/dev/null || echo "error")
    
    if [[ "$response" == "error" ]] || [[ "$response" == *"error"* ]]; then
        echo -e "${RED}   ❌ Azure DevOps API access failed${NC}"
        echo -e "${YELLOW}   💡 Check your PAT token and organization URL${NC}"
        return 1
    fi
    
    echo -e "${GREEN}   ✅ Azure DevOps API access successful${NC}"
    
    # Test project access
    echo -e "${BLUE}   Testing project '${TEST_PROJECT}' access...${NC}"
    
    local project_response
    project_response=$(curl -s -H "Authorization: Basic $(echo -n ":$AZURE_DEVOPS_PAT" | base64)" \
        "$AZURE_DEVOPS_ORG_URL/_apis/projects/$TEST_PROJECT?api-version=7.1" 2>/dev/null || echo "error")
    
    if [[ "$project_response" == "error" ]] || [[ "$project_response" == *"TF400813"* ]]; then
        echo -e "${YELLOW}   ⚠️  Project '${TEST_PROJECT}' not found or no access${NC}"
        echo -e "${BLUE}   📋 Available projects:${NC}"
        
        # List available projects
        local projects
        projects=$(echo "$response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for project in data.get('value', []):
        print(f'      • {project[\"name\"]}')
except:
    print('      Could not parse projects list')
" 2>/dev/null || echo "      Could not retrieve projects")
        
        echo -e "${projects}"
    else
        echo -e "${GREEN}   ✅ Project access successful${NC}"
    fi
    
    echo -e "${GREEN}✅ Azure DevOps testing completed${NC}"
}

# Function to test Lighthouse Performance capabilities
test_lighthouse() {
    echo -e "${PURPLE}🌟 Testing Lighthouse Performance capabilities...${NC}"
    
    # Check if Node.js and npm are available
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found${NC}"
        return 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm not found${NC}"
        return 1
    fi
    
    echo -e "${GREEN}   ✅ Node.js runtime available${NC}"
    
    # Test if Lighthouse CLI is available globally or can be installed
    echo -e "${BLUE}   Testing Lighthouse CLI availability...${NC}"
    
    if command -v lighthouse &> /dev/null; then
        echo -e "${GREEN}   ✅ Lighthouse CLI already installed${NC}"
        local lighthouse_version
        lighthouse_version=$(lighthouse --version 2>/dev/null || echo "unknown")
        echo -e "${BLUE}   Version: ${lighthouse_version}${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Lighthouse CLI not installed globally${NC}"
        echo -e "${BLUE}   💡 Can be installed with: npm install -g lighthouse${NC}"
    fi
    
    # Test basic performance audit capabilities
    echo -e "${BLUE}   Testing performance audit configuration...${NC}"
    
    # Create a temporary Lighthouse config for testing
    local temp_config=$(mktemp)
    cat > "$temp_config" << 'EOF'
{
  "extends": "lighthouse:default",
  "settings": {
    "throttlingMethod": "simulate",
    "onlyCategories": ["performance", "accessibility", "best-practices", "seo"],
    "emulatedFormFactor": "desktop",
    "output": ["json", "html"]
  }
}
EOF
    
    echo -e "${GREEN}   ✅ Lighthouse configuration prepared${NC}"
    
    # Test URL validation for HOILTD domains
    local test_urls=(
        "https://home-office-improvements.ltd"
        "https://docs.home-office-improvements.ltd"
        "https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD"
    )
    
    echo -e "${BLUE}   Testing URL accessibility for performance auditing...${NC}"
    
    for url in "${test_urls[@]}"; do
        if curl -s --head --request GET "$url" | grep "200 OK" > /dev/null 2>&1; then
            echo -e "${GREEN}     ✅ $url - Accessible${NC}"
        else
            echo -e "${YELLOW}     ⚠️  $url - Not accessible or slow${NC}"
        fi
    done
    
    # Cleanup
    rm -f "$temp_config"
    
    echo -e "${GREEN}✅ Lighthouse performance testing preparation completed${NC}"
}

# Function to create test work item in Azure DevOps
create_test_work_item() {
    echo -e "${PURPLE}📝 Creating test work item in Azure DevOps...${NC}"
    
    local work_item_data=$(cat << EOF
{
  "op": "add",
  "path": "/fields/System.Title",
  "value": "MCP Testing: Authentication validation for ${TEST_EMAIL}"
},
{
  "op": "add", 
  "path": "/fields/System.Description",
  "value": "Testing Azure DevOps and Lighthouse integration for HOILTD MCP servers. Created automatically for ${TEST_EMAIL} validation."
},
{
  "op": "add",
  "path": "/fields/System.Tags",
  "value": "mcp-testing; authentication; ${TEST_EMAIL}"
}
EOF
)
    
    local response
    response=$(curl -s -X POST \
        -H "Content-Type: application/json-patch+json" \
        -H "Authorization: Basic $(echo -n ":$AZURE_DEVOPS_PAT" | base64)" \
        -d "[$work_item_data]" \
        "$AZURE_DEVOPS_ORG_URL/$TEST_PROJECT/_apis/wit/workitems/\$Task?api-version=7.1" 2>/dev/null || echo "error")
    
    if [[ "$response" == "error" ]] || [[ "$response" == *"error"* ]]; then
        echo -e "${YELLOW}   ⚠️  Could not create test work item (may require different permissions)${NC}"
        return 1
    else
        local work_item_id
        work_item_id=$(echo "$response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('id', 'unknown'))
except:
    print('unknown')
" 2>/dev/null || echo "unknown")
        
        echo -e "${GREEN}   ✅ Test work item created with ID: ${work_item_id}${NC}"
        echo -e "${BLUE}   🔗 URL: $AZURE_DEVOPS_ORG_URL/$TEST_PROJECT/_workitems/edit/${work_item_id}${NC}"
    fi
}

# Function to run performance audit on HOILTD site
run_lighthouse_audit() {
    echo -e "${PURPLE}⚡ Running Lighthouse performance audit...${NC}"
    
    # Test URL for HOILTD
    local test_url="https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD"
    
    echo -e "${BLUE}   Auditing: ${test_url}${NC}"
    
    # Create temporary directory for results
    local temp_dir=$(mktemp -d)
    
    # Run simplified performance test using curl and basic checks
    echo -e "${BLUE}   Testing basic performance metrics...${NC}"
    
    local start_time=$(date +%s%3N)
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$test_url" || echo "000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    if [[ "$response_code" == "200" ]]; then
        echo -e "${GREEN}     ✅ HTTP Status: ${response_code}${NC}"
        echo -e "${GREEN}     ✅ Response Time: ${response_time}ms${NC}"
        
        if [[ $response_time -lt 1000 ]]; then
            echo -e "${GREEN}     ✅ Performance: Excellent (< 1s)${NC}"
        elif [[ $response_time -lt 3000 ]]; then
            echo -e "${YELLOW}     ⚠️  Performance: Good (1-3s)${NC}"
        else
            echo -e "${RED}     ❌ Performance: Needs improvement (> 3s)${NC}"
        fi
    else
        echo -e "${RED}     ❌ HTTP Status: ${response_code}${NC}"
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
    
    echo -e "${GREEN}✅ Basic performance audit completed${NC}"
}

# Function to show summary and recommendations
show_summary() {
    echo -e "${BLUE}📊 Testing Summary for ${TEST_EMAIL}${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${GREEN}✅ Completed Tests:${NC}"
    echo -e "   • Environment variable validation"
    echo -e "   • Azure DevOps connectivity"
    echo -e "   • Lighthouse performance preparation"
    echo -e "   • Basic performance metrics"
    echo ""
    echo -e "${YELLOW}💡 Next Steps:${NC}"
    echo -e "   1. Verify Azure DevOps PAT token has required permissions"
    echo -e "   2. Install Lighthouse CLI globally: npm install -g lighthouse"
    echo -e "   3. Configure MCP servers with tested credentials"
    echo -e "   4. Run full Lighthouse audits on production sites"
    echo ""
    echo -e "${BLUE}🔗 Useful Links:${NC}"
    echo -e "   • Azure DevOps: $AZURE_DEVOPS_ORG_URL"
    echo -e "   • Project: $AZURE_DEVOPS_ORG_URL/$TEST_PROJECT"
    echo -e "   • Lighthouse Documentation: https://lighthouse-ci.com/"
}

# Main execution
main() {
    case "${1:-all}" in
        "env"|"environment")
            check_environment
            ;;
        "devops"|"azure-devops")
            check_environment && test_azure_devops
            ;;
        "lighthouse"|"performance")
            test_lighthouse && run_lighthouse_audit
            ;;
        "workitem"|"work-item")
            check_environment && create_test_work_item
            ;;
        "all"|"")
            echo -e "${BLUE}🚀 Running comprehensive testing suite...${NC}"
            echo ""
            check_environment && \
            test_azure_devops && \
            test_lighthouse && \
            run_lighthouse_audit && \
            create_test_work_item && \
            show_summary
            ;;
        "help"|"-h"|"--help")
            echo -e "${BLUE}🎯 DevOps & Lighthouse Testing Usage:${NC}"
            echo ""
            echo -e "  $0 [email]              - Run all tests for specified email (default: info@hoiltd.com)"
            echo -e "  $0 env                  - Check environment variables only"
            echo -e "  $0 devops               - Test Azure DevOps connectivity"
            echo -e "  $0 lighthouse           - Test Lighthouse performance capabilities"
            echo -e "  $0 workitem             - Create test work item in Azure DevOps"
            echo -e "  $0 all                  - Run complete testing suite"
            echo -e "  $0 help                 - Show this help message"
            echo ""
            echo -e "${YELLOW}💡 Examples:${NC}"
            echo -e "  $0 msalsouri@company.com  # Test for specific email"
            echo -e "  $0 devops                 # Test DevOps only"
            echo -e "  $0 lighthouse             # Test performance only"
            ;;
        *)
            # Treat unknown argument as email address
            if [[ "$1" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
                TEST_EMAIL="$1"
                echo -e "${YELLOW}🎯 Testing for email: ${TEST_EMAIL}${NC}"
                echo ""
                check_environment && \
                test_azure_devops && \
                test_lighthouse && \
                run_lighthouse_audit && \
                create_test_work_item && \
                show_summary
            else
                echo -e "${RED}❌ Unknown command: $1${NC}"
                echo -e "${BLUE}💡 Use '$0 help' for usage information${NC}"
                exit 1
            fi
            ;;
    esac
}

# Execute main function with all arguments
main "$@"