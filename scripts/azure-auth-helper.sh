#!/bin/bash

# 🔐 Azure Authentication Helper for HOME-OFFICE-IMPROVEMENTS-LTD
# Resolves common Azure CLI authentication issues including MFA and cached credentials

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HOILTD_TENANT_ID="473c2116-bcd0-4936-8d3b-dea0f76371a5"
PERSONAL_TENANT_ID="f9f893f9-2197-4e11-84e7-c848fa241788"
DEFAULT_SUBSCRIPTION_ID="1001490f-c77c-403e-be9e-97eac578d1d6"

echo -e "${BLUE}🚀 Azure Authentication Helper for HOILTD${NC}"
echo -e "${BLUE}================================================${NC}"

# Function to check if already authenticated
check_current_auth() {
    echo -e "${YELLOW}🔍 Checking current authentication status...${NC}"
    
    if az account show &>/dev/null; then
        echo -e "${GREEN}✅ Currently authenticated with Azure CLI${NC}"
        
        CURRENT_USER=$(az account show --query user.name -o tsv 2>/dev/null || echo "Unknown")
        CURRENT_TENANT=$(az account show --query tenantId -o tsv 2>/dev/null || echo "Unknown")
        CURRENT_SUBSCRIPTION=$(az account show --query name -o tsv 2>/dev/null || echo "Unknown")
        
        echo -e "${BLUE}   User: ${CURRENT_USER}${NC}"
        echo -e "${BLUE}   Tenant: ${CURRENT_TENANT}${NC}"
        echo -e "${BLUE}   Subscription: ${CURRENT_SUBSCRIPTION}${NC}"
        
        return 0
    else
        echo -e "${RED}❌ Not currently authenticated with Azure CLI${NC}"
        return 1
    fi
}

# Function to clear cached credentials
clear_cached_credentials() {
    echo -e "${YELLOW}🧹 Clearing cached Azure CLI credentials...${NC}"
    
    # Clear all cached accounts
    az account clear &>/dev/null || true
    
    # Clear Azure CLI cache
    rm -rf ~/.azure/accessTokens.json &>/dev/null || true
    rm -rf ~/.azure/azureProfile.json &>/dev/null || true
    
    echo -e "${GREEN}✅ Cached credentials cleared${NC}"
}

# Function to perform service principal login (non-interactive)
service_principal_login() {
    echo -e "${YELLOW}🔑 Attempting service principal authentication...${NC}"
    
    if [[ -z "$AZURE_CLIENT_ID" || -z "$AZURE_CLIENT_SECRET" || -z "$AZURE_TENANT_ID" ]]; then
        echo -e "${RED}❌ Service principal credentials not found in environment${NC}"
        echo -e "${BLUE}   Required: AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID${NC}"
        return 1
    fi
    
    az login --service-principal \
        --username "$AZURE_CLIENT_ID" \
        --password "$AZURE_CLIENT_SECRET" \
        --tenant "$AZURE_TENANT_ID" \
        --output table
    
    echo -e "${GREEN}✅ Service principal authentication successful${NC}"
}

# Function to perform device code login (avoids MFA browser issues)
device_code_login() {
    echo -e "${YELLOW}📱 Using device code authentication to avoid MFA browser issues...${NC}"
    
    # Check network connectivity first
    if ! ping -c 1 login.microsoftonline.com &>/dev/null; then
        echo -e "${RED}❌ Network connectivity issue detected${NC}"
        echo -e "${BLUE}💡 This might be due to:${NC}"
        echo -e "${BLUE}   • Firewall or proxy restrictions${NC}"
        echo -e "${BLUE}   • VPN connection issues${NC}"
        echo -e "${BLUE}   • Corporate network policies${NC}"
        echo -e "${BLUE}   • Internet connectivity problems${NC}"
        echo -e ""
        echo -e "${YELLOW}🔧 Suggested solutions:${NC}"
        echo -e "${BLUE}   1. Check your internet connection${NC}"
        echo -e "${BLUE}   2. Verify VPN settings if using corporate network${NC}"
        echo -e "${BLUE}   3. Contact IT if behind corporate firewall${NC}"
        echo -e "${BLUE}   4. Try from a different network if possible${NC}"
        return 1
    fi
    
    # Use device code flow which often works better with MFA
    echo -e "${BLUE}💡 Follow the instructions displayed to complete authentication${NC}"
    echo -e "${BLUE}💡 This method bypasses browser-based MFA issues${NC}"
    
    if az login --use-device-code --tenant "$HOILTD_TENANT_ID"; then
        echo -e "${GREEN}✅ Device code authentication completed${NC}"
    else
        echo -e "${RED}❌ Device code authentication failed${NC}"
        echo -e "${BLUE}💡 Common solutions:${NC}"
        echo -e "${BLUE}   • Ensure you selected the correct tenant: HOILTD DEV${NC}"
        echo -e "${BLUE}   • Complete MFA verification on your mobile device${NC}"
        echo -e "${BLUE}   • Contact your administrator if MFA is not working${NC}"
        echo -e "${BLUE}   • Try the manual browser login: az login --tenant $HOILTD_TENANT_ID${NC}"
        return 1
    fi
}

# Function to select correct tenant and subscription
select_hoiltd_context() {
    echo -e "${YELLOW}🎯 Setting HOILTD context...${NC}"
    
    # Check if we have multiple tenants/subscriptions available
    AVAILABLE_SUBSCRIPTIONS=$(az account list --query "[].{Name:name, Id:id, Tenant:tenantId}" -o table 2>/dev/null || echo "")
    
    if [[ -z "$AVAILABLE_SUBSCRIPTIONS" ]]; then
        echo -e "${RED}❌ No subscriptions available or authentication required${NC}"
        echo -e "${BLUE}💡 Please authenticate first using: $0 fix-mfa${NC}"
        return 1
    fi
    
    # Display available subscriptions for user reference
    echo -e "${BLUE}📋 Available subscriptions:${NC}"
    echo "$AVAILABLE_SUBSCRIPTIONS"
    echo -e ""
    
    # Set the correct subscription
    if az account set --subscription "$DEFAULT_SUBSCRIPTION_ID"; then
        echo -e "${GREEN}✅ Set to Microsoft Partner Network subscription${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not set default subscription automatically${NC}"
        echo -e "${BLUE}💡 Please manually select subscription:${NC}"
        echo -e "${BLUE}   az account set --subscription \"$DEFAULT_SUBSCRIPTION_ID\"${NC}"
        echo -e "${BLUE}   Or select interactively: az account set --subscription <name>${NC}"
        return 1
    fi
    
    # Verify the context
    echo -e "${BLUE}🔍 Current context:${NC}"
    az account show --output table
}

# Function to test Azure connectivity
test_azure_connectivity() {
    echo -e "${YELLOW}🧪 Testing Azure connectivity...${NC}"
    
    # Test basic Azure operations
    echo -e "${BLUE}   Testing resource group access...${NC}"
    if az group list --output table --query "[0:2]" &>/dev/null; then
        echo -e "${GREEN}   ✅ Resource group access: OK${NC}"
    else
        echo -e "${RED}   ❌ Resource group access: FAILED${NC}"
        return 1
    fi
    
    # Test marketplace access
    echo -e "${BLUE}   Testing marketplace access...${NC}"
    if az vm image list --output table --all --query "[0:2]" &>/dev/null; then
        echo -e "${GREEN}   ✅ Marketplace access: OK${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Marketplace access: Limited${NC}"
    fi
    
    echo -e "${GREEN}✅ Azure connectivity test completed${NC}"
}

# Main execution flow
main() {
    case "${1:-check}" in
        "check")
            check_current_auth
            ;;
        "clear")
            clear_cached_credentials
            echo -e "${BLUE}💡 Run 'az login' to authenticate again${NC}"
            ;;
        "service-principal"|"sp")
            service_principal_login
            select_hoiltd_context
            test_azure_connectivity
            ;;
        "device-code"|"device")
            device_code_login
            select_hoiltd_context
            test_azure_connectivity
            ;;
        "fix-mfa"|"mfa")
            echo -e "${YELLOW}🔧 Fixing MFA authentication issues...${NC}"
            echo -e "${BLUE}📖 This will:${NC}"
            echo -e "${BLUE}   1. Clear any cached credentials that might conflict${NC}"
            echo -e "${BLUE}   2. Use device code flow to bypass browser MFA issues${NC}"
            echo -e "${BLUE}   3. Set the correct HOILTD tenant and subscription${NC}"
            echo -e "${BLUE}   4. Test connectivity to ensure everything works${NC}"
            echo -e ""
            
            clear_cached_credentials
            if device_code_login; then
                if select_hoiltd_context; then
                    test_azure_connectivity
                    echo -e "${GREEN}🎉 MFA authentication fix completed successfully!${NC}"
                    echo -e "${BLUE}💡 You should now be able to use Azure CLI commands${NC}"
                else
                    echo -e "${YELLOW}⚠️  Authentication successful but context setup had issues${NC}"
                    echo -e "${BLUE}💡 You may need to manually select the correct subscription${NC}"
                fi
            else
                echo -e "${RED}❌ MFA authentication fix failed${NC}"
                echo -e "${BLUE}💡 Additional troubleshooting options:${NC}"
                echo -e "${BLUE}   • Try manual browser login: az login${NC}"
                echo -e "${BLUE}   • Contact your Azure administrator${NC}"
                echo -e "${BLUE}   • Check if your account has the required permissions${NC}"
                exit 1
            fi
            ;;
        "full-reset"|"reset")
            echo -e "${YELLOW}🔄 Performing full authentication reset...${NC}"
            clear_cached_credentials
            if [[ -n "$AZURE_CLIENT_ID" && -n "$AZURE_CLIENT_SECRET" ]]; then
                service_principal_login
            else
                device_code_login
            fi
            select_hoiltd_context
            test_azure_connectivity
            ;;
        "test")
            if check_current_auth; then
                test_azure_connectivity
            else
                echo -e "${RED}❌ Please authenticate first using: $0 fix-mfa${NC}"
                exit 1
            fi
            ;;
        "help"|"-h"|"--help")
            echo -e "${BLUE}🎯 Azure Authentication Helper Usage:${NC}"
            echo -e ""
            echo -e "  $0 check           - Check current authentication status"
            echo -e "  $0 clear           - Clear cached credentials"
            echo -e "  $0 service-principal - Login using service principal (requires env vars)"
            echo -e "  $0 device-code     - Login using device code flow"
            echo -e "  $0 fix-mfa         - Fix MFA authentication issues (RECOMMENDED)"
            echo -e "  $0 full-reset      - Complete authentication reset"
            echo -e "  $0 test            - Test Azure connectivity"
            echo -e "  $0 help            - Show this help message"
            echo -e ""
            echo -e "${YELLOW}💡 For MFA issues, use: $0 fix-mfa${NC}"
            echo -e "${YELLOW}💡 For service principal: export AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID${NC}"
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $1${NC}"
            echo -e "${BLUE}💡 Use '$0 help' for usage information${NC}"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"