# Contributing Guide

Welcome! Thank you for considering contributing to Azure Marketplace Generator. This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Community](#community)

## Code of Conduct

We follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you agree to uphold this code. Please report unacceptable behavior to the maintainers.

### Our Pledge

- **Be welcoming** to newcomers and experienced contributors
- **Be respectful** of differing viewpoints and experiences
- **Be collaborative** and constructive in feedback
- **Be patient** with questions and learning processes

## Ways to Contribute

### 1. Report Bugs

Found a bug? Help us fix it!

**Before submitting:**

- Check [existing issues](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/issues)
- Verify it's reproducible in the latest version
- Gather relevant information (version, OS, error messages)

**Bug report should include:**

```markdown
## Bug Description
Clear description of what's wrong

## Steps to Reproduce
1. Run command: `azmp create storage ...`
2. Expected: X
3. Actual: Y

## Environment
- OS: Ubuntu 24.04
- Node: v20.11.0
- Package version: 3.1.0

## Error Output
```
[Paste error messages or logs]
```

## Expected Behavior
What should happen instead
```

### 2. Suggest Features

Have an idea? We'd love to hear it!

**Feature request should include:**

```markdown
## Feature Description
What feature would you like to see?

## Use Case
Why is this feature needed? What problem does it solve?

## Proposed Solution
How do you think it should work?

## Alternatives Considered
What other approaches did you consider?

## Additional Context
Screenshots, examples, references
```

### 3. Improve Documentation

Documentation is always welcome!

**Areas to contribute:**

- Fix typos and grammar
- Clarify confusing sections
- Add examples and use cases
- Update outdated information
- Translate to other languages

### 4. Write Code

Ready to code? Great!

**Good first issues:**

- Look for [`good first issue`](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) label
- Check [`help wanted`](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) issues
- Browse [`documentation`](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/issues?q=is%3Aissue+is%3Aopen+label%3Adocumentation) needs

### 5. Develop Plugins

Create plugins to extend functionality!

See [Plugin Development Guide](Plugin-Development) for details.

**Popular plugin ideas:**

- Virtual Machine templates
- AKS cluster templates
- SQL Database templates
- Web App templates
- Cosmos DB templates

### 6. Participate in Discussions

Join the conversation!

- Answer questions in [GitHub Discussions](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/discussions)
- Share your use cases and experiences
- Help other users troubleshoot issues
- Provide feedback on proposals

## Development Setup

### Prerequisites

**Required:**

- **Node.js:** v18+ (LTS recommended)
- **npm:** v9+
- **Git:** 2.x+
- **TypeScript:** 5.x+ (installed via npm)

**Optional:**

- **Visual Studio Code** (recommended editor)
- **Azure CLI** (for testing generated templates)
- **Azure subscription** (for testing deployments)

### Initial Setup

**1. Fork and clone:**

```bash
# Fork the repository on GitHub first
# Then clone your fork
git clone https://github.com/YOUR-USERNAME/azure-marketplace-generator.git
cd azure-marketplace-generator
```

**2. Add upstream remote:**

```bash
git remote add upstream https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator.git
git fetch upstream
```

**3. Install dependencies:**

```bash
npm install
```

**4. Build the project:**

```bash
npm run build
```

**5. Link for local testing:**

```bash
npm link
```

**6. Verify installation:**

```bash
azmp --version
azmp --help
```

### Development Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run watch` | Build in watch mode (auto-rebuild) |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Fix code style issues |
| `npm run format` | Format code with Prettier |
| `npm run clean` | Remove build artifacts |

## Project Structure

```
azure-marketplace-generator/
├── src/                          # Source code
│   ├── cli/                     # CLI implementation
│   │   ├── index.ts            # CLI entry point
│   │   └── commands/           # Command implementations
│   │       ├── create.ts       # Create command
│   │       ├── validate.ts     # Validate command
│   │       └── package.ts      # Package command
│   ├── core/                    # Core functionality
│   │   ├── generator.ts        # Template generator
│   │   ├── validator.ts        # Template validator
│   │   └── plugin-loader.ts    # Plugin system
│   ├── templates/               # Built-in templates
│   │   └── storage/            # Storage template
│   ├── types/                   # TypeScript types
│   └── utils/                   # Utility functions
├── tests/                       # Test suites
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── fixtures/               # Test data
├── docs/                        # Documentation
├── azure-deployment/            # Sample deployment
└── package.json                # Package configuration
```

### Key Files

- **`src/cli/index.ts`** - CLI entry point, command registration
- **`src/core/generator.ts`** - Core template generation logic
- **`src/core/validator.ts`** - ARM template validation
- **`src/core/plugin-loader.ts`** - Plugin loading and management
- **`src/types/index.ts`** - TypeScript type definitions
- **`package.json`** - Dependencies and scripts
- **`tsconfig.json`** - TypeScript configuration

## Development Workflow

### Branch Strategy

We use Git Flow with the following branches:

| Branch | Purpose | Protected |
|--------|---------|-----------|
| **`main`** | Production releases | ✅ Yes |
| **`develop`** | Integration branch | ✅ Yes |
| **`feature/*`** | New features | ❌ No |
| **`fix/*`** | Bug fixes | ❌ No |
| **`docs/*`** | Documentation updates | ❌ No |
| **`refactor/*`** | Code refactoring | ❌ No |
| **`test/*`** | Test improvements | ❌ No |

### Creating a Branch

**For new features:**

```bash
git checkout develop
git pull upstream develop
git checkout -b feature/my-feature-name
```

**For bug fixes:**

```bash
git checkout develop
git pull upstream develop
git checkout -b fix/issue-123-description
```

**For documentation:**

```bash
git checkout develop
git pull upstream develop
git checkout -b docs/update-readme
```

### Making Changes

**1. Write code:**

- Follow [coding standards](#coding-standards)
- Add tests for new functionality
- Update documentation as needed

**2. Test locally:**

```bash
# Run tests
npm test

# Check code style
npm run lint

# Build project
npm run build

# Test CLI locally
azmp create storage --name Test --publisher Test
```

**3. Commit changes:**

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```bash
git add .
git commit -m "feat: add virtual machine template support"
```

**Commit message format:**

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting)
- **refactor:** Code refactoring
- **test:** Test additions or changes
- **chore:** Build process or tooling changes
- **perf:** Performance improvements

**Examples:**

```bash
# Feature
git commit -m "feat(cli): add validate command with ARM template validation"

# Bug fix
git commit -m "fix(generator): resolve handlebars template compilation error"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(api)!: change plugin interface signature

BREAKING CHANGE: Plugin.generate() now requires options parameter"
```

## Coding Standards

### TypeScript Guidelines

**1. Type safety:**

```typescript
// ✅ DO: Use explicit types
function createResource(name: string, location: string): Resource {
  return { name, location };
}

// ❌ DON'T: Use 'any'
function createResource(name: any, location: any): any {
  return { name, location };
}
```

**2. Interfaces over type aliases:**

```typescript
// ✅ DO: Use interfaces for objects
interface GeneratorOptions {
  name: string;
  publisher: string;
  outputDir?: string;
}

// ❌ DON'T: Use type for simple objects (use for unions/intersections)
type GeneratorOptions = {
  name: string;
  publisher: string;
};
```

**3. Null safety:**

```typescript
// ✅ DO: Handle nullable values
function getConfig(name: string): Config | undefined {
  return configs.find(c => c.name === name);
}

const config = getConfig('default');
if (config) {
  console.log(config.value);
}

// ❌ DON'T: Assume values exist
const config = getConfig('default');
console.log(config.value); // Potential error
```

### Code Style

We use **ESLint** and **Prettier** for consistent formatting.

**Run linting:**

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run format      # Format with Prettier
```

**Key rules:**

- **Indentation:** 2 spaces
- **Quotes:** Single quotes (`'`)
- **Semicolons:** Required
- **Line length:** 100 characters
- **Trailing commas:** Always
- **Arrow functions:** Prefer arrow functions for callbacks

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Classes** | PascalCase | `TemplateGenerator` |
| **Interfaces** | PascalCase | `GeneratorOptions` |
| **Functions** | camelCase | `generateTemplate()` |
| **Variables** | camelCase | `outputDirectory` |
| **Constants** | UPPER_SNAKE_CASE | `DEFAULT_LOCATION` |
| **Files** | kebab-case | `template-generator.ts` |
| **Test files** | Same as source + `.test.ts` | `generator.test.ts` |

### Error Handling

**1. Use custom error types:**

```typescript
// ✅ DO: Create specific error classes
export class ValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

throw new ValidationError('Invalid template', { field: 'name' });
```

**2. Handle errors gracefully:**

```typescript
// ✅ DO: Catch and handle errors
try {
  await generateTemplate(options);
} catch (error) {
  if (error instanceof ValidationError) {
    logger.error('Validation failed:', error.message);
    process.exit(1);
  }
  throw error;
}
```

## Testing Requirements

All new code must include tests. We aim for **>80% coverage**.

### Test Structure

```
tests/
├── unit/                       # Unit tests
│   ├── core/
│   │   ├── generator.test.ts
│   │   └── validator.test.ts
│   └── cli/
│       └── commands.test.ts
├── integration/                # Integration tests
│   ├── cli.test.ts
│   └── plugin-system.test.ts
└── fixtures/                   # Test data
    ├── templates/
    └── configs/
```

### Writing Tests

**1. Unit tests:**

```typescript
import { describe, it, expect } from '@jest/globals';
import { TemplateGenerator } from '../../src/core/generator';

describe('TemplateGenerator', () => {
  describe('generate', () => {
    it('should generate valid ARM template', () => {
      const generator = new TemplateGenerator();
      const result = generator.generate({
        name: 'test',
        publisher: 'TestPublisher',
      });

      expect(result).toBeDefined();
      expect(result.resources).toHaveLength(1);
    });

    it('should throw error for invalid name', () => {
      const generator = new TemplateGenerator();
      
      expect(() => {
        generator.generate({ name: '', publisher: 'Test' });
      }).toThrow(ValidationError);
    });
  });
});
```

**2. Integration tests:**

```typescript
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

describe('CLI Integration', () => {
  it('should create storage template', () => {
    const output = execSync(
      'azmp create storage --name TestStorage --publisher TestPub --output-dir ./test-output',
      { encoding: 'utf-8' }
    );

    expect(output).toContain('Template generated successfully');
    expect(existsSync('./test-output/mainTemplate.json')).toBe(true);
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Watch mode (auto-run on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- generator.test.ts

# Specific test suite
npm test -- --testNamePattern="TemplateGenerator"
```

### Coverage Requirements

- **Overall:** 80%+
- **Core functionality:** 90%+
- **New features:** 100%
- **Bug fixes:** Include regression test

## Documentation

### Code Documentation

**1. JSDoc comments for public APIs:**

```typescript
/**
 * Generates an Azure Marketplace template
 * 
 * @param options - Generation options
 * @param options.name - Resource name
 * @param options.publisher - Publisher name
 * @returns Generated template object
 * @throws {ValidationError} If options are invalid
 * 
 * @example
 * ```typescript
 * const generator = new TemplateGenerator();
 * const template = generator.generate({
 *   name: 'MyStorage',
 *   publisher: 'Acme Corp'
 * });
 * ```
 */
export function generate(options: GeneratorOptions): Template {
  // Implementation
}
```

**2. README sections:**

When adding new features, update:

- **Features** section
- **Usage** examples
- **API Reference**
- **Configuration** options

**3. Wiki pages:**

For significant features, create or update wiki pages:

- [Getting Started](Getting-Started) - Quick start examples
- [Plugin Development](Plugin-Development) - Plugin APIs
- [API Reference](API-Reference) - TypeScript APIs
- [FAQ](FAQ) - Common questions

### Changelog

Update `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [Unreleased]

### Added
- Virtual machine template support (#123)
- New validation rules for networking (#124)

### Changed
- Improved error messages in CLI (#125)

### Fixed
- Bug in template generation with special characters (#126)
```

## Pull Request Process

### Before Submitting

**Checklist:**

- [ ] Code follows style guidelines
- [ ] All tests pass (`npm test`)
- [ ] Coverage meets requirements (80%+)
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No merge conflicts with `develop`
- [ ] Self-review completed

### Submitting PR

**1. Push branch:**

```bash
git push origin feature/my-feature-name
```

**2. Create PR on GitHub:**

- **Base:** `develop` (not `main`)
- **Title:** Clear, descriptive (follows commit conventions)
- **Description:** Use PR template

**3. PR template:**

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation update

## Related Issues
Closes #123
Related to #124

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] All tests pass

## Screenshots (if applicable)
[Add screenshots for UI changes]
```

### Review Process

**1. Automated checks:**

- ✅ Tests pass (GitHub Actions)
- ✅ Linting passes
- ✅ Coverage threshold met
- ✅ No merge conflicts

**2. Manual review:**

- Code quality and readability
- Test coverage and quality
- Documentation completeness
- Breaking changes identified
- Security considerations

**3. Feedback:**

- Address review comments
- Push updates to same branch
- Request re-review when ready

**4. Approval and merge:**

- Requires **1 approval** from maintainer
- Must pass all checks
- Merged via **squash merge**
- Branch automatically deleted

## Release Process

Releases follow [Semantic Versioning](https://semver.org/).

### Version Numbers

**Format:** `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes (backward compatible)

### Release Workflow

**1. Prepare release (maintainers only):**

```bash
# Update version
npm version minor  # or major/patch

# Update CHANGELOG.md
# Move [Unreleased] to new version

git add .
git commit -m "chore: prepare release v3.2.0"
git push origin develop
```

**2. Create release PR:**

```bash
# Merge develop to main
git checkout main
git merge develop
git push origin main
```

**3. Create GitHub release:**

- Tag: `v3.2.0`
- Title: `v3.2.0 - Release Name`
- Description: From CHANGELOG.md

**4. Publish to NPM:**

```bash
npm publish
```

## Community

### Getting Help

- **GitHub Discussions:** [Ask questions](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/discussions)
- **GitHub Issues:** [Report bugs](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/issues)
- **Email:** contact@hoiltd.com

### Recognition

Contributors are recognized in:

- **README.md** - Contributors section
- **Release notes** - Acknowledging contributions
- **GitHub** - Contributor badge

### License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** Your efforts make Azure Marketplace Generator better for everyone. 🎉

