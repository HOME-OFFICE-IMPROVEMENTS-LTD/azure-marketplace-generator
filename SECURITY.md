# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

### 🚨 Security Issues - DO NOT Create Public Issues

If you discover a security vulnerability, please **DO NOT** create a public GitHub issue.

### How to Report

**Email**: Send security reports to the repository maintainer via GitHub.

**Include the following information**:

1. **Type of issue** (buffer overflow, SQL injection, cross-site scripting, etc.)
2. **Full paths** of source file(s) related to the manifestation of the issue
3. **Location** of the affected source code (tag/branch/commit or direct URL)
4. **Special configuration** required to reproduce the issue
5. **Step-by-step instructions** to reproduce the issue
6. **Proof-of-concept** or exploit code (if possible)
7. **Impact** of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial response**: Within 48 hours
- **Status updates**: Every 72 hours until resolution
- **Resolution timeline**: Depends on severity and complexity

### Disclosure Policy

- **Coordinated disclosure**: We practice coordinated disclosure
- **Timeline**: 90 days from initial report (may be extended for complex issues)
- **Credit**: Security researchers will be credited (if desired)

## Security Best Practices

### For Contributors

- Never commit secrets, API keys, or credentials
- Use Azure Key Vault for sensitive configuration
- Follow the principle of least privilege
- Validate all inputs and sanitize outputs
- Keep dependencies up to date

### For Users

- Always use the latest version
- Regularly audit your ARM templates with ARM-TTK
- Use managed identities where possible
- Follow Azure security baselines
- Monitor for unusual activity

## Security Features

This project includes:

- **ARM-TTK Integration**: Validates all ARM templates for security best practices
- **Dependency Scanning**: Regular checks for known vulnerabilities
- **Secrets Detection**: Prevents accidental commit of sensitive data
- **Security Testing**: Automated security validation in CI/CD pipeline

## Contact

For non-security related issues, please use GitHub Issues.

For security concerns, follow the reporting process outlined above.
