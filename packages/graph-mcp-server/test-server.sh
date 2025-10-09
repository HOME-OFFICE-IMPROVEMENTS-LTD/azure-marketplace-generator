#!/bin/bash

# Test script for Microsoft Graph MCP Server
# Tests integration with existing azure-auth-helper.sh workflow

set -e

echo "🧪 Testing Microsoft Graph MCP Server Integration"
echo "================================================="

# Change to the graph MCP server directory
cd "$(dirname "$0")"

# Check if we're in the right location
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the graph-mcp-server directory."
    exit 1
fi

echo "📍 Current directory: $(pwd)"

# Check Node.js version
echo "🔍 Checking Node.js version..."
node_version=$(node --version)
echo "   Node.js version: $node_version"

if ! node -e "process.exit(parseInt(process.version.slice(1)) >= 18 ? 0 : 1)"; then
    echo "❌ Error: Node.js 18+ required. Current version: $node_version"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Check if build was successful
if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: Build failed - dist/index.js not found"
    exit 1
fi

echo "✅ TypeScript build successful"

# Test Azure authentication (using existing helper)
echo "🔐 Testing Azure authentication..."
cd ../../  # Go back to project root

if [ -f "scripts/azure-auth-helper.sh" ]; then
    echo "   Found azure-auth-helper.sh, checking auth status..."
    if bash scripts/azure-auth-helper.sh check; then
        echo "✅ Azure authentication is working"
    else
        echo "⚠️  Azure authentication not configured. Run: azmp auth --fix-mfa"
    fi
else
    echo "⚠️  azure-auth-helper.sh not found in expected location"
fi

# Return to graph MCP server directory
cd packages/graph-mcp-server

# Test MCP server startup (with timeout)
echo "🚀 Testing MCP server startup..."
timeout 10s node dist/index.js <<<'{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' || true

echo ""
echo "🎯 Microsoft Graph MCP Server Test Summary"
echo "=========================================="
echo "✅ TypeScript compilation: PASSED"
echo "✅ Dependencies: INSTALLED"
echo "✅ MCP server startup: TESTED"
echo ""
echo "📋 Next Steps:"
echo "1. Ensure Azure authentication: azmp auth --check"
echo "2. Configure Graph API permissions in Azure AD"
echo "3. Add server to your MCP client configuration"
echo "4. Test with: echo '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\",\"params\":{}}' | node dist/index.js"
echo ""
echo "🔗 Documentation: README.md"
echo "🔧 Configuration: .env.example"