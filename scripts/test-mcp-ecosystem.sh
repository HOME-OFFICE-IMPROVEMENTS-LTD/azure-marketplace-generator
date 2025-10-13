#!/bin/bash

# MCP Ecosystem Test Script
echo "🧪 Running MCP Ecosystem Comprehensive Test"
echo "============================================="

cd /home/msalsouri/Projects/azure-marketplace-generator

# Test CLI with automation
{
  echo "4"  # Generate Integration Report
  echo "8"  # Exit
} | npx tsx src/tools/mcp-ecosystem-cli.ts

echo ""
echo "✅ Test completed! Check the generated report below:"
echo ""

# Display the generated report
if [ -f "mcp-ecosystem-report.json" ]; then
  echo "📊 MCP Ecosystem Report:"
  echo "========================"
  cat mcp-ecosystem-report.json | jq . 2>/dev/null || cat mcp-ecosystem-report.json
else
  echo "❌ Report not found"
fi