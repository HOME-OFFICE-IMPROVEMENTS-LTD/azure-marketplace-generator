# Azure Marketplace Generator - Architecture Refactoring Plan

**Date**: October 20, 2025  
**Version**: 2.1.0 → 3.0.0  
**Status**: Planning Phase

---

## 🎯 Strategic Goals

1. **Create a stable, minimal core** that only handles marketplace generation mechanics
2. **Extract category-specific logic into plugins** for extensibility
3. **Release v2.1.0-storage** as proven, working baseline
4. **Enable future categories** without destabilizing core

---

## 📊 Current State Analysis

### ✅ What's Working (KEEP THIS!)
- **Storage generation**: Produces valid ARM templates, UI definitions, view definitions
- **Validation**: ARM-TTK integration works
- **Packaging**: Creates .zip files successfully
- **Testing**: 10 test suites, all passing
- **CLI**: 15+ commands functional

### ❌ What's Broken/Problematic
- **Multiple category stubs**: webapp, vm, security mentioned but not fully implemented
- **Over-engineered MCP ecosystem**: 7 packages for RAG/MCP that may not be core
- **Tight coupling**: Category logic mixed with core generation logic
- **Dependency bloat**: Each MCP server has heavy dependencies

### 🔍 Root Cause
- Started adding categories (webapp, security) **before** establishing plugin architecture
- Core logic became entangled with category-specific code
- No clear separation of concerns

---

## 🏗️ Target Architecture

```
azure-marketplace-generator/
├── packages/
│   ├── core/                          # CORE ENGINE (Minimal, Stable)
│   │   ├── src/
│   │   │   ├── engine/
│   │   │   │   ├── TemplateGenerator.ts    # Generic ARM generation
│   │   │   │   ├── UIGenerator.ts          # Generic UI definition
│   │   │   │   ├── ViewGenerator.ts        # Generic view definition
│   │   │   │   └── Packager.ts             # .zip creation
│   │   │   ├── validation/
│   │   │   │   ├── ArmValidator.ts         # ARM-TTK wrapper
│   │   │   │   └── SchemaValidator.ts      # JSON schema validation
│   │   │   ├── plugins/
│   │   │   │   ├── PluginLoader.ts         # Plugin discovery & loading
│   │   │   │   ├── PluginRegistry.ts       # Plugin management
│   │   │   │   └── IPlugin.ts              # Plugin interface contract
│   │   │   └── cli/
│   │   │       └── CoreCLI.ts              # Plugin-aware CLI
│   │   └── package.json                    # Minimal dependencies
│   │
│   └── plugins/
│       ├── storage/                    # REFERENCE PLUGIN (Working!)
│       │   ├── src/
│       │   │   ├── StoragePlugin.ts         # Implements IPlugin
│       │   │   ├── templates/
│       │   │   │   ├── mainTemplate.hbs
│       │   │   │   ├── createUi.hbs
│       │   │   │   └── viewDef.hbs
│       │   │   └── validators/
│       │   │       └── StorageValidator.ts
│       │   └── package.json                 # Storage-specific deps
│       │
│       ├── webapp/                     # FUTURE PLUGIN (TBD)
│       ├── database/                   # FUTURE PLUGIN (TBD)
│       └── security/                   # FUTURE PLUGIN (TBD)
│
└── cli/                                # THIN CLI WRAPPER
    └── index.ts                        # Entry point, delegates to core
```

---

## 🔌 Plugin Interface Design

```typescript
// packages/core/src/plugins/IPlugin.ts

export interface IPlugin {
  /** Unique identifier for this plugin */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Plugin version */
  version: string;
  
  /** Azure resource types this plugin handles */
  resourceTypes: string[];
  
  /** Generate ARM template for this category */
  generateTemplate(config: PluginConfig): Promise<ARMTemplate>;
  
  /** Generate UI definition for this category */
  generateUI(config: PluginConfig): Promise<UIDefinition>;
  
  /** Generate view definition for this category */
  generateView(config: PluginConfig): Promise<ViewDefinition>;
  
  /** Validate category-specific requirements */
  validate(template: ARMTemplate): Promise<ValidationResult>;
  
  /** Get interactive prompts for this category */
  getPrompts(): Promise<InquirerPrompt[]>;
}

export interface PluginConfig {
  appName: string;
  publisher: string;
  location: string;
  options: Record<string, any>;
}
```

---

## 📋 Refactoring Phases

### **Phase 1: Baseline & Documentation** (1-2 days)

**Tasks:**
1. ✅ Document current working storage implementation
2. ✅ Create v2.1.0-storage-baseline Git tag
3. ✅ Create GitHub release with test outputs as proof
4. ✅ Archive current state as reference

**Deliverables:**
- Git tag: `v2.1.0-storage-baseline`
- GitHub release with test-storage-output/
- This architecture document

---

### **Phase 2: Core Extraction** (2-3 days)

**Tasks:**
1. Create `packages/core/` directory structure
2. Extract generic template generation logic
3. Extract validation framework
4. Extract packaging system
5. Move CLI to use core APIs
6. Remove category-specific code from core

**Validation:**
- All tests still pass
- Storage generation still works
- No regressions

---

### **Phase 3: Plugin System Implementation** (3-5 days)

**Tasks:**
1. Implement `IPlugin` interface
2. Create `PluginLoader` and `PluginRegistry`
3. Design plugin discovery mechanism (package.json convention)
4. Create plugin validation system
5. Update CLI to be plugin-aware

**Validation:**
- Plugin loader can discover plugins
- Registry can manage plugin lifecycle
- Core delegates to plugins correctly

---

### **Phase 4: Storage Plugin Migration** (2-3 days)

**Tasks:**
1. Create `packages/plugins/storage/` structure
2. Move storage-specific logic to plugin
3. Implement `StoragePlugin` class
4. Move Handlebars templates to plugin
5. Update tests to work with plugin architecture

**Validation:**
- Storage generation works identically to before
- All storage tests pass
- Plugin can be loaded/unloaded dynamically

---

### **Phase 5: Cleanup & Optimization** (1-2 days)

**Tasks:**
1. Remove unused MCP packages (unless needed)
2. Consolidate dependencies
3. Update documentation
4. Create plugin development guide
5. Clean up package.json

**Validation:**
- Dependencies reduced by >50%
- npm install time improved
- Bundle size reduced

---

### **Phase 6: Release v3.0.0** (1 day)

**Tasks:**
1. Final testing
2. Update README
3. Create migration guide
4. Tag v3.0.0
5. Publish to npm (if applicable)
6. Announce architecture change

**Deliverables:**
- v3.0.0 release with plugin architecture
- Migration guide for users
- Plugin development tutorial

---

## 🎯 Success Criteria

### **Must Have:**
- ✅ Storage plugin produces identical output to v2.1.0
- ✅ All tests pass
- ✅ Core has <20 dependencies
- ✅ Plugin interface is documented
- ✅ Clear separation of core vs plugin code

### **Nice to Have:**
- 📦 50%+ reduction in core dependencies
- 🚀 Faster CLI startup time
- 📚 Plugin development tutorial
- 🔌 At least 2 plugins (storage + one more)

---

## 🚫 Anti-Patterns to Avoid

1. **Don't**: Add new categories before plugin system is ready
2. **Don't**: Mix category logic with core logic
3. **Don't**: Create tight coupling between plugins
4. **Don't**: Over-engineer plugin system (keep it simple!)
5. **Don't**: Break existing storage generation

---

## 📊 Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|-------------|
| Phase 1: Baseline | 1-2 days | None |
| Phase 2: Core Extract | 2-3 days | Phase 1 |
| Phase 3: Plugin System | 3-5 days | Phase 2 |
| Phase 4: Storage Plugin | 2-3 days | Phase 3 |
| Phase 5: Cleanup | 1-2 days | Phase 4 |
| Phase 6: Release | 1 day | Phase 5 |
| **TOTAL** | **10-16 days** | Sequential |

---

## 🔄 Rollback Plan

If refactoring introduces regressions:
1. Return to `v2.1.0-storage-baseline` tag
2. Analyze what went wrong
3. Re-plan with lessons learned
4. Restart from stable baseline

---

## 📝 Notes

- Keep storage generation working at ALL times
- Test after each phase
- Commit frequently
- Document decisions
- Don't rush - quality over speed

---

**Approved by**: [Your Name]  
**Review Date**: [TBD]  
**Status**: DRAFT - Ready for Review
