# CLI Validation & Tooling Prompts

## 🎯 CORE PRINCIPLE: CLI-FIRST DEVELOPMENT

> **GOLDEN RULE**: Always use our custom CLI tooling (`azmp`) before external tools. Our CLI is the primary interface for all operations.

## 🚀 CLI COMMANDS - USE THESE FIRST

### Template Validation
```bash
# ✅ CORRECT - Use our CLI
npm run build && node dist/cli/index.js validate azure-deployment/

# ❌ WRONG - Don't bypass our CLI
pwsh -Command "Import-Module..."
```

### Package Generation
```bash
# ✅ CORRECT - Use our tooling
azmp package --input azure-deployment/ --output packages/generated/

# ❌ WRONG - Manual file operations
zip -r package.zip azure-deployment/
```

### Template Creation
```bash
# ✅ CORRECT - Use our generators
azmp create --template storage-lifecycle

# ❌ WRONG - Manual template editing
vim mainTemplate.json
```

## 🔧 WHEN TO USE EXTERNAL TOOLS

External tools should ONLY be used when:
1. ✅ Our CLI doesn't have the capability yet
2. ✅ Adding new functionality to our CLI
3. ✅ Debugging our CLI implementation
4. ✅ Comparing our CLI output with reference tools

## 📊 VALIDATION WORKFLOW

### 1. Primary Validation (Our CLI)
```bash
azmp validate azure-deployment/ --verbose
```

### 2. Secondary Validation (ARM-TTK Reference)
```bash
# Only if our CLI validation needs verification
pwsh -Command "Test-AzTemplate..."
```

### 3. Package Generation
```bash
azmp package azure-deployment/ --output packages/validated/$(date +%Y%m%d-%H%M%S)/
```

## 🎨 CLI OUTPUT STANDARDS

Our CLI should provide:
- ✅ **Colored output** with chalk
- ✅ **Progress indicators** for long operations  
- ✅ **Structured results** with pass/fail counts
- ✅ **Actionable error messages** with fix suggestions
- ✅ **Package artifact management** with organized output

## 🔄 TOOL INTEGRATION HIERARCHY

```
1. Our CLI (azmp) - PRIMARY INTERFACE
   ↓
2. Our Core Modules (TypeScript) - BUSINESS LOGIC
   ↓  
3. External Tools (PowerShell, ARM-TTK) - EXECUTION ENGINES
   ↓
4. Azure APIs - VALIDATION SOURCE
```

## 📁 PACKAGE ARTIFACT MANAGEMENT

### Directory Structure
```
packages/
├── generated/$(timestamp)/     # Initial generation
├── validated/$(timestamp)/     # Post-validation
├── marketplace/$(version)/     # Release-ready
└── archive/$(date)/           # Historical versions
```

### CLI Commands for Package Management
```bash
# Generate with timestamp
azmp package --timestamp

# Validate existing package  
azmp validate packages/generated/20241005-143022/

# Promote to marketplace-ready
azmp promote packages/validated/20241005-143022/ --version 1.2.0
```

## 🚨 ERROR PREVENTION RULES

### Before Any Operation
1. ✅ Check if CLI command exists: `azmp --help`
2. ✅ Use CLI if available: `azmp validate` not `pwsh`
3. ✅ Document CLI gaps for future enhancement
4. ✅ Always save artifacts in organized structure

### Code Review Checklist
- [ ] Used CLI-first approach?
- [ ] Proper package artifact management?
- [ ] External tools only when necessary?
- [ ] CLI capabilities showcased?
- [ ] Package versioning implemented?

## 💡 CLI ENHANCEMENT PRIORITIES

When our CLI lacks functionality:
1. **Identify the gap** - what external tool are we using?
2. **Design CLI interface** - how should users interact?
3. **Implement wrapper** - integrate external tool via our CLI
4. **Add package management** - organize output artifacts
5. **Document usage** - update prompts and help

## 🎯 SUCCESS METRICS

- **CLI Usage Rate**: 100% of operations through our CLI
- **Tool Showcase**: Demonstrate CLI value in every interaction
- **Package Organization**: All artifacts properly versioned and stored
- **User Experience**: Professional CLI interface with clear feedback

---

## 📚 QUICK REFERENCE

```bash
# Core CLI Commands
azmp create <template-type>     # Generate new template
azmp validate <path>           # Validate ARM templates
azmp package <input> <output>  # Create marketplace package
azmp promote <package> <ver>   # Promote to marketplace-ready

# Package Management
ls packages/generated/         # View generated packages
ls packages/validated/         # View validated packages  
ls packages/marketplace/       # View release-ready packages
```

**Remember: Our CLI is our competitive advantage. Use it, showcase it, enhance it!** 🚀