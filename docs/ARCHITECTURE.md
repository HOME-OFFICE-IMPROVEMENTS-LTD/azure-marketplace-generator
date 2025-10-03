# Architecture Decision Records

## Core Technology Decisions

### CLI Framework: Commander.js
**Decision**: Use Commander.js for CLI interface  
**Rationale**: 
- Industry standard (used by Vue CLI, Angular CLI)
- Excellent TypeScript support
- Built-in help generation
- Subcommand support

**Best Practice**: Always provide `--dry-run` flag for enterprise tools - users need to preview before generating

### Template Engine: Handlebars
**Decision**: Use Handlebars for template generation  
**Rationale**:
- Logic-less templates (safer than full JS)
- Great JSON handling
- Custom helpers support
- Wide enterprise adoption

**Best Practice**: Handlebars is perfect for ARM templates because it prevents logic injection - critical for security

### Validation Strategy: ARM-TTK Integration ✅
**Decision**: Direct PowerShell integration with existing ARM-TTK  
**Rationale**:
- Microsoft's official validation tool
- Already available in workspace
- Same validation used by marketplace
- No need to reimplement rules

**Implementation Note**: ARM-TTK has flags like `-Skip` that let you bypass specific tests during development

## Project Structure Decisions

### Single Repository ✅
**Decision**: Monorepo approach with clear module separation  
**Rationale**:
- Simpler dependency management
- Atomic releases
- Better for small team
- Easy CI/CD setup

### No AI Integration (Phase 1) ✅
**Decision**: Deterministic template generation only  
**Rationale**:
- ARM templates must be perfect (no hallucinations)
- Faster development cycle
- Lower operational complexity
- Predictable outputs

**Business Note**: Enterprise customers trust deterministic tools more than AI-powered ones for critical infrastructure

## Marketplace-Specific Decisions

### Package Structure
```
managed-app-package/
├── mainTemplate.json      # Core ARM template
├── createUiDefinition.json # Portal UX
├── viewDefinition.json    # Post-deployment views
└── nestedtemplates/       # Modular components
```

**Important**: viewDefinition.json is often overlooked but required for marketplace approval - it defines the post-deployment dashboard

### API Version Strategy
**Decision**: Always use latest stable API versions  
**Rationale**: Marketplace validation requires recent API versions

**Technical Note**: Keep a mapping of resource types to latest API versions - ARM-TTK will fail with old APIs

## Security Considerations

### No Secrets in Templates ✅
**Decision**: All secrets via Key Vault or managed identity  
**Rationale**: Marketplace security requirements

**Security Note**: Use `@secure()` decorator for all password parameters - even if obvious, it's required for certification