# CLI Command Reference

Complete reference for all Azure Marketplace Generator commands.

## Core Commands

### azmp create

Create new managed application templates.

```bash

azmp create <type> [name] [options]

```

**Arguments:**

- `type` - Template type: storage, compute, networking, webapp

- `name` - Application name (optional)

**Options:**

- `--interactive` - Interactive template configuration

- `--publisher <name>` - Publisher name

- `--dry-run` - Preview without creating files

**Examples:**

```bash

azmp create storage my-storage-app
azmp create webapp --interactive
azmp create compute --publisher "My Company"

```

### azmp validate

Validate ARM templates and configurations.

```bash

azmp validate <path> [options]

```

**Options:**

- `--intelligent` - AI-powered validation analysis

- `--fix` - Automatically fix detected issues

- `--security` - Security-focused validation

- `--market-context` - Marketplace-specific recommendations

- `--output <file>` - Save validation report

**Examples:**

```bash

azmp validate ./my-app
azmp validate ./my-app --intelligent --fix
azmp validate ./my-app --security --output report.json

```

### azmp package

Package applications for marketplace submission.

```bash

azmp package <path> [options]

```

**Options:**

- `--optimize` - Smart packaging with optimizations

- `--marketplace` - Marketplace-ready package

- `--output <file>` - Output ZIP file name

- `--analysis-only` - Quality analysis without packaging

- `--quality-threshold <score>` - Minimum quality score (0-100)

**Examples:**

```bash

azmp package ./my-app
azmp package ./my-app --optimize --quality-threshold 85
azmp package ./my-app --analysis-only

```

### azmp deploy

Deploy packaged applications to Azure.

```bash

azmp deploy <package> [options]

```

**Options:**

- `--resource-group <name>` - Target resource group

- `--location <region>` - Azure region

- `--environment <env>` - Environment (dev, test, prod)

- `--test-mode` - Deploy in test mode

- `--interactive` - Interactive deployment

- `--dry-run` - Preview deployment

**Examples:**

```bash

azmp deploy my-app.zip --test-mode
azmp deploy my-app.zip --environment prod --location eastus
azmp deploy my-app.zip --interactive

```

## GitHub Integration Commands

### azmp pr

GitHub Pull Request management.

```bash

azmp pr [options]

```

**Options:**

- `--list` - List all open pull requests

- `--status [number]` - Show PR status (current or specific PR)

- `--create <title>` - Create new PR from current branch

- `--approve <number>` - Approve specific PR

- `--merge <number>` - Merge approved PR

- `--checks [number]` - Show CI/CD check status

- `--review <number>` - Interactive PR review

- `--base <branch>` - Base branch (default: develop)

- `--body <text>` - PR description text

- `--draft` - Create as draft PR

- `--method <type>` - Merge method: merge, squash, rebase

**Examples:**

```bash

azmp pr --list
azmp pr --create "Add new storage template"
azmp pr --status 42
azmp pr --approve 42 --body "Looks good to me"
azmp pr --merge 42 --method squash
azmp pr --checks

```

### azmp workflow

GitFlow workflow automation.

```bash

azmp workflow <branch-name> <pr-title> [options]

```

**Options:**

- `--base <branch>` - Base branch (default: develop)

- `--template <type>` - Azure template type to generate

- `--validate` - Run validation before creating PR

**Examples:**

```bash

azmp workflow feature/oauth-support "Add OAuth2 authentication"
azmp workflow feature/storage-template "New storage solution" --template storage
azmp workflow hotfix/security-fix "Fix security vulnerability" --base main

```

## Monitoring Commands

### azmp monitor

Enterprise monitoring and analytics.

```bash

azmp monitor [options]

```

**Options:**

- `--init` - Initialize monitoring configuration

- `--discover` - Auto-discover Azure applications

- `--dashboard` - Generate monitoring dashboard

- `--alerts` - Show active alerts

- `--performance` - Performance report

- `--compliance` - Compliance status

- `--workflows` - GitHub Actions workflow status

- `--watch` - Continuous monitoring mode

- `--export <format>` - Export reports (json, csv)

**Examples:**

```bash

azmp monitor --init
azmp monitor --discover
azmp monitor --dashboard
azmp monitor --workflows --watch

```

### azmp insights

AI-powered analytics and optimization.

```bash

azmp insights [options]

```

**Options:**

- `--init` - Initialize AI analytics

- `--predictions` - Get performance predictions

- `--optimizations` - Cost optimization suggestions

- `--anomalies` - Detect performance anomalies

- `--market` - Market intelligence analysis

- `--export <format>` - Export insights

**Examples:**

```bash

azmp insights --init
azmp insights --predictions
azmp insights --optimizations
azmp insights --market

```

## Utility Commands

### azmp status

Show portfolio status and session summary.

```bash

azmp status [options]

```

**Options:**

- `--verbose` - Detailed status information

- `--json` - Output in JSON format

### azmp list-packages

List all available packages.

```bash

azmp list-packages [options]

```

**Options:**

- `--format <type>` - Output format: table, json, csv

### azmp promote

Promote package to marketplace-ready version.

```bash

azmp promote <package> <version> [options]

```

**Arguments:**

- `package` - Package file path

- `version` - Version number (semver format)

**Options:**

- `--changelog <file>` - Include changelog

- `--notes <text>` - Release notes

### azmp auth

Manage Azure authentication.

```bash

azmp auth [options]

```

**Options:**

- `--setup` - Initial authentication setup

- `--validate` - Validate current authentication

- `--check` - Check authentication status

- `--fix-mfa` - Fix MFA authentication issues

- `--clear` - Clear cached credentials

## Microsoft Graph Integration

### azmp graph

Microsoft Graph and organizational intelligence.

```bash

azmp graph <command> [options]

```

**Commands:**

- `rag` - RAG operations (search, context, stats, clear)

- `generate` - Generate intelligent ARM templates

- `knowledge` - Access organizational knowledge

**Examples:**

```bash

azmp graph rag --search "ARM templates"
azmp graph generate --type storage --description "Enterprise storage"
azmp graph knowledge --guidance "security best practices"

```

## Global Options

All commands support these global options:

- `-v, --verbose` - Enable verbose logging

- `--dry-run` - Preview actions without executing

- `-h, --help` - Show command help

## Exit Codes

- `0` - Success

- `1` - General error

- `2` - Invalid command or arguments

- `3` - Authentication error

- `4` - Azure service error

- `5` - File system error

## Environment Variables

Key environment variables for configuration:

- `AZURE_TENANT_ID` - Azure Active Directory tenant ID

- `AZURE_SUBSCRIPTION_ID` - Azure subscription ID

- `AZURE_CLIENT_ID` - Service principal client ID (optional)

- `AZURE_CLIENT_SECRET` - Service principal secret (optional)

- `GITHUB_TOKEN` - GitHub access token (for PR operations)

## Configuration Files

The CLI uses these configuration files:

- `.env` - Environment variables

- `.azmp.json` - Project configuration

- `azmp.config.js` - Advanced configuration (optional)

## Examples by Use Case

### First-time Setup

```bash

azmp auth --setup
azmp create storage my-first-app
azmp validate my-first-app --intelligent
azmp package my-first-app --optimize

```

### Development Workflow

```bash

azmp workflow feature/new-feature "Add authentication"

# Make changes

azmp pr --create "Add OAuth2 authentication" --validate
azmp pr --status
azmp pr --merge <pr-number>

```

### Enterprise Deployment

```bash

azmp validate ./enterprise-app --intelligent --security
azmp package ./enterprise-app --optimize --quality-threshold 90
azmp deploy enterprise-app.zip --environment prod
azmp monitor --discover
azmp insights --predictions

```

### Continuous Integration

```bash

azmp validate . --intelligent --fix
azmp package . --analysis-only --quality-threshold 85
azmp pr --checks

```
