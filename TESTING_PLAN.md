# Comprehensive Testing Plan v3.0.0

## Azure Marketplace Generator - Storage-Only Core

## Overview

This document outlines the complete testing strategy before tagging v3.0.0 and creating the first stable release.

---

## 1. Unit Tests ✅

**Status**: PASSING (78/78)

### Coverage Areas

- ✅ Template generation (basic.test.ts)
- ✅ ARM template validation (validator.test.ts, arm-validation.test.ts)
- ✅ Package creation (package-creation.test.ts)
- ✅ Security validation (security-validation.test.ts)

### Run Command

```bash
npm test
```

---

## 2. CLI Integration Tests

### 2.1 Help & Documentation

```bash
# Test help system
node dist/cli/index.js --help
node dist/cli/index.js create --help
node dist/cli/index.js validate --help
node dist/cli/index.js package --help

# Verify all flags documented
node dist/cli/index.js --version
```

**Expected Outcomes**:

- Clear help text displayed
- All options documented
- Version matches package.json (2.1.0)

### 2.2 Create Command

```bash
# Test interactive mode
node dist/cli/index.js create

# Test with flags
node dist/cli/index.js create \
  --publisher "HOI-Test" \
  --name "test-storage-app" \
  --output "./test-cli-output"

# Test config file mode
node dist/cli/index.js create --config ./test-config.json
```

**Expected Outcomes**:

- Creates mainTemplate.json
- Creates createUiDefinition.json
- Creates viewDefinition.json
- Files are valid JSON
- No console errors

### 2.3 Validate Command

```bash
# Validate generated templates
node dist/cli/index.js validate ./test-cli-output

# Test with ARM-TTK
node dist/cli/index.js validate ./test-cli-output --arm-ttk

# Test invalid template
node dist/cli/index.js validate ./invalid-path
```

**Expected Outcomes**:

- Reports validation success/failure correctly
- ARM-TTK integration works (if PowerShell available)
- Meaningful error messages for invalid paths

### 2.4 Package Command

```bash
# Create marketplace package
node dist/cli/index.js package \
  ./test-cli-output \
  --output ./test-package.zip

# Verify package contents
unzip -l ./test-package.zip
```

**Expected Outcomes**:

- Creates valid .zip file
- Contains all 3 required files
- File structure correct for Partner Center

### 2.5 Error Handling

```bash
# Test missing required params
node dist/cli/index.js create --output ./test

# Test invalid paths
node dist/cli/index.js validate /invalid/path

# Test package without templates
node dist/cli/index.js package ./empty-dir
```

**Expected Outcomes**:

- Graceful error messages
- No stack traces exposed to users
- Helpful suggestions provided

---

## 3. Configuration File Tests

### 3.1 Config File Generation

```bash
# Create sample config
cat > azmp.config.json << 'EOF'
{
  "publisher": "HOI-Config-Test",
  "name": "config-storage-app",
  "output": "./config-test-output"
}
EOF

# Use config
node dist/cli/index.js create --config azmp.config.json
```

### 3.2 Config Validation

```bash
# Test invalid JSON
echo "{ invalid json }" > bad-config.json
node dist/cli/index.js create --config bad-config.json

# Test missing required fields
echo '{"publisher": "test"}' > incomplete-config.json
node dist/cli/index.js create --config incomplete-config.json
```

**Expected Outcomes**:

- Valid configs load correctly
- Invalid JSON rejected with clear errors
- Missing fields reported specifically

---

## 4. Template Quality Tests

### 4.1 ARM Template Syntax

```bash
# Validate generated ARM template
az deployment group validate \
  --resource-group test-rg \
  --template-file ./test-cli-output/mainTemplate.json \
  --parameters location=eastus storageAccountName=teststorage123
```

### 4.2 CreateUIDefinition Validation

```bash
# Test in Azure Portal sandbox
# Manual: https://portal.azure.com/#blade/Microsoft_Azure_CreateUIDef/SandboxBlade
```

### 4.3 ViewDefinition Validation

- Verify JSON schema compliance
- Check all view elements render correctly
- Test metrics and commands sections

---

## 5. Security Tests

### 5.1 Input Validation

```bash
# Test SQL injection attempts
node dist/cli/index.js create --name "'; DROP TABLE--"

# Test path traversal
node dist/cli/index.js create --output "../../../etc/passwd"

# Test script injection
node dist/cli/index.js create --publisher "<script>alert('xss')</script>"
```

**Expected Outcomes**:

- All malicious inputs sanitized
- No security vulnerabilities exposed
- Safe error messages

### 5.2 Dependency Audit

```bash
npm audit
npm audit fix
```

**Expected Outcomes**:

- Zero critical vulnerabilities
- Zero high vulnerabilities
- Document any medium/low issues

---

## 6. Performance Tests

### 6.1 Generation Speed

```bash
time node dist/cli/index.js create \
  --publisher "Perf-Test" \
  --name "perf-test-app" \
  --output ./perf-test
```

**Expected**: < 2 seconds

### 6.2 Package Creation Speed

```bash
time node dist/cli/index.js package \
  ./perf-test \
  --output ./perf-package.zip
```

**Expected**: < 1 second

### 6.3 Memory Usage

```bash
/usr/bin/time -v node dist/cli/index.js create \
  --publisher "Memory-Test" \
  --name "memory-test-app" \
  --output ./memory-test 2>&1 | grep "Maximum resident"
```

**Expected**: < 100MB

---

## 7. Cross-Platform Tests

### 7.1 Linux (Current) ✅

```bash
uname -a
node --version
npm test
node dist/cli/index.js create --publisher Test --name test-linux --output ./test-linux
```

### 7.2 macOS (If available)

```bash
# Same tests as Linux
```

### 7.3 Windows (If available)

```powershell
# PowerShell tests
node dist/cli/index.js create --publisher Test --name test-windows --output .\test-windows
```

---

## 8. Real-World Deployment Test

### 8.1 Full Marketplace Workflow

```bash
# 1. Generate templates
node dist/cli/index.js create \
  --publisher "HOI-LTD" \
  --name "production-storage-app" \
  --output ./production-test

# 2. Validate templates
node dist/cli/index.js validate ./production-test --arm-ttk

# 3. Package for Partner Center
node dist/cli/index.js package \
  ./production-test \
  --output ./production-package.zip

# 4. Deploy to test Azure subscription
az deployment group create \
  --resource-group marketplace-test-rg \
  --template-file ./production-test/mainTemplate.json \
  --parameters location=eastus storageAccountName=prodtest$(date +%s)

# 5. Clean up
az group delete --name marketplace-test-rg --yes --no-wait
```

**Expected Outcomes**:

- Templates generate successfully
- Validation passes all checks
- Package created correctly
- Azure deployment succeeds
- Resources created as expected

---

## 9. Documentation Tests

### 9.1 README Accuracy

- [ ] All commands work as documented
- [ ] Installation steps are correct
- [ ] Examples produce expected output
- [ ] Links are not broken

### 9.2 API Documentation

- [ ] All CLI flags documented
- [ ] Configuration options documented
- [ ] Error codes documented

---

## 10. Release Checklist

### Pre-Release

- [ ] All unit tests passing (78/78)
- [ ] All integration tests passing
- [ ] No security vulnerabilities
- [ ] Documentation updated
- [ ] CHANGELOG.md created
- [ ] Version bumped to 3.0.0

### Release Process

- [ ] Merge storage-only → develop
- [ ] Create release branch: release/v3.0.0
- [ ] Final testing on release branch
- [ ] Tag: `git tag -a v3.0.0 -m "Release v3.0.0: Production-ready storage AMA generator"`
- [ ] Push tags: `git push origin v3.0.0`
- [ ] Create GitHub Release with notes
- [ ] Publish to npm (optional)

### Post-Release

- [ ] Merge release → main
- [ ] Update documentation site
- [ ] Announce release
- [ ] Create v3.0.1 milestone for bug fixes

---

## Test Execution Log

| Test Category | Status | Date | Notes |
|--------------|--------|------|-------|
| Unit Tests | ✅ PASS | 2025-10-21 | 78/78 tests passing |
| CLI Help | ⏳ PENDING | - | - |
| Create Command | ⏳ PENDING | - | - |
| Validate Command | ⏳ PENDING | - | - |
| Package Command | ⏳ PENDING | - | - |
| Error Handling | ⏳ PENDING | - | - |
| Config Files | ⏳ PENDING | - | - |
| Template Quality | ⏳ PENDING | - | - |
| Security | ⏳ PENDING | - | - |
| Performance | ⏳ PENDING | - | - |
| Real-World Deploy | ⏳ PENDING | - | - |
| Documentation | ⏳ PENDING | - | - |

---

## Success Criteria

✅ **All tests must pass** before v3.0.0 release
✅ **Zero critical/high security vulnerabilities**
✅ **Documentation matches implementation**
✅ **At least one successful real-world deployment**
✅ **Performance meets benchmarks**

---

## Notes

- ARM-TTK requires PowerShell - may not work on all platforms
- Real Azure deployment requires active subscription and credentials
- Some tests may be environment-specific

---

**Last Updated**: 2025-10-21
**Version**: 3.0.0-testing
**Branch**: storage-only
