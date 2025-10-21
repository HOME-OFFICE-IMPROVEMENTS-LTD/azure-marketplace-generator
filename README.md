# Azure Marketplace Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)

Minimal CLI tool for generating Azure Storage marketplace managed applications.

## Features

- Storage-focused managed application generation
- ARM template validation with Microsoft ARM-TTK
- Marketplace-ready package creation
- TypeScript with full type safety

## Installation

```bash
# Clone and install
git clone https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator.git
cd azure-marketplace-generator
npm install

# Install ARM-TTK for validation
npm run install-arm-ttk

# Build the CLI
npm run build
```

## Usage

### Create Storage Solution

```bash
azmp create storage --publisher "MyCompany" --name "MyStorageApp"
```

### Validate Templates

```bash
azmp validate ./output
```

### Package for Marketplace

```bash
azmp package ./output
```

## Commands

| Command | Description |
|---------|-------------|
| `azmp create storage` | Create new storage managed application |
| `azmp validate <path>` | Validate ARM templates with ARM-TTK |
| `azmp package <path>` | Package templates for marketplace submission |

## Output Structure

```
output/
├── mainTemplate.json          # ARM template
├── createUiDefinition.json    # UI definition  
├── viewDefinition.json        # Management view
└── nestedtemplates/           # Nested templates
    └── storageAccount.json
```

## Requirements

- Node.js 18+
- PowerShell (for ARM-TTK validation)

## Development

```bash
# Run in development mode
npm run dev

# Run tests  
npm test

# Lint code
npm run lint
```

## License

MIT © Home & Office Improvements Ltd
