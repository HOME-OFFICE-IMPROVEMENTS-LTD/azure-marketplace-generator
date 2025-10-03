# Azure Marketplace Generator

🚀 **Enterprise-grade tool for generating Azure Marketplace managed application packages**

## Vision

Automate the creation of marketplace-ready managed applications that pass ARM-TTK validation and Partner Center requirements.

## Current Status

✅ **Production Ready** - Full working CLI tool with ARM-TTK validation

## Key Features

- ✅ Generate 4 core files: mainTemplate.json, createUiDefinition.json, viewDefinition.json, nested templates
- ✅ Built-in ARM-TTK validation integration
- ✅ Partner Center submission packaging (ZIP)
- ✅ Template customization via interactive prompts
- ✅ Marketplace compliance verification
- ✅ Security best practices by default

## Quick Start

```bash
# Install dependencies
npm install

# Generate storage managed app
npm run dev -- create storage --publisher "YourCompany" --name "MyStorageApp"

# Validate with ARM-TTK
npm run dev -- validate ./output

# Package for marketplace
npm run dev -- package ./output --output marketplace-ready.zip
```

## Architecture

Simple, focused, enterprise-ready:

- **CLI**: Node.js + TypeScript + Commander.js
- **Templates**: Handlebars + JSON Schema
- **Validation**: ARM-TTK integration (PowerShell)
- **Output**: Marketplace-ready packages

## Core Capabilities

✅ **Template Generation**: Creates all 4 required files with proper metadata  
✅ **ARM-TTK Validation**: Real integration with Microsoft's official tool  
✅ **Packaging**: ZIP creation ready for Partner Center upload  
✅ **Security**: HTTPS-only, TLS 1.2, encryption enabled by default  
✅ **API Versions**: Latest APIs automatically injected  

## Documentation

- [**🎯 Managed Applications Guide**](./docs/MANAGED_APPLICATIONS_GUIDE.md) - **Essential reading: Complete solution patterns & business strategy**
- [Architecture Decisions](./docs/ARCHITECTURE.md)
- [Development Log](./docs/DEVELOPMENT_LOG.md)
- [Requirements](./docs/requirements.md)

## Enterprise Features

🔥 **Production Patterns**:

- Progressive disclosure CLI design
- Dry-run capabilities for enterprise safety
- Metadata tracking for support
- Security defaults that pass marketplace certification

---

**Built by Microsoft Partners for Microsoft Partners** 💪
