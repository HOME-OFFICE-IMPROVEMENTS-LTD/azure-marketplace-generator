# Package Artifact Management

## 📦 Directory Structure

```
packages/
├── generated/          # Initial package generation with timestamps
├── validated/          # ARM-TTK validated packages
├── marketplace/        # Release-ready marketplace packages
└── archive/           # Historical versions and backups
```

## 🚀 Usage

### Generate Package
```bash
azmp package azure-deployment/ --output generated/
```

### Validate Package
```bash
azmp validate packages/generated/20241005-143022/
```

### Promote to Marketplace
```bash
azmp promote packages/validated/20241005-143022/ --version 1.2.0
```

## 📋 Naming Conventions

- **Generated**: `YYYYMMDD-HHMMSS` (e.g., `20241005-143022`)
- **Validated**: Same timestamp as generated version
- **Marketplace**: `v{major}.{minor}.{patch}` (e.g., `v1.2.0`)
- **Archive**: `YYYY-MM` monthly folders (e.g., `2024-10`)

## 🔍 Package Contents

Each package directory contains:
- `mainTemplate.json` - Main ARM template
- `createUiDefinition.json` - UI definition
- `nestedtemplates/` - Nested templates
- `metadata.json` - Package metadata
- `validation-report.json` - ARM-TTK results (for validated packages)

## 🎯 Lifecycle Management

1. **Generate** → `packages/generated/`
2. **Validate** → `packages/validated/` 
3. **Release** → `packages/marketplace/`
4. **Archive** → `packages/archive/` (monthly)

---
*Managed by Azure Marketplace Generator CLI*