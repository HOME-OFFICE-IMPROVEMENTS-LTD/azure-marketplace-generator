# Quick Start Guide

Get your first Azure Marketplace application running in under 15 minutes.

## Prerequisites

- Node.js 18 or higher
- Azure CLI installed and authenticated
- GitHub CLI (gh) installed
- Visual Studio Code (recommended)

## Installation

```bash
npm install -g @hoiltd/azure-marketplace-generator
```

Verify installation:
```bash
azmp --version
```

## Your First Project

### Step 1: Create a Storage Solution

```bash
azmp create storage my-first-app
cd my-first-app
```

### Step 2: Validate the Application

```bash
azmp validate . --intelligent
```

This runs AI-powered validation and provides optimization suggestions.

### Step 3: Package for Marketplace

```bash
azmp package . --optimize
```

Creates an optimized ZIP package ready for Azure Marketplace submission.

### Step 4: Test Deployment

```bash
azmp deploy my-first-app.zip --test-mode
```

Deploys to Azure in test mode for verification.

## GitHub Workflow Integration

If you're using GitHub for development:

### Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### Create Development Branch

```bash
azmp workflow feature/initial-setup "Initial marketplace setup"
```

### Make Changes and Create Pull Request

```bash
# Make your changes
git add .
git commit -m "Add storage configuration"
git push origin feature/initial-setup

azmp pr --create "Initial marketplace setup"
```

### Monitor and Merge

```bash
azmp pr --status
azmp pr --merge <pr-number>
```

## Configuration

Create a `.env` file in your project root:

```env
AZURE_TENANT_ID=your-tenant-id
AZURE_SUBSCRIPTION_ID=your-subscription-id
```

## Next Steps

- Read the [CLI Reference](./docs/user-guide/CLI_REFERENCE.md) for all available commands
- Review [Examples](./docs/getting-started/EXAMPLES.md) for common patterns
- Set up [Enterprise Monitoring](./docs/user-guide/MONITORING_GUIDE.md)

## Common Issues

**Command not found**: Ensure Node.js is in your PATH and npm global bin is accessible.

**Azure authentication failed**: Run `az login` and verify your subscription access.

**GitHub CLI not found**: Install with `winget install GitHub.cli` (Windows) or `brew install gh` (macOS).

## Support

- Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Review [GitHub Issues](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/issues)
- Join [Community Discussions](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/discussions)