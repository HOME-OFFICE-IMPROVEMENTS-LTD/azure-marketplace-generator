import * as path from 'path';
import * as fs from 'fs-extra';

export class AppConfig {
  private static instance: AppConfig;

  private constructor() {}

  public static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  public static getTemplatesDir(): string {
    return path.join(__dirname, '..', 'templates');
  }

  public static getPackagesDir(): string {
    return './packages';
  }

  public static getArmTtkPath(): string {
    // Allow custom ARM-TTK location via environment variable (useful for bundled packages)
    if (process.env.AZMP_ARM_TTK_PATH) {
      return process.env.AZMP_ARM_TTK_PATH;
    }
    
    // Resolve ARM-TTK path relative to project root, not current working directory
    // This ensures validation works regardless of where the command is executed from
    const projectRoot = path.resolve(__dirname, '..', '..');
    return path.join(projectRoot, 'tools', 'arm-ttk', 'arm-ttk', 'Test-AzTemplate.ps1');
  }

  public static async initializeDirectories(): Promise<void> {
    const packagesDir = this.getPackagesDir();
    await fs.ensureDir(packagesDir);
  }

  public static async validateConfiguration(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check ARM-TTK path
    const armTtkPath = this.getArmTtkPath();
    if (!await fs.pathExists(armTtkPath)) {
      errors.push(`ARM-TTK not found at: ${armTtkPath}`);
    }

    // Check templates directory
    const templatesDir = this.getTemplatesDir();
    if (!await fs.pathExists(templatesDir)) {
      errors.push(`Templates directory not found: ${templatesDir}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}