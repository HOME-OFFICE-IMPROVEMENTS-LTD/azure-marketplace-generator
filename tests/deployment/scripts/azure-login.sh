#!/bin/bash
################################################################################
# Azure Login Helper Script
# Authenticates with Azure using service principal credentials
################################################################################

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_DIR="$PROJECT_ROOT/tests/deployment"

# Load environment
ENV_FILE="$DEPLOYMENT_DIR/config/azure.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Environment file not found: $ENV_FILE"
    echo "Copy config/azure.env.template to config/azure.env and fill in your credentials"
    exit 1
fi

source "$ENV_FILE"

# Validate required variables
REQUIRED_VARS=(
    "AZURE_SUBSCRIPTION_ID"
    "AZURE_TENANT_ID"
    "AZURE_CLIENT_ID"
    "AZURE_CLIENT_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        echo "❌ Error: Required variable $var is not set in $ENV_FILE"
        exit 1
    fi
done

# Function: Login with service principal
azure_login() {
    echo "🔐 Authenticating with Azure..."
    
    az login \
        --service-principal \
        --username "$AZURE_CLIENT_ID" \
        --password "$AZURE_CLIENT_SECRET" \
        --tenant "$AZURE_TENANT_ID" \
        --output none
    
    echo "✅ Logged in to tenant: $AZURE_TENANT_ID"
    
    # Set subscription
    az account set --subscription "$AZURE_SUBSCRIPTION_ID"
    echo "✅ Using subscription: $AZURE_SUBSCRIPTION_ID"
}

# Function: Verify authentication
verify_auth() {
    echo "🔍 Verifying authentication..."
    
    # Get account info
    ACCOUNT_INFO=$(az account show --output json)
    
    local subscription_id=$(echo "$ACCOUNT_INFO" | jq -r '.id')
    local subscription_name=$(echo "$ACCOUNT_INFO" | jq -r '.name')
    local tenant_id=$(echo "$ACCOUNT_INFO" | jq -r '.tenantId')
    local user_name=$(echo "$ACCOUNT_INFO" | jq -r '.user.name')
    
    echo "📋 Account Information:"
    echo "   Subscription ID:   $subscription_id"
    echo "   Subscription Name: $subscription_name"
    echo "   Tenant ID:         $tenant_id"
    echo "   User/Principal:    $user_name"
    
    # Verify subscription matches
    if [ "$subscription_id" != "$AZURE_SUBSCRIPTION_ID" ]; then
        echo "⚠️  Warning: Current subscription ($subscription_id) doesn't match configured ($AZURE_SUBSCRIPTION_ID)"
        return 1
    fi
    
    # Test permissions by listing resource groups
    echo "🔍 Testing permissions..."
    if az group list --output none 2>/dev/null; then
        echo "✅ Can list resource groups - permissions OK"
    else
        echo "❌ Cannot list resource groups - check permissions"
        return 1
    fi
    
    return 0
}

# Function: Logout
azure_logout() {
    echo "👋 Logging out from Azure..."
    az logout --output none
    echo "✅ Logged out"
}

# Main
main() {
    local command="${1:-login}"
    
    case "$command" in
        login)
            azure_login
            ;;
        verify)
            verify_auth
            ;;
        logout)
            azure_logout
            ;;
        test)
            azure_login
            if verify_auth; then
                echo "✅ Authentication test successful"
                azure_logout
                exit 0
            else
                echo "❌ Authentication test failed"
                azure_logout
                exit 1
            fi
            ;;
        *)
            echo "Usage: $0 {login|verify|logout|test}"
            echo ""
            echo "Commands:"
            echo "  login   - Login with service principal"
            echo "  verify  - Verify current authentication"
            echo "  logout  - Logout from Azure"
            echo "  test    - Test authentication (login, verify, logout)"
            exit 1
            ;;
    esac
}

# Run if executed directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
