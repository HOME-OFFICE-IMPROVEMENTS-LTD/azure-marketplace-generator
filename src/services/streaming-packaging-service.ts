import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import chalk from 'chalk';
import { createReadStream, createWriteStream } from 'fs';
import { Transform, pipeline, Readable } from 'stream';
import { promisify } from 'util';
import * as archiver from 'archiver';

const pipelineAsync = promisify(pipeline);

export interface StreamingPackageOptions {
  maxMemoryUsage: number; // bytes
  chunkSize: number; // bytes
  enableMemoryMonitoring: boolean;
  tempDir?: string;
}

export interface MemorySnapshot {
  timestamp: number;
  rss: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  operation: string;
}

export interface PackageStreamMetrics {
  fileSize: number;
  processedChunks: number;
  memorySnapshots: MemorySnapshot[];
  duration: number;
  peakMemoryUsage: number;
  averageMemoryUsage: number;
  compressionRatio?: number;
}

export class StreamingPackagingService {
  private options: StreamingPackageOptions;
  private memorySnapshots: MemorySnapshot[] = [];

  constructor(options: Partial<StreamingPackageOptions> = {}) {
    this.options = {
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB default
      chunkSize: 1024 * 1024, // 1MB chunks
      enableMemoryMonitoring: true,
      tempDir: path.join(process.cwd(), '.temp', 'streaming'),
      ...options
    };
  }

  /**
   * Analyze large template using streaming JSON parser with chunked processing
   */
  async analyzeTemplateStreaming(templatePath: string): Promise<{
    resourceCount: number;
    parameterCount: number;
    outputCount: number;
    templateSize: number;
    complexity: number;
    metrics: PackageStreamMetrics;
  }> {
    console.log(chalk.blue('🔍 Analyzing template with streaming parser...'));

    const startTime = Date.now();
    const stats = await fs.stat(templatePath);
    const templateSize = stats.size;

    console.log(chalk.gray(`  Template size: ${(templateSize / 1024 / 1024).toFixed(2)}MB`));

    if (templateSize > this.options.maxMemoryUsage) {
      console.warn(chalk.yellow(`⚠️  Large template detected (${(templateSize / 1024 / 1024).toFixed(2)}MB)`));
      console.warn(chalk.yellow('   Using streaming analysis to manage memory usage...'));
    }

    this.takeMemorySnapshot('analysis-start');

    let resourceCount = 0;
    let parameterCount = 0;
    let outputCount = 0;
    let processedChunks = 0;

    try {
      // Read and parse template in chunks to avoid memory overload
      const templateContent = await this.readFileInChunks(templatePath);
      const template = JSON.parse(templateContent);

      // Count resources
      if (template.resources && Array.isArray(template.resources)) {
        resourceCount = template.resources.length;
      }

      // Count parameters
      if (template.parameters && typeof template.parameters === 'object') {
        parameterCount = Object.keys(template.parameters).length;
      }

      // Count outputs
      if (template.outputs && typeof template.outputs === 'object') {
        outputCount = Object.keys(template.outputs).length;
      }

      processedChunks = Math.ceil(templateSize / this.options.chunkSize);

      this.takeMemorySnapshot('analysis-end');

      const duration = Date.now() - startTime;
      const complexity = this.calculateComplexity(resourceCount, parameterCount, outputCount);

      const metrics: PackageStreamMetrics = {
        fileSize: templateSize,
        processedChunks,
        memorySnapshots: [...this.memorySnapshots],
        duration,
        peakMemoryUsage: this.getPeakMemoryUsage(),
        averageMemoryUsage: this.getAverageMemoryUsage()
      };

      console.log(chalk.green('✅ Streaming analysis completed'));
      console.log(chalk.blue(`  Resources: ${resourceCount}`));
      console.log(chalk.blue(`  Parameters: ${parameterCount}`));
      console.log(chalk.blue(`  Outputs: ${outputCount}`));
      console.log(chalk.blue(`  Complexity: ${complexity}`));
      console.log(chalk.blue(`  Duration: ${duration}ms`));
      console.log(chalk.blue(`  Peak Memory: ${(metrics.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB`));

      return {
        resourceCount,
        parameterCount,
        outputCount,
        templateSize,
        complexity,
        metrics
      };

    } catch (error: any) {
      console.error(chalk.red('❌ Streaming analysis failed:'), error.message);
      throw error;
    } finally {
      this.memorySnapshots = []; // Clear snapshots
    }
  }

  /**
   * Create package archive using streaming compression
   */
  async createPackageArchive(
    sourcePath: string,
    outputPath: string,
    compressionLevel: number = 6
  ): Promise<PackageStreamMetrics> {
    console.log(chalk.blue('📦 Creating package archive with streaming compression...'));

    const startTime = Date.now();
    this.takeMemorySnapshot('compression-start');

    await fs.ensureDir(path.dirname(outputPath));
    await fs.ensureDir(this.options.tempDir!);

    const sourceStats = await fs.stat(sourcePath);
    console.log(chalk.gray(`  Source size: ${(sourceStats.size / 1024 / 1024).toFixed(2)}MB`));

    let processedChunks = 0;

    try {
      // Create archive using archiver with streaming
      const output = createWriteStream(outputPath);
      const archive = archiver.create('zip', {
        zlib: { level: compressionLevel }
      });

      // Pipe archive data to the file
      archive.pipe(output);

      // Add files to archive with streaming
      await this.addDirectoryToArchive(archive, sourcePath, '');

      processedChunks = await this.countChunksInDirectory(sourcePath);

      // Finalize the archive
      await archive.finalize();

      // Wait for output stream to finish
      await new Promise<void>((resolve, reject) => {
        output.on('close', () => resolve());
        output.on('error', reject);
      });

      this.takeMemorySnapshot('compression-end');

      const outputStats = await fs.stat(outputPath);
      const duration = Date.now() - startTime;
      const compressionRatio = sourceStats.size / outputStats.size;

      const metrics: PackageStreamMetrics = {
        fileSize: sourceStats.size,
        processedChunks,
        memorySnapshots: [...this.memorySnapshots],
        duration,
        peakMemoryUsage: this.getPeakMemoryUsage(),
        averageMemoryUsage: this.getAverageMemoryUsage(),
        compressionRatio
      };

      console.log(chalk.green('✅ Streaming compression completed'));
      console.log(chalk.blue(`  Original size: ${(sourceStats.size / 1024 / 1024).toFixed(2)}MB`));
      console.log(chalk.blue(`  Compressed size: ${(outputStats.size / 1024 / 1024).toFixed(2)}MB`));
      console.log(chalk.blue(`  Compression ratio: ${compressionRatio.toFixed(2)}x`));
      console.log(chalk.blue(`  Duration: ${duration}ms`));
      console.log(chalk.blue(`  Peak Memory: ${(metrics.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB`));

      return metrics;

    } catch (error: any) {
      console.error(chalk.red('❌ Streaming compression failed:'), error.message);
      throw error;
    } finally {
      this.memorySnapshots = [];
      await fs.remove(this.options.tempDir!); // Cleanup temp directory
    }
  }

  /**
   * Optimize large template by streaming processing
   */
  async optimizeTemplateStreaming(
    inputPath: string,
    outputPath: string
  ): Promise<PackageStreamMetrics> {
    console.log(chalk.blue('⚡ Optimizing template with streaming processing...'));

    const startTime = Date.now();
    this.takeMemorySnapshot('optimization-start');

    const inputStats = await fs.stat(inputPath);
    console.log(chalk.gray(`  Input size: ${(inputStats.size / 1024 / 1024).toFixed(2)}MB`));

    let processedChunks = 0;
    const optimizations = {
      removedComments: 0,
      compactedSpacing: 0,
      optimizedExpressions: 0
    };

    try {
      // Read template in chunks
      const templateContent = await this.readFileInChunks(inputPath);
      const template = JSON.parse(templateContent);

      // Optimize template structure
      const optimizedTemplate = this.optimizeTemplateStructure(template, optimizations);

      processedChunks = Math.ceil(inputStats.size / this.options.chunkSize);

      // Write optimized template
      await fs.writeJSON(outputPath, optimizedTemplate, { spaces: 2 });

      this.takeMemorySnapshot('optimization-end');

      const outputStats = await fs.stat(outputPath);
      const duration = Date.now() - startTime;
      const compressionRatio = inputStats.size / outputStats.size;

      const metrics: PackageStreamMetrics = {
        fileSize: inputStats.size,
        processedChunks,
        memorySnapshots: [...this.memorySnapshots],
        duration,
        peakMemoryUsage: this.getPeakMemoryUsage(),
        averageMemoryUsage: this.getAverageMemoryUsage(),
        compressionRatio
      };

      console.log(chalk.green('✅ Streaming optimization completed'));
      console.log(chalk.blue(`  Removed comments: ${optimizations.removedComments}`));
      console.log(chalk.blue(`  Compacted spacing: ${optimizations.compactedSpacing}`));
      console.log(chalk.blue(`  Optimized expressions: ${optimizations.optimizedExpressions}`));
      console.log(chalk.blue(`  Size reduction: ${((1 - compressionRatio) * 100).toFixed(1)}%`));
      console.log(chalk.blue(`  Duration: ${duration}ms`));

      return metrics;

    } catch (error: any) {
      console.error(chalk.red('❌ Streaming optimization failed:'), error.message);
      throw error;
    } finally {
      this.memorySnapshots = [];
    }
  }

  /**
   * Read file in chunks to manage memory usage
   */
  private async readFileInChunks(filePath: string): Promise<string> {
    const chunks: Buffer[] = [];
    let chunkCount = 0;

    return new Promise((resolve, reject) => {
      const stream = createReadStream(filePath, {
        highWaterMark: this.options.chunkSize
      });

      stream.on('data', (chunk: string | Buffer) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, 'utf8'));
        chunkCount++;

        if (chunkCount % 10 === 0) {
          this.takeMemorySnapshot(`read-chunk-${chunkCount}`);
          this.checkMemoryUsage();
        }
      });

      stream.on('end', () => {
        const content = Buffer.concat(chunks).toString('utf8');
        resolve(content);
      });

      stream.on('error', reject);
    });
  }

  /**
   * Add directory to archive recursively
   */
  private async addDirectoryToArchive(
    archive: archiver.Archiver,
    dirPath: string,
    relativePath: string
  ): Promise<void> {
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const entryName = path.join(relativePath, item);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        await this.addDirectoryToArchive(archive, fullPath, entryName);
      } else {
        // Add file with streaming
        const stream = createReadStream(fullPath);
        archive.append(stream, { name: entryName });

        this.takeMemorySnapshot(`archive-file-${item}`);
      }
    }
  }

  /**
   * Count chunks in directory for metrics
   */
  private async countChunksInDirectory(dirPath: string): Promise<number> {
    const items = await fs.readdir(dirPath);
    let totalChunks = 0;

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        totalChunks += await this.countChunksInDirectory(fullPath);
      } else {
        totalChunks += Math.ceil(stats.size / this.options.chunkSize);
      }
    }

    return totalChunks;
  }

  /**
   * Optimize template structure
   */
  private optimizeTemplateStructure(template: any, optimizations: any): any {
    if (typeof template !== 'object' || template === null) return template;

    const optimized: any = {};

    for (const [key, value] of Object.entries(template)) {
      if (typeof value === 'string') {
        let optimizedValue = value;

        // Remove comments
        if (optimizedValue.includes('//') || optimizedValue.includes('/*')) {
          optimizedValue = this.removeComments(optimizedValue);
          optimizations.removedComments++;
        }

        // Compact spacing
        if (optimizedValue.includes('  ')) {
          optimizedValue = optimizedValue.replace(/\s+/g, ' ').trim();
          optimizations.compactedSpacing++;
        }

        optimized[key] = optimizedValue;
      } else if (typeof value === 'object') {
        optimized[key] = this.optimizeTemplateStructure(value, optimizations);
        optimizations.optimizedExpressions++;
      } else {
        optimized[key] = value;
      }
    }

    return optimized;
  }

  /**
   * Remove comments from string content
   */
  private removeComments(content: string): string {
    // Remove single-line comments
    content = content.replace(/\/\/.*$/gm, '');

    // Remove multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');

    return content;
  }

  /**
   * Calculate template complexity
   */
  private calculateComplexity(resources: number, parameters: number, outputs: number): number {
    return Math.floor(
      (resources * 1.0) +
      (parameters * 0.5) +
      (outputs * 0.3)
    );
  }

  /**
   * Take memory snapshot for monitoring
   */
  private takeMemorySnapshot(operation: string): void {
    if (!this.options.enableMemoryMonitoring) return;

    const memory = process.memoryUsage();
    this.memorySnapshots.push({
      timestamp: Date.now(),
      rss: memory.rss,
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external,
      operation
    });
  }

  /**
   * Check memory usage and warn if approaching limits
   */
  private checkMemoryUsage(): void {
    const memory = process.memoryUsage();

    if (memory.rss > this.options.maxMemoryUsage) {
      console.warn(chalk.yellow(`⚠️  Memory usage high: ${(memory.rss / 1024 / 1024).toFixed(2)}MB`));
      console.warn(chalk.yellow('   Consider reducing chunk size or enabling more aggressive streaming'));
    }
  }

  /**
   * Get peak memory usage from snapshots
   */
  private getPeakMemoryUsage(): number {
    if (this.memorySnapshots.length === 0) return 0;
    return Math.max(...this.memorySnapshots.map(s => s.rss));
  }

  /**
   * Get average memory usage from snapshots
   */
  private getAverageMemoryUsage(): number {
    if (this.memorySnapshots.length === 0) return 0;
    const total = this.memorySnapshots.reduce((sum, s) => sum + s.rss, 0);
    return total / this.memorySnapshots.length;
  }

  /**
   * Generate memory usage report
   */
  generateMemoryReport(): {
    snapshots: MemorySnapshot[];
    peak: number;
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    const peak = this.getPeakMemoryUsage();
    const average = this.getAverageMemoryUsage();

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (this.memorySnapshots.length > 1) {
      const first = this.memorySnapshots[0].rss;
      const last = this.memorySnapshots[this.memorySnapshots.length - 1].rss;
      const diff = last - first;
      const threshold = first * 0.1; // 10% threshold

      if (diff > threshold) trend = 'increasing';
      else if (diff < -threshold) trend = 'decreasing';
    }

    return {
      snapshots: [...this.memorySnapshots],
      peak,
      average,
      trend
    };
  }

  /**
   * Cleanup and reset state
   */
  async cleanup(): Promise<void> {
    this.memorySnapshots = [];

    try {
      await fs.remove(this.options.tempDir!);
    } catch (error) {
      // Ignore cleanup errors
    }

    console.log(chalk.blue('🧹 Streaming service cleanup completed'));
  }
}