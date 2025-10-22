# Frequently Asked Questions (FAQ)

Common questions and answers about the Azure Marketplace Generator.

## General Questions

### What is Azure Marketplace Generator?

Azure Marketplace Generator (`azmp`) is a CLI tool that generates ARM templates for Azure Managed Applications. It simplifies the creation of production-ready templates with enterprise-grade security, comprehensive UI definitions, and management views.

### Who is it for?

- **Publishers** - Create Azure Marketplace offers quickly
- **Developers** - Generate templates for internal use
- **Enterprises** - Standardize Azure deployments
- **Consultants** - Accelerate client projects

### Is it free?

Yes! Azure Marketplace Generator is open-source and free to use under the MIT license. You can use it for commercial and non-commercial projects.

### What resource types are supported?

Out of the box:
- ✅ **Storage Accounts** - Fully supported

With plugins:
- ✅ **Virtual Machines** - [@hoiltd/azmp-plugin-vm](https://www.npmjs.com/package/@hoiltd/azmp-plugin-vm)
- 🔄 **SQL Server** - Coming soon
- 🔄 **Cosmos DB** - Coming soon

You can also [create custom plugins](Plugin-Development) for any Azure resource.

## Installation & Setup

### How do I install it?

**Global installation (recommended):**

```bash
npm install -g @hoiltd/azure-marketplace-generator
```

**From source:**

```bash
git clone https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator.git
cd azure-marketplace-generator
npm install
npm run build
npm link
```

### What are the prerequisites?

- **Node.js 18+** - [Download](https://nodejs.org/)
- **PowerShell** - For ARM-TTK validation
- **Git** - For cloning and version control

### How do I install ARM-TTK?

ARM-TTK is required for template validation:

```bash
npm run install-arm-ttk
```

Or manually:

```bash
git clone https://github.com/Azure/arm-ttk.git
```

### `azmp` command not found

After installing, if the command isn't found:

1. **Check npm global directory:**
   ```bash
   npm config get prefix
   ```

2. **Add to PATH:**
   ```bash
   # Linux/Mac
   export PATH="$PATH:$(npm config get prefix)/bin"
   
   # Windows PowerShell
   $env:PATH += ";$(npm config get prefix)"
   ```

3. **Or reinstall:**
   ```bash
   npm install -g @hoiltd/azure-marketplace-generator --force
   ```

## Usage Questions

### How do I create my first template?

Simple! Just run:

```bash
azmp create storage --name "MyStorage" --publisher "My Company"
```

This generates all required files in `./output/`.

### What files are generated?

For every project:
- `mainTemplate.json` - Main ARM template
- `createUiDefinition.json` - Azure Portal UI
- `viewDefinition.json` - Management view
- `nestedtemplates/` - Nested templates (if applicable)

### How do I validate templates?

```bash
azmp validate ./output
```

This runs Azure's official ARM Template Test Toolkit (ARM-TTK).

### How do I package for deployment?

```bash
azmp package ./output
```

Creates `app.zip` ready for Azure Marketplace submission.

### Can I customize the output?

Yes! Three ways:

1. **Command-line options:**
   ```bash
   azmp create storage --name "MyApp" --output ./custom-dir
   ```

2. **Configuration file (`azmp.config.json`):**
   ```json
   {
     "outputDir": "./templates",
     "publisher": "My Company",
     "templateDefaults": {
       "location": "eastus"
     }
   }
   ```

3. **Plugins:** Create [custom plugins](Plugin-Development) for full control

## Plugin Questions

### What are plugins?

Plugins extend the generator with new resource types and functionality. They're npm packages that follow the `@scope/azmp-plugin-name` naming convention.

### How do I install a plugin?

```bash
# Install globally
npm install -g @hoiltd/azmp-plugin-vm

# Add to configuration
azmp plugin add @hoiltd/azmp-plugin-vm
```

Or add to `azmp.config.json`:

```json
{
  "plugins": ["@hoiltd/azmp-plugin-vm"]
}
```

### How do I create a plugin?

See the [Plugin Development Guide](Plugin-Development) for complete instructions. Quick start:

1. Create npm package: `@mycompany/azmp-plugin-myresource`
2. Export plugin object with required properties
3. Include Handlebars templates
4. Publish to npm
5. Use in projects!

### Where can I find plugins?

- **Official:** [GitHub Organization](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD)
- **NPM:** Search for `azmp-plugin`
- **Community:** [Plugin Registry](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/wiki/Plugin-Registry) (coming soon)

### Can I use multiple plugins?

Yes! Configure multiple plugins in `azmp.config.json`:

```json
{
  "plugins": [
    "@hoiltd/azmp-plugin-vm",
    "@mycompany/azmp-plugin-sql",
    "@mycompany/azmp-plugin-cosmosdb"
  ]
}
```

## Template Questions

### Are templates Azure Marketplace ready?

Yes! Generated templates include:
- ✅ Required ARM template structure
- ✅ CreateUiDefinition with proper controls
- ✅ ViewDefinition for management
- ✅ Security best practices
- ✅ Validation with ARM-TTK

### What security features are included?

All templates include:
- 🔒 Encryption at rest
- 🔒 Encryption in transit (HTTPS/TLS)
- 🔒 Network security (firewalls)
- 🔒 Access control (RBAC)
- 🔒 Audit logging
- 🔒 Threat protection (optional)

See [Security Features](Security-Features) for details.

### Can I modify generated templates?

Absolutely! Generated templates are yours to modify. They're standard ARM templates with clean, readable JSON.

**Tip:** Consider creating a plugin for reusable customizations.

### How do I add custom parameters?

Edit `mainTemplate.json` and add to the `parameters` section:

```json
{
  "parameters": {
    "customParameter": {
      "type": "string",
      "defaultValue": "default-value",
      "metadata": {
        "description": "My custom parameter"
      }
    }
  }
}
```

Then update `createUiDefinition.json` to add UI controls.

### Can I nest templates?

Yes! Generated templates support nested templates. They're placed in the `nestedtemplates/` directory.

## Validation Questions

### Validation fails with ARM-TTK errors

Common solutions:

1. **Update ARM-TTK:**
   ```bash
   npm run install-arm-ttk
   ```

2. **Check PowerShell:**
   ```bash
   pwsh --version
   ```

3. **Skip specific tests:**
   ```bash
   azmp validate ./output --skip-tests "test-name"
   ```

### Which tests can I skip?

You can skip any ARM-TTK test, but we recommend only skipping:
- `outputs-must-not-contain-secrets` (if using secure outputs properly)
- `secure-params-in-nested-deployments` (if not using nested)

Configure in `azmp.config.json`:

```json
{
  "validation": {
    "skipTests": [
      "outputs-must-not-contain-secrets"
    ]
  }
}
```

### Validation is slow

ARM-TTK can be slow for large templates. Options:

1. **Run specific tests only:**
   ```bash
   azmp validate ./output --only-tests "deployments-have-unique-names"
   ```

2. **Skip validation during development:**
   ```bash
   azmp package ./output --no-validate
   ```

3. **Use verbose mode to see progress:**
   ```bash
   azmp validate ./output --verbose
   ```

## Deployment Questions

### How do I deploy templates?

Using Azure CLI:

```bash
# Create resource group
az group create --name myRG --location eastus

# Deploy template
az deployment group create \
  --resource-group myRG \
  --template-file ./output/mainTemplate.json \
  --parameters ./output/parameters.json
```

Using PowerShell:

```powershell
# Create resource group
New-AzResourceGroup -Name myRG -Location eastus

# Deploy template
New-AzResourceGroupDeployment `
  -ResourceGroupName myRG `
  -TemplateFile ./output/mainTemplate.json `
  -TemplateParameterFile ./output/parameters.json
```

### How do I submit to Azure Marketplace?

1. **Create Partner Center account**
2. **Prepare technical configuration**
3. **Upload `app.zip` package**
4. **Complete offer details**
5. **Submit for certification**

See [Azure Marketplace documentation](https://docs.microsoft.com/azure/marketplace/) for details.

### Can I use for internal deployments?

Yes! You don't need to publish to Azure Marketplace. Use generated templates for:
- Internal IT deployments
- Customer-specific solutions
- Development/testing environments
- CI/CD pipelines

## Troubleshooting

### Templates not generating

1. **Check Node.js version:**
   ```bash
   node --version  # Should be 18+
   ```

2. **Check command syntax:**
   ```bash
   azmp create storage --name "Test" --publisher "Test"
   ```

3. **Enable verbose logging:**
   ```bash
   azmp create storage --name "Test" --publisher "Test" --verbose
   ```

### Plugins not loading

1. **Verify installation:**
   ```bash
   npm list -g @hoiltd/azmp-plugin-vm
   ```

2. **Check configuration:**
   ```bash
   azmp config show
   ```

3. **Check plugin exports:**
   ```bash
   node -e "console.log(require('@hoiltd/azmp-plugin-vm'))"
   ```

### Output directory not created

By default, output goes to `./output/`. Specify custom:

```bash
azmp create storage --name "Test" --publisher "Test" --output ./my-dir
```

Or set in config:

```json
{
  "outputDir": "./templates"
}
```

### Permission errors on Linux/Mac

If you get permission errors:

```bash
# Fix npm permissions
sudo chown -R $USER:$USER ~/.npm

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

## Performance Questions

### How fast is generation?

Very fast! Typical times:
- **Storage template:** < 1 second
- **VM template:** < 2 seconds
- **Complex nested:** < 5 seconds

### Does it work offline?

Mostly yes:
- ✅ Template generation - Offline
- ✅ Plugin loading - Offline (if installed)
- ❌ Validation - Requires PowerShell and ARM-TTK
- ❌ Plugin installation - Requires internet

### Can I use in CI/CD?

Absolutely! Example GitHub Actions workflow:

```yaml
name: Generate Templates

on: [push]

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g @hoiltd/azure-marketplace-generator
      - run: azmp create storage --name "CI-Storage" --publisher "CI"
      - run: azmp validate ./output
      - run: azmp package ./output
      - uses: actions/upload-artifact@v3
        with:
          name: templates
          path: app.zip
```

## Contributing Questions

### How can I contribute?

We welcome contributions! Ways to help:

1. **Report bugs** - [GitHub Issues](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/issues)
2. **Suggest features** - [GitHub Discussions](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/discussions)
3. **Submit PRs** - Fix bugs or add features
4. **Create plugins** - Share with the community
5. **Improve docs** - Help others learn

See [Contributing Guide](Contributing) for details.

### I found a bug!

Please report it:

1. **Check existing issues** - Might be known
2. **Create new issue** - [GitHub Issues](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/issues/new)
3. **Include:**
   - Version (`azmp --version`)
   - Command used
   - Expected vs actual behavior
   - Error messages
   - OS and Node.js version

### I have a feature request!

We'd love to hear it:

1. **Check discussions** - Might be planned
2. **Start discussion** - [GitHub Discussions](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/discussions/new)
3. **Explain:**
   - Use case
   - Why it's valuable
   - Proposed implementation (optional)

### Can I submit a pull request?

Yes! Please:

1. **Fork** the repository
2. **Create branch** - `feature/my-feature` or `fix/bug-name`
3. **Write tests** - For new functionality
4. **Follow style** - ESLint and TypeScript
5. **Update docs** - If adding features
6. **Submit PR** - With clear description

See [Contributing Guide](Contributing) for full guidelines.

## Version & Compatibility

### What's the current version?

Check with:

```bash
azmp --version
```

Latest: **v3.1.0** (released December 2024)

### Is it stable?

Yes! v3.1.0 is production-ready:
- ✅ 119 passing tests
- ✅ Published to NPM
- ✅ Used in production
- ✅ Comprehensive documentation

### What's the release schedule?

We follow semantic versioning:
- **Major** (v4.0.0) - Breaking changes
- **Minor** (v3.2.0) - New features, backward compatible
- **Patch** (v3.1.1) - Bug fixes

Planned releases:
- **v3.2.0** - Q1 2025 (semver validation, eager loading)
- **v4.0.0** - Q2 2025 (API redesign, multi-resource)

### Will v3.x plugins work in v4.0.0?

We maintain backward compatibility when possible, but major versions may have breaking changes. We'll provide:
- Migration guide
- Deprecation warnings
- Compatibility layer (if feasible)

## Getting Help

### Where can I get help?

Multiple channels:

- **Documentation** - This wiki
- **GitHub Issues** - Bug reports
- **GitHub Discussions** - Questions and ideas
- **Stack Overflow** - Tag `azure-marketplace-generator`
- **Twitter** - [@HOILtd](https://twitter.com/HOILtd) (if available)

### Response time?

We aim for:
- **Critical bugs** - Within 24 hours
- **Questions** - Within 48 hours
- **Feature requests** - Reviewed weekly

### Professional support?

For enterprise support, consulting, or custom development:
- Email: [support@hoiltd.co.uk](mailto:support@hoiltd.co.uk)
- Website: [https://hoiltd.co.uk](https://hoiltd.co.uk)

## Still Have Questions?

Can't find your answer? Ask in:
- **[GitHub Discussions](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/azure-marketplace-generator/discussions)**
- **[Stack Overflow](https://stackoverflow.com/questions/tagged/azure-marketplace-generator)**

---

**Back to:** [Home](Home) | [Getting Started](Getting-Started)
