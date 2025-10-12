#!/bin/bash

# Generate an oversized ARM template (100+ MB)
# This script creates a template with thousands of resources to test size limits

cat > /home/msalsouri/Projects/azure-marketplace-generator/test-fixtures/arm-templates/oversized/generate-large-template.js << 'EOF'
const fs = require('fs');
const path = require('path');

function generateLargeTemplate() {
  const template = {
    "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
    "contentVersion": "1.0.0.0",
    "parameters": {
      "location": {
        "type": "string",
        "defaultValue": "[resourceGroup().location]"
      }
    },
    "variables": {},
    "resources": [],
    "outputs": {}
  };

  // Generate 10,000 storage accounts to create a large template
  for (let i = 0; i < 10000; i++) {
    const resource = {
      "type": "Microsoft.Storage/storageAccounts",
      "apiVersion": "2021-04-01",
      "name": `[concat('storage', padLeft(${i}, 5, '0'))]`,
      "location": "[parameters('location')]",
      "sku": {
        "name": "Standard_LRS"
      },
      "kind": "StorageV2",
      "properties": {
        "accessTier": "Hot",
        "allowBlobPublicAccess": false,
        "allowSharedKeyAccess": true,
        "encryption": {
          "services": {
            "blob": {
              "enabled": true
            },
            "file": {
              "enabled": true
            }
          },
          "keySource": "Microsoft.Storage"
        },
        "minimumTlsVersion": "TLS1_2",
        "supportsHttpsTrafficOnly": true,
        "metadata": {
          "description": `Generated storage account ${i} for testing oversized templates`,
          "testData": "This is test data to make the template larger. ".repeat(100)
        }
      },
      "tags": {
        "Environment": "Test",
        "Purpose": "Load Testing",
        "Index": i.toString(),
        "LargeData": "x".repeat(1000) // Add padding to increase size
      }
    };

    template.resources.push(resource);

    // Add output for each storage account
    template.outputs[`storageAccount${i}Id`] = {
      "type": "string",
      "value": `[resourceId('Microsoft.Storage/storageAccounts', concat('storage', padLeft(${i}, 5, '0')))]`,
      "metadata": {
        "description": `Resource ID for storage account ${i}`,
        "testData": "Additional output data to increase template size. ".repeat(50)
      }
    };
  }

  return template;
}

console.log('Generating large ARM template...');
const largeTemplate = generateLargeTemplate();
const templatePath = path.join(__dirname, 'large-template.json');

fs.writeFileSync(templatePath, JSON.stringify(largeTemplate, null, 2));

const stats = fs.statSync(templatePath);
const fileSizeMB = stats.size / (1024 * 1024);

console.log(`Generated template: ${templatePath}`);
console.log(`File size: ${fileSizeMB.toFixed(2)} MB`);
console.log(`Resources: ${largeTemplate.resources.length}`);
console.log(`Outputs: ${Object.keys(largeTemplate.outputs).length}`);

if (fileSizeMB > 100) {
  console.log('✅ Successfully generated oversized template (>100MB)');
} else {
  console.log(`⚠️  Template size (${fileSizeMB.toFixed(2)}MB) is under 100MB target`);
}
EOF

# Make the script executable and run it
chmod +x /home/msalsouri/Projects/azure-marketplace-generator/test-fixtures/arm-templates/oversized/generate-large-template.js
cd /home/msalsouri/Projects/azure-marketplace-generator/test-fixtures/arm-templates/oversized
node generate-large-template.js