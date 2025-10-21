#!/bin/bash
# Auto-install ARM-TTK for Azure Marketplace Generator
# This script downloads and sets up ARM-TTK locally

set -e

echo "🔧 Installing ARM-TTK for Azure Marketplace Generator..."

# Create tools directory
TOOLS_DIR="./tools"
ARM_TTK_DIR="$TOOLS_DIR/arm-ttk"

mkdir -p "$TOOLS_DIR"

# Check if ARM-TTK already exists
if [ -d "$ARM_TTK_DIR" ]; then
    echo "✅ ARM-TTK already installed at $ARM_TTK_DIR"
    echo "🔍 Checking version..."
    if [ -f "$ARM_TTK_DIR/arm-ttk/Test-AzTemplate.ps1" ]; then
        echo "✅ ARM-TTK Test-AzTemplate.ps1 found"
        echo "📍 ARM-TTK Path: $(pwd)/$ARM_TTK_DIR/arm-ttk/Test-AzTemplate.ps1"
        
        # Update .env file
        if [ -f ".env" ]; then
            # Remove old ARM-TTK path if exists
            sed -i '/AZMP_ARM_TTK_PATH=/d' .env
            # Add new path
            echo "AZMP_ARM_TTK_PATH=$(pwd)/$ARM_TTK_DIR/arm-ttk/Test-AzTemplate.ps1" >> .env
            echo "✅ Updated .env with ARM-TTK path"
        else
            echo "⚠️  .env file not found. Create one from .env.example"
        fi
        
        exit 0
    fi
fi

echo "📥 Downloading ARM-TTK from Microsoft GitHub..."

# Download ARM-TTK from official Microsoft repository
cd "$TOOLS_DIR"
git clone https://github.com/Azure/arm-ttk.git

# Verify installation
if [ -f "arm-ttk/arm-ttk/Test-AzTemplate.ps1" ]; then
    echo "✅ ARM-TTK successfully installed!"
    FULL_PATH="$(pwd)/arm-ttk/arm-ttk/Test-AzTemplate.ps1"
    echo "📍 ARM-TTK Path: $FULL_PATH"
    
    # Update .env file
    cd ..
    if [ -f ".env" ]; then
        # Remove old ARM-TTK path if exists
        sed -i '/AZMP_ARM_TTK_PATH=/d' .env
        # Add new path
        echo "AZMP_ARM_TTK_PATH=$(pwd)/tools/arm-ttk/arm-ttk/Test-AzTemplate.ps1" >> .env
        echo "✅ Updated .env with ARM-TTK path"
    else
        echo "⚠️  .env file not found. Create one from .env.example"
        echo "📝 Add this line to your .env file:"
        echo "AZMP_ARM_TTK_PATH=$(pwd)/tools/arm-ttk/arm-ttk/Test-AzTemplate.ps1"
    fi
    
    echo ""
    echo "🎉 ARM-TTK installation complete!"
    echo "💡 You can now run: npx azmp validate <template-path>"
    echo ""
else
    echo "❌ ARM-TTK installation failed!"
    echo "Please check your internet connection and try again."
    exit 1
fi