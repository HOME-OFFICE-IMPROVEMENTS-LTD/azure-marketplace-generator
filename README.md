# Azure Marketplace Generator

🚀 **Enterprise-grade tool for generating Azure Marketplace managed application packages**

## Vision

Automate the creation of marketplace-ready managed applications that pass ARM-TTK validation and Partner Center requirements.

## Current Status

✅ **MVP COMPLETE & VALIDATED** - Full working CLI tool with ARM-TTK validation passing

🎯 **Production Ready**: Successfully validated against Microsoft's ARM-TTK with zero errors  
⚡ **Tested End-to-End**: Generate → Validate → Package workflow fully functional  
🏆 **Superior to Microsoft Samples**: Uses latest APIs and includes viewDefinition.json

## Key Features (WORKING)

- ✅ Generate 4 core files: mainTemplate.json, createUiDefinition.json, viewDefinition.json, nested templates
- ✅ Built-in ARM-TTK validation integration
- ✅ Partner Center submission packaging (ZIP)
- ✅ Template customization via interactive prompts
- ✅ Marketplace compliance verification
- ✅ Security best practices by default

## Quick Start (Verified Working ✅)

```bash
# Install dependencies
npm install

# Generate storage managed app
npm run dev -- create storage --publisher "YourCompany" --name "MyStorageApp"

# Validate with ARM-TTK (passes all tests!)
npm run dev -- validate ./output

# Package for marketplace
npm run dev -- package ./output --output marketplace-ready.zip
```

**🎉 Latest Test Results (October 3, 2025):**

- ✅ Template generation: **SUCCESS**
- ✅ ARM-TTK validation: **PASSES ALL TESTS**
- ✅ Marketplace packaging: **READY FOR UPLOAD**

## Architecture

Simple, focused, no over-engineering:

- **CLI**: Node.js + TypeScript + Commander.js
- **Templates**: Handlebars + JSON Schema
- **Validation**: ARM-TTK integration (PowerShell)
- **Output**: Marketplace-ready packages

## Verified Functionality

✅ **Template Generation**: Creates all 4 required files with proper metadata  
✅ **ARM-TTK Validation**: Real integration with Microsoft's official tool  
✅ **Packaging**: ZIP creation ready for Partner Center upload  
✅ **Security**: HTTPS-only, TLS 1.2, encryption enabled by default  
✅ **API Versions**: Latest APIs automatically injected  

## Documentation

- [Architecture Decisions](./docs/ARCHITECTURE.md)
- [Development Log](./docs/DEVELOPMENT_LOG.md) - **Read this for session continuity**
- [Requirements](./docs/requirements.md)

## Trade Secrets Implemented

🔥 **Enterprise Patterns**:

- Progressive disclosure CLI design
- Dry-run capabilities for enterprise safety
- Metadata tracking for support
- Security defaults that pass marketplace certification

---

**Built by Microsoft Partners for Microsoft Partners** 💪

**Status**: Ready for extension to new resource types!
