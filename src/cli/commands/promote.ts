import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ArmTtkValidator } from '../../core/validator';

export const promoteCommand = new Command('promote')
  .description('Promote validated package to marketplace-ready version')
  .argument('<package-path>', 'Path to validated package')
  .argument('<version>', 'Version number (e.g., 1.2.0)')
  .option('--force', 'Overwrite existing marketplace version')
  .action(async (packagePath: string, version: string, _options: any) => {
    console.log(chalk.blue('🚀 Azure Marketplace Generator - Package Promotion'));
    console.log(chalk.blue('='.repeat(60)));
    console.log(chalk.gray('  Package path:'), packagePath);
    console.log(chalk.gray('  Target version:'), version);
    
    try {
      const validator = new ArmTtkValidator();
      
      // Verify package exists
      if (!await fs.pathExists(packagePath)) {
        throw new Error(`Package path not found: ${packagePath}`);
      }

      // Check if marketplace version already exists
      const marketplacePath = path.join(process.cwd(), 'packages', 'marketplace', `v${version}`);
      if (await fs.pathExists(marketplacePath) && !options.force) {
        throw new Error(`Marketplace version v${version} already exists. Use --force to overwrite.`);
      }

      console.log(chalk.blue('\n📦 Promoting package to marketplace...'));
      
      const finalPath = await validator.promoteToMarketplace(packagePath, version);
      
      console.log(chalk.green('\n✅ Package promotion successful!'));
      console.log(chalk.blue('📍 Marketplace location:'), finalPath);
      console.log(chalk.blue('📋 Package contents:'));
      
      // List package contents
      const contents = await fs.readdir(finalPath);
      contents.forEach(file => {
        console.log(chalk.gray(`   • ${file}`));
      });
      
      console.log(chalk.green('\n🎯 Package is ready for Azure Marketplace submission!'));
      console.log(chalk.blue('💡 Next steps:'));
      console.log(chalk.blue('   1. Test the package in a development environment'));
      console.log(chalk.blue('   2. Upload to Partner Center'));
      console.log(chalk.blue('   3. Submit for certification'));

    } catch (error: any) {
      console.error(chalk.red('\n❌ Package promotion failed:'), error.message);
      process.exit(1);
    }
  });

export const listPackagesCommand = new Command('list-packages')
  .description('List all packages in the packages directory')
  .option('--type <type>', 'Filter by package type: generated, validated, marketplace, archive')
  .action(async (_options: any) => {
    console.log(chalk.blue('📦 Azure Marketplace Generator - Package Inventory'));
    console.log(chalk.blue('='.repeat(60)));
    
    try {
      const packagesDir = path.join(process.cwd(), 'packages');
      
      if (!await fs.pathExists(packagesDir)) {
        console.log(chalk.yellow('📁 No packages directory found. Generate a package first.'));
        return;
      }

      const packageTypes = ['generated', 'validated', 'marketplace', 'archive'];
      const filterType = options.type;
      
      for (const type of packageTypes) {
        if (filterType && filterType !== type) continue;
        
        const typeDir = path.join(packagesDir, type);
        if (await fs.pathExists(typeDir)) {
          const packages = await fs.readdir(typeDir);
          
          if (packages.length > 0) {
            console.log(chalk.blue(`\n📂 ${type.toUpperCase()} packages:`));
            
            for (const pkg of packages) {
              const pkgPath = path.join(typeDir, pkg);
              const stats = await fs.stat(pkgPath);
              
              if (stats.isDirectory()) {
                console.log(chalk.gray(`   📁 ${pkg}`));
                
                // Show metadata if available
                const metadataFile = path.join(pkgPath, 'metadata.json');
                if (await fs.pathExists(metadataFile)) {
                  try {
                    const metadata = await fs.readJSON(metadataFile);
                    console.log(chalk.gray(`      📅 Created: ${metadata.generated || 'Unknown'}`));
                    if (metadata.version) {
                      console.log(chalk.gray(`      🏷️  Version: ${metadata.version}`));
                    }
                  } catch {
                    // Ignore metadata parsing errors
                  }
                }
              } else {
                console.log(chalk.gray(`   📄 ${pkg} (${stats.size} bytes)`));
              }
            }
          } else {
            console.log(chalk.gray(`\n📂 ${type.toUpperCase()}: (empty)`));
          }
        }
      }
      
      console.log(chalk.blue('\n💡 Package management commands:'));
      console.log(chalk.blue('   azmp validate <path> --save-report    # Validate and save report'));
      console.log(chalk.blue('   azmp promote <path> <version>         # Promote to marketplace'));
      console.log(chalk.blue('   azmp list-packages --type validated   # List specific type'));

    } catch (error: any) {
      console.error(chalk.red('❌ Error listing packages:'), error.message);
      process.exit(1);
    }
  });