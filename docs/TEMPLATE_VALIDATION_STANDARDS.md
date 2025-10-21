# ARM Template Validation Standards

## Overview

This document defines the validation standards for ARM templates to ensure consistency, security, and compliance with Microsoft best practices.

## 🎯 **Critical Rule: UI-ARM Template Validation Consistency**

**RULE**: All parameter validations in `createUiDefinition.json` **MUST** match validations in `mainTemplate.json`.

### Why This Matters

- **UI validation** only applies when users deploy through Azure Portal
- **ARM template validation** applies to ALL deployment methods (Portal, CLI, API, PowerShell)
- Mismatched validation allows users to bypass UI constraints, causing deployment failures

### Common Validation Mismatches

| Scenario | Risk | Example |
|----------|------|---------|
| UI has regex, ARM has no minLength/maxLength | Users can deploy invalid values via CLI | UI: `{3,11}` chars, ARM: no minLength |
| UI has stricter limits than ARM | Inconsistent user experience | UI: max 24, ARM: max 64 |
| ARM has limits not enforced in UI | Silent failures in Portal | ARM: minLength 3, UI: no validation |

---

## 📋 **Standard 1: String Parameter Validation**

### Requirements

**All string parameters** (except those with `allowedValues`) **MUST** have:

1. ✅ `minLength` - Minimum character length
2. ✅ `maxLength` - Maximum character length
3. ✅ `metadata.description` - Clear description
4. ✅ Matching regex in createUiDefinition.json

### Example: Storage Account Name Prefix

#### ❌ **INCORRECT** (Missing minLength)

```json
// mainTemplate.json
"storageAccountNamePrefix": {
    "type": "string",
    "maxLength": 11,
    "metadata": {
        "description": "Prefix for the storage account name"
    }
}
```

```json
// createUiDefinition.json
"storageAccountPrefix": {
    "type": "Microsoft.Common.TextBox",
    "constraints": {
        "regex": "^[a-z0-9]{3,11}$"
    }
}
```

**Problem**: UI enforces 3-11 chars, but ARM template only enforces max 11. Users can deploy with 1-2 char prefixes via CLI.

#### ✅ **CORRECT** (Consistent validation)

```json
// mainTemplate.json
"storageAccountNamePrefix": {
    "type": "string",
    "minLength": 3,
    "maxLength": 11,
    "metadata": {
        "description": "Prefix for the storage account name"
    }
}
```

```json
// createUiDefinition.json
"storageAccountPrefix": {
    "type": "Microsoft.Common.TextBox",
    "constraints": {
        "regex": "^[a-z0-9]{3,11}$",
        "validationMessage": "Prefix must be 3-11 characters, lowercase letters and numbers only"
    }
}
```

---

## 📋 **Standard 2: Integer Parameter Validation**

### Requirements

**All integer parameters with bounded ranges MUST have:**

1. ✅ `minValue` - Minimum value
2. ✅ `maxValue` - Maximum value  
3. ✅ `metadata.description` - Clear description

**Note**: Microsoft's ARM-TTK test requires BOTH minValue and maxValue together (not just one).

### Example: Soft Delete Retention Days

#### ✅ **CORRECT**

```json
"blobSoftDeleteDays": {
    "type": "int",
    "minValue": 1,
    "maxValue": 365,
    "defaultValue": 7,
    "metadata": {
        "description": "Number of days to retain deleted blobs (1-365)"
    }
}
```

---

## 📋 **Standard 3: Boolean Parameter Validation**

### Requirements

**All boolean parameters MUST have:**

1. ✅ `defaultValue` - Explicit default (true or false)
2. ✅ `metadata.description` - Clear description including default behavior

### Example: HTTPS Traffic Only

#### ✅ **CORRECT**

```json
"supportsHttpsTrafficOnly": {
    "type": "bool",
    "defaultValue": true,
    "metadata": {
        "description": "Allows HTTPS traffic only to storage service. Recommended: true"
    }
}
```

---

## 📋 **Standard 4: Parameters with allowedValues**

### Requirements

**Parameters using `allowedValues` constraint:**

1. ✅ Do NOT need minLength/maxLength (constrained by list)
2. ✅ MUST have `defaultValue` (unless deployment requires selection)
3. ✅ MUST have matching dropdown/radio in createUiDefinition.json
4. ✅ UI options MUST match ARM allowedValues exactly

### Example: TLS Version

#### ✅ **CORRECT**

```json
// mainTemplate.json
"minimumTlsVersion": {
    "type": "string",
    "defaultValue": "TLS1_2",
    "allowedValues": [
        "TLS1_0",
        "TLS1_1",
        "TLS1_2"
    ],
    "metadata": {
        "description": "Minimum TLS version permitted on requests to storage"
    }
}
```

```json
// createUiDefinition.json
{
    "name": "minimumTlsVersion",
    "type": "Microsoft.Common.DropDown",
    "defaultValue": "TLS 1.2 (Recommended)",
    "constraints": {
        "allowedValues": [
            {
                "label": "TLS 1.0 (Legacy)",
                "value": "TLS1_0"
            },
            {
                "label": "TLS 1.1 (Legacy)",
                "value": "TLS1_1"
            },
            {
                "label": "TLS 1.2 (Recommended)",
                "value": "TLS1_2"
            }
        ]
    }
}
```

---

## 📋 **Standard 5: Resource Naming Standards**

### Azure Storage Account Names

**Rules** (Azure-enforced):
- Length: 3-24 characters
- Characters: lowercase letters and numbers only
- Globally unique

**Implementation**:

```json
"storageAccountNamePrefix": {
    "type": "string",
    "minLength": 3,
    "maxLength": 11,
    "metadata": {
        "description": "Prefix for the storage account name (3-11 chars to allow uniqueString suffix)"
    }
}
```

**Why maxLength: 11?**
- Prefix: 11 chars max
- uniqueString(): 13 chars
- Total: 11 + 13 = 24 chars (Azure's limit)

---

## 🔍 **Validation Checklist**

### Pre-Release Validation

Before releasing any template changes, verify:

- [ ] **All string parameters** have minLength + maxLength
- [ ] **All integer parameters** have minValue + maxValue (both required)
- [ ] **All boolean parameters** have defaultValue
- [ ] **All parameters** have metadata.description
- [ ] **UI validation regexes** match ARM template constraints
- [ ] **UI dropdown/radio options** match ARM allowedValues
- [ ] **Storage account name prefixes** account for uniqueString() suffix (11 + 13 = 24)
- [ ] **Run ARM-TTK** validation tests
- [ ] **Test deployment** via CLI to bypass UI validation
- [ ] **Test deployment** via Portal to verify UI validation

---

## 🛠️ **Automated Validation**

### Validator Requirements

The `validator.ts` should check:

1. ✅ Every string parameter without allowedValues has minLength + maxLength
2. ✅ Every integer parameter has minValue + maxValue (or neither)
3. ✅ Every boolean parameter has defaultValue
4. ✅ All parameters have metadata.description
5. ✅ createUiDefinition.json regex patterns match ARM template constraints

---

## 📚 **References**

### Microsoft Official Documentation

1. **Parameters in ARM Templates**  
   https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/parameters

2. **Length Constraints**  
   https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/parameters#length-constraints

3. **ARM Template Best Practices**  
   https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/best-practices#parameters

4. **ARM Template Test Cases**  
   https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/template-test-cases#min-and-max-values-are-numbers

### Key Quotes from Microsoft Docs

> **"You can specify minimum and maximum lengths for string and array parameters."**  
> — Microsoft Learn: Parameters in ARM templates

> **"When you define a parameter with minValue and maxValue, specify them as numbers. You must use minValue and maxValue as a pair or the test fails."**  
> — Microsoft Learn: ARM template test cases

---

## 🚨 **Common Mistakes to Avoid**

### 1. ❌ Fixing UI validation without checking ARM template

**Wrong Approach**: Fix the parameter file during testing  
**Correct Approach**: Fix the source template first, then regenerate

### 2. ❌ Using maxLength without minLength

**Why It's Wrong**: Allows empty/too-short values via CLI  
**Correct**: Always use both together

### 3. ❌ Mismatched UI and ARM validations

**Why It's Wrong**: Inconsistent behavior between Portal and CLI  
**Correct**: Keep UI regex and ARM constraints synchronized

### 4. ❌ No validation on string parameters

**Why It's Wrong**: Users can input ANY value, breaking Azure resource requirements  
**Correct**: Add constraints based on Azure resource requirements

---

## 📝 **Change Log**

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2025-10-21 | 1.0.0 | Initial validation standards document | System |

---

## ✅ **Approval Process**

1. All template changes MUST pass this validation checklist
2. Validator tests MUST include these standards
3. Documentation MUST be updated when standards change
4. Azure live testing MUST validate parameter constraints
