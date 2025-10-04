# Documentation Standards & Best Practices Prompts

## 🚨 MANDATORY CHECKS BEFORE DOCUMENTATION UPDATES

### Pre-Documentation Writing Checklist

```bash
# STOP! Before creating or updating documentation, verify:
□ Have you identified the target audience clearly?
□ Is the documentation structure logical and hierarchical?
□ Are all technical details accurate and up-to-date?
□ Have you included practical examples and code snippets?
□ Are all external links valid and current?
□ Does the documentation follow consistent formatting?
```

### Documentation Structure Standards

```bash
# Standard documentation file structure:
project-root/
├── README.md                    # Project overview and quick start
├── docs/
│   ├── ARCHITECTURE.md         # System architecture and design
│   ├── API_REFERENCE.md        # API documentation
│   ├── DEPLOYMENT_GUIDE.md     # Deployment instructions
│   ├── DEVELOPMENT_GUIDE.md    # Development setup and workflow
│   ├── TROUBLESHOOTING.md      # Common issues and solutions
│   ├── CHANGELOG.md            # Version history and changes
│   └── CONTRIBUTING.md         # Contribution guidelines
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── ISSUE_TEMPLATE.md
│   └── prompts/                # This directory with prompt files
└── examples/                   # Code examples and samples
```

### README.md Template Structure

```markdown
# Project Name

Brief project description (1-2 sentences)

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Overview
Detailed project description, purpose, and value proposition.

## Features
- ✅ Feature 1 with brief description
- ✅ Feature 2 with brief description
- 🚧 Feature 3 (in development)

## Quick Start
Minimal steps to get started (under 5 minutes)

## Installation
Detailed installation instructions

## Usage
Basic usage examples with code snippets

## Documentation
Links to comprehensive documentation

## Contributing
Link to CONTRIBUTING.md

## License
License information
```

### API Documentation Standards

```bash
# API documentation requirements:
□ Clear endpoint descriptions
□ Request/response examples
□ Parameter specifications
□ Error code explanations
□ Authentication requirements
□ Rate limiting information
□ SDK/client library examples
□ Interactive testing capabilities
```

### Code Documentation Standards

```typescript
/**
 * Template generation service for Azure Marketplace applications
 * 
 * @class TemplateGenerator
 * @description Handles generation of ARM templates and UI definitions
 * for Azure Marketplace offerings
 * 
 * @example
 * ```typescript
 * const generator = new TemplateGenerator({
 *   outputPath: './output',
 *   templateType: 'storage'
 * });
 * 
 * const result = await generator.generateTemplate({
 *   name: 'my-storage-app',
 *   parameters: { storageType: 'Standard_LRS' }
 * });
 * ```
 */
class TemplateGenerator {
  /**
   * Generate ARM template from configuration
   * 
   * @param config - Template configuration object
   * @param config.name - Application name (alphanumeric, 3-24 characters)
   * @param config.parameters - Template parameters
   * @returns Promise resolving to generation result
   * 
   * @throws {ValidationError} When configuration is invalid
   * @throws {TemplateError} When template generation fails
   * 
   * @since 1.0.0
   */
  async generateTemplate(config: TemplateConfig): Promise<GenerationResult> {
    // Implementation
  }
}
```

### Architectural Decision Records (ADR) Template

```markdown
# ADR-XXXX: Title of Decision

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing or have agreed to implement?

## Consequences
What becomes easier or more difficult to do and any risks introduced by this change?

## Alternatives Considered
What other options were evaluated?

## Implementation Notes
Technical details about how this decision will be implemented.

## Date
YYYY-MM-DD

## Participants
- Name 1 (Role)
- Name 2 (Role)
```

### Changelog Documentation Standards

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New features that will be in the next release

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Now removed features

### Fixed
- Any bug fixes

### Security
- Security improvements

## [1.2.0] - 2025-10-04

### Added
- Customer Usage Attribution tracking
- Event Grid integration template
- ARM-TTK validation integration

### Changed
- Updated ARM template API versions
- Improved error handling in CLI

### Fixed
- Template parameter validation issues
- UI definition parameter mapping

## [1.1.0] - 2025-09-15
...
```

### Troubleshooting Documentation Template

```markdown
# Troubleshooting Guide

## Common Issues

### Issue: ARM Template Validation Fails

**Symptoms:**
- ARM-TTK returns validation errors
- Template deployment fails in Azure

**Causes:**
- Outdated API versions
- Missing required parameters
- Invalid resource configurations

**Solutions:**
1. Update API versions to latest stable
2. Verify all required parameters are provided
3. Check resource naming conventions
4. Validate template syntax

**Prevention:**
- Always run ARM-TTK before deployment
- Use latest API version checker
- Follow ARM template best practices

### Issue: Customer Usage Attribution Not Working

**Symptoms:**
- Partner Center shows no usage attribution
- Revenue sharing not calculated correctly

**Causes:**
- Missing CUA tracking resource
- Incorrect partner ID
- Deployment failures

**Solutions:**
1. Verify CUA resource exists in template
2. Check partner ID matches Partner Center
3. Ensure deployment completes successfully

**Prevention:**
- Include CUA in all templates
- Test attribution in development environment
- Monitor Partner Center analytics
```

### Documentation Review Checklist

```bash
# Before publishing documentation:
□ Content is accurate and up-to-date
□ All code examples tested and working
□ Screenshots and images current
□ Links verified and functional
□ Spelling and grammar checked
□ Consistent formatting applied
□ Target audience appropriate
□ Cross-references accurate
□ Table of contents updated
□ Search keywords included
```

### Documentation Maintenance Procedures

```bash
# Regular documentation maintenance:
□ Review monthly for accuracy
□ Update screenshots quarterly
□ Verify all links quarterly
□ Update API documentation with each release
□ Archive outdated documentation
□ Update getting started guides
□ Refresh troubleshooting based on support tickets
□ Update architecture diagrams as needed
```

### Interactive Documentation Tools

```bash
# Tools for enhanced documentation:
□ Swagger/OpenAPI for API docs
□ Storybook for UI component docs
□ GitHub Pages for hosted documentation
□ Mermaid for diagrams in Markdown
□ PlantUML for architecture diagrams
□ Jupyter notebooks for tutorials
□ Video recordings for complex procedures
```

### Documentation Accessibility Standards

```bash
# Accessibility requirements:
□ Clear heading hierarchy (H1, H2, H3)
□ Alt text for all images
□ Descriptive link text (not "click here")
□ High contrast for code blocks
□ Simple language and short sentences
□ Logical reading order
□ Table headers clearly marked
□ Consistent navigation structure
```

### Version Control for Documentation

```bash
# Documentation versioning strategy:
□ Version docs with software releases
□ Maintain docs for supported versions
□ Clear migration guides between versions
□ Archive old versions appropriately
□ Use semantic versioning for major doc changes
□ Tag documentation releases in Git
□ Provide diff views for changes
```

### Documentation Analytics and Feedback

```bash
# Measuring documentation effectiveness:
□ Track page views and popular content
□ Monitor search terms and failed searches
□ Collect user feedback and ratings
□ Analyze support ticket trends
□ Track documentation contribution metrics
□ Monitor external link clicks
□ Survey users about documentation quality
```

## 🔧 Documentation Tools and Commands

### Markdown Linting

```bash
# Install markdownlint
npm install -g markdownlint-cli

# Lint all markdown files
markdownlint docs/**/*.md

# Fix common issues automatically
markdownlint docs/**/*.md --fix

# Custom rules configuration in .markdownlint.json
{
  "MD013": { "line_length": 120 },
  "MD033": false,
  "MD041": false
}
```

### Link Validation

```bash
# Check all links in documentation
npm install -g markdown-link-check

# Check specific file
markdown-link-check docs/README.md

# Check all markdown files
find docs -name "*.md" -exec markdown-link-check {} \;
```

### Documentation Generation

```bash
# Generate API docs from TypeScript
npx typedoc src --out docs/api

# Generate OpenAPI docs
swagger-codegen generate -i api-spec.yaml -l html2 -o docs/api

# Generate table of contents
npm install -g doctoc
doctoc docs/README.md
```

## ⚠️ Documentation Best Practices

### Writing Guidelines

- ✅ Write for your audience's skill level
- ✅ Use active voice and present tense
- ✅ Include practical examples for everything
- ✅ Keep sentences and paragraphs short
- ✅ Use consistent terminology throughout
- ✅ Provide context before diving into details
- ✅ Include next steps and related topics

### Common Documentation Mistakes

- ❌ Assuming knowledge without explanation
- ❌ Outdated screenshots and code examples
- ❌ Missing error handling in examples
- ❌ Broken or redirected links
- ❌ Inconsistent formatting and style
- ❌ No clear entry points for different user types
- ❌ Missing troubleshooting information
- ❌ Poor organization and navigation

### Documentation Maintenance Schedule

```bash
# Weekly:
□ Review and update changelog
□ Check for new support issues to document
□ Update any outdated quick start guides

# Monthly:
□ Comprehensive link checking
□ Review analytics and user feedback
□ Update frequently accessed pages
□ Check for consistency across all docs

# Quarterly:
□ Major documentation review and reorganization
□ Screenshot and image updates
□ API documentation comprehensive review
□ User experience testing of documentation
```