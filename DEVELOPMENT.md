# 🚀 Azure Marketplace Generator - Development Environment

## Prerequisites
- Node.js >= 18.0.0
- TypeScript >= 5.2.2
- PowerShell Core (for ARM-TTK validation)
- Azure CLI (for deployment)

## Quick Start
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Project Structure
```
src/
├── cli/           # CLI commands and interface
├── services/      # Core business logic services
├── templates/     # ARM template generators
└── types/         # TypeScript type definitions

azure-deployment/ # ARM templates and UI definitions
config/           # Environment configurations
docs/             # Documentation
scripts/          # Build and deployment scripts
```

## Available Commands
- `azmp create <name>` - Create new marketplace package
- `azmp validate <path>` - Validate ARM templates
- `azmp package <path>` - Package for marketplace
- `azmp deploy <path>` - Deploy to Azure
- `azmp status` - Show portfolio status

## Environment Variables
```bash
# Required for Azure operations
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Optional for enhanced features
OPENAI_API_KEY=your-openai-key
PARTNER_CENTER_TENANT_ID=your-partner-center-tenant
```

## Development Workflow
1. Make changes in `src/`
2. Run `npm run build` to compile
3. Test with `npm test`
4. Validate with `npm run lint`
5. Commit and push

## Enterprise Features
- ARM-TTK validation integration
- Azure authentication with MPN credentials
- Partner Center API integration
- Automated compliance checking
- Multi-environment deployment support

## Troubleshooting
- Ensure Azure CLI is logged in: `az login`
- Check PowerShell Core installation: `pwsh --version`
- Verify Node.js version: `node --version`
- Clear build cache: `rm -rf dist/ && npm run build`