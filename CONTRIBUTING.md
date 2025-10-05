# Contributing to Azure Marketplace Generator

Thank you for your interest in contributing to the Azure Marketplace Generator! This document provides guidelines and information for contributors.

## 🚨 Production Standards - READ FIRST

**This project enforces strict production-level standards. All contributions must meet these requirements:**

- ✅ Pass all ARM-TTK security validations
- ✅ No hardcoded secrets or credentials
- ✅ TypeScript strict mode compliance
- ✅ Comprehensive testing coverage
- ✅ Clean, professional documentation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PowerShell (for ARM-TTK validation)
- Git

### Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Validate templates: `npm run validate`

## Development Workflow

### Before Any Changes

**ALWAYS run the production standards checklist:**

```bash
# Security audit
npm audit --audit-level moderate

# Code quality
npm run lint
npm run test
tsc --noEmit

# ARM template validation
npm run validate
```

### Making Changes

1. **Create a feature branch**: `git checkout -b feature/your-feature`
2. **Follow naming conventions**: Use kebab-case for files and folders
3. **Write tests**: All new functionality must have tests
4. **Update documentation**: Keep README and docs current
5. **Validate templates**: All ARM templates must pass ARM-TTK

### Commit Standards

Use conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions/updates
- `refactor:` - Code refactoring

Example: `feat: add storage lifecycle management template`

## Code Standards

### TypeScript
- Strict mode enabled
- No `any` types
- Proper error handling
- Comprehensive type definitions

### ARM Templates
- Must pass all ARM-TTK security tests
- Use parameter files for configuration
- Follow Azure naming conventions
- Include proper descriptions and metadata

### Testing
- Unit tests for all business logic
- Integration tests for CLI commands
- ARM template validation tests
- Security scanning tests

## Pull Request Process

1. **Run full validation**: Ensure all tests and validations pass
2. **Clean commits**: Squash related commits into logical units
3. **Update documentation**: Reflect any changes made
4. **Security review**: Manual check for sensitive data
5. **Create PR**: Use the provided template

### PR Requirements

- [ ] All tests pass
- [ ] ARM-TTK validation passes
- [ ] No security vulnerabilities
- [ ] Documentation updated
- [ ] Clean commit history

## Security Guidelines

### Sensitive Data
- **Never commit secrets** - Use Azure Key Vault references
- **Review before commit** - Check for accidentally included credentials
- **Use .gitignore** - Ensure sensitive files are excluded

### ARM Templates
- Reference Key Vault for secrets
- Use managed identities where possible
- Follow least privilege principle
- Validate with ARM-TTK security tests

## Project Structure

```
azure-marketplace-generator/
├── packages/marketplace/
│   ├── azure-storage/          # Storage-related templates
│   └── azure-webapps/          # Web app templates
├── src/                        # CLI source code
├── docs/                       # Documentation
└── test-output/               # Generated files (not committed)
```

## Getting Help

- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Follow SECURITY.md for vulnerability reports

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Remember: This is a production-level project. Quality and security are non-negotiable.**
