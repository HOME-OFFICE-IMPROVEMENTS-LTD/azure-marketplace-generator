#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Fix common markdown linting issues
 */
function fixMarkdownLinting(filePath) {
  console.log(`Fixing markdown linting for: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let fixed = false;
  
  // Fix MD022: Headings should be surrounded by blank lines
  content = content.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');
  content = content.replace(/(#{1,6}\s[^\n]*)\n([^\n#])/g, '$1\n\n$2');
  
  // Fix MD032: Lists should be surrounded by blank lines
  content = content.replace(/([^\n])\n(-\s)/g, '$1\n\n$2');
  content = content.replace(/(-\s[^\n]*)\n([^\n-])/g, '$1\n\n$2');
  
  // Fix MD031: Fenced code blocks should be surrounded by blank lines
  content = content.replace(/([^\n])\n(```)/g, '$1\n\n$2');
  content = content.replace(/(```[^\n]*)\n([^\n`])/g, '$1\n\n$2');
  
  // Fix MD047: Files should end with a single newline character
  content = content.replace(/\n*$/, '\n');
  
  // Fix MD036: Don't use emphasis as heading (simple cases)
  content = content.replace(/^\*([^*]+)\*$/gm, '#### $1');
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed: ${filePath}`);
}

/**
 * Find and fix all markdown files
 */
function findAndFixMarkdownFiles(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(directory, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      findAndFixMarkdownFiles(fullPath);
    } else if (file.isFile() && file.name.endsWith('.md')) {
      fixMarkdownLinting(fullPath);
    }
  }
}

// Main execution
console.log('🔧 Starting markdown linting fixes...');
const projectRoot = path.join(__dirname, '..');
findAndFixMarkdownFiles(projectRoot);
console.log('✅ Markdown linting fixes completed!');