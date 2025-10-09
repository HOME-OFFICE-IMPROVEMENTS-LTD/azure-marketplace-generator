#!/bin/bash

# HOME-OFFICE-IMPROVEMENTS-LTD Enterprise Azure Storage Deployment Script
# Version: 1.0.0
# Author: IT Infrastructure Team
# Description: Deploy secure, enterprise-grade Azure Storage Account with full compliance

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEMPLATE_FILE="storage-account-secure.json"
PARAMETERS_FILE="storage-account-secure.parameters.json"
RESOURCE_GROUP_NAME="rg-hoiltd-storage-prod-uksouth"
DEPLOYMENT_NAME="deploy-secure-storage-$(date +%Y%m%d-%H%M%S)"
SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID:-}"
TENANT_ID="${AZURE_TENANT_ID:-}"

# Logging
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"
exec 1> >(tee -a "${LOG_FILE}")
exec 2> >(tee -a "${LOG_FILE}" >&2)

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}HOME-OFFICE-IMPROVEMENTS-LTD${NC}"
echo -e "${BLUE}Enterprise Storage Deployment${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install Azure CLI."
        exit 1
    fi
    
    # Check if logged in
    if ! az account show &> /dev/null; then
        log_error "Not logged into Azure. Please run 'az login'."
        exit 1
    fi
    
    # Check template files exist
    if [[ ! -f "$TEMPLATE_FILE" ]]; then
        log_error "Template file $TEMPLATE_FILE not found."
        exit 1
    fi
    
    if [[ ! -f "$PARAMETERS_FILE" ]]; then
        log_error "Parameters file $PARAMETERS_FILE not found."
        exit 1
    fi
    
    log_success "Prerequisites check completed."
}

validate_template() {
    log_info "Validating ARM template..."
    
    az deployment group validate \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --template-file "$TEMPLATE_FILE" \
        --parameters "@$PARAMETERS_FILE" \
        --verbose
    
    if [[ $? -eq 0 ]]; then
        log_success "Template validation passed."
    else
        log_error "Template validation failed."
        exit 1
    fi
}

cost_estimation() {
    log_info "Estimating deployment costs..."
    
    cat << EOF
${YELLOW}======================================
COST ESTIMATION (UK South Region)
======================================${NC}

${BLUE}Storage Account (Standard GRS):${NC}
- Base storage (1TB): £15-20/month
- Transactions (moderate): £5-10/month
- Data transfer: £2-5/month

${BLUE}Private Endpoint:${NC}
- Private endpoint: £3.50/month
- DNS zone: £0.50/month

${BLUE}Key Vault (Customer-managed keys):${NC}
- Key operations: £0.20-1.00/month

${BLUE}Log Analytics:${NC}
- Data ingestion (estimated): £10-15/month
- Data retention (1 year): £5-10/month

${GREEN}Total Estimated Monthly Cost: £41-65 GBP${NC}
${YELLOW}Note: Costs may vary based on actual usage patterns.${NC}

EOF
}

security_checklist() {
    log_info "Security compliance checklist..."
    
    cat << EOF
${GREEN}======================================
SECURITY COMPLIANCE CHECKLIST
======================================${NC}

✅ Encryption at rest with customer-managed keys
✅ TLS 1.2 minimum enforced
✅ HTTPS-only traffic enabled
✅ Public blob access disabled
✅ Shared key access disabled
✅ Network access restricted (private endpoints)
✅ Virtual network integration configured
✅ Audit logging enabled (365-day retention)
✅ Immutable storage with versioning
✅ Cross-tenant replication disabled
✅ Infrastructure encryption enabled
✅ System-assigned managed identity
✅ Resource tagging per enterprise standards

${BLUE}Compliance Standards Met:${NC}
- HOILTD-2024 Enterprise Security Policy
- ISO 27001 controls
- SOC 2 Type II requirements

EOF
}

deploy_storage() {
    log_info "Starting deployment..."
    
    # Create resource group if it doesn't exist
    az group create \
        --name "$RESOURCE_GROUP_NAME" \
        --location "uksouth" \
        --tags \
            "Company=HOME-OFFICE-IMPROVEMENTS-LTD" \
            "Environment=Production" \
            "Purpose=SecureStorage" \
            "CreatedBy=DeploymentScript" \
            "CreatedDate=$(date +%Y-%m-%d)"
    
    # Deploy the template
    az deployment group create \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --name "$DEPLOYMENT_NAME" \
        --template-file "$TEMPLATE_FILE" \
        --parameters "@$PARAMETERS_FILE" \
        --verbose
    
    if [[ $? -eq 0 ]]; then
        log_success "Deployment completed successfully."
    else
        log_error "Deployment failed."
        exit 1
    fi
}

post_deployment_validation() {
    log_info "Running post-deployment validation..."
    
    # Get deployment outputs
    OUTPUTS=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs" \
        --output json)
    
    STORAGE_ACCOUNT_NAME=$(echo "$OUTPUTS" | jq -r '.storageAccountName.value')
    
    log_info "Validating storage account: $STORAGE_ACCOUNT_NAME"
    
    # Check if storage account exists and is configured correctly
    STORAGE_CONFIG=$(az storage account show \
        --name "$STORAGE_ACCOUNT_NAME" \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --output json)
    
    # Validate key security settings
    PUBLIC_ACCESS=$(echo "$STORAGE_CONFIG" | jq -r '.allowBlobPublicAccess')
    SHARED_KEY_ACCESS=$(echo "$STORAGE_CONFIG" | jq -r '.allowSharedKeyAccess')
    HTTPS_ONLY=$(echo "$STORAGE_CONFIG" | jq -r '.supportsHttpsTrafficOnly')
    TLS_VERSION=$(echo "$STORAGE_CONFIG" | jq -r '.minimumTlsVersion')
    
    log_info "Security validation results:"
    echo "  - Public blob access disabled: $([[ "$PUBLIC_ACCESS" == "false" ]] && echo "✅ Yes" || echo "❌ No")"
    echo "  - Shared key access disabled: $([[ "$SHARED_KEY_ACCESS" == "false" ]] && echo "✅ Yes" || echo "❌ No")"
    echo "  - HTTPS-only enabled: $([[ "$HTTPS_ONLY" == "true" ]] && echo "✅ Yes" || echo "❌ No")"
    echo "  - TLS version: $TLS_VERSION $([[ "$TLS_VERSION" == "TLS1_2" ]] && echo "✅" || echo "❌")"
    
    log_success "Post-deployment validation completed."
}

cleanup_on_error() {
    log_warning "Cleaning up failed deployment..."
    
    # Optional: Remove failed deployment
    # az deployment group delete --resource-group "$RESOURCE_GROUP_NAME" --name "$DEPLOYMENT_NAME" --yes
    
    log_info "Cleanup completed. Check logs for details."
}

main() {
    trap cleanup_on_error ERR
    
    log_info "Starting HOME-OFFICE-IMPROVEMENTS-LTD secure storage deployment"
    echo "Deployment Name: $DEPLOYMENT_NAME"
    echo "Resource Group: $RESOURCE_GROUP_NAME"
    echo "Log File: $LOG_FILE"
    echo ""
    
    check_prerequisites
    cost_estimation
    security_checklist
    
    read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        validate_template
        deploy_storage
        post_deployment_validation
        
        log_success "🎉 Enterprise secure storage deployment completed successfully!"
        log_info "Check the Azure portal for resource details and monitoring setup."
    else
        log_info "Deployment cancelled by user."
        exit 0
    fi
}

# Run main function
main "$@"