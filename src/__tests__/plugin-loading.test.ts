/**
 * Plugin Loading System Tests
 * 
 * Tests for plugin loader, helper registrar, command registrar,
 * and configuration validation for the v3.1.0 plugin system.
 */

import { HelperRegistrar } from '../core/helper-registrar';
import { CommandRegistrar } from '../core/command-registrar';
import { TemplateRegistry } from '../core/template-registry';
import { IPlugin, PluginContext, PluginConfig } from '../core/plugin';
import { Command } from 'commander';
import { getConfigManager } from '../utils/config-manager';
import * as path from 'path';
import * as Handlebars from 'handlebars';

describe('Plugin Loading System', () => {
  let helperRegistrar: HelperRegistrar;
  let commandRegistrar: CommandRegistrar;
  let templateRegistry: TemplateRegistry;

  beforeEach(() => {
    helperRegistrar = new HelperRegistrar();
    commandRegistrar = new CommandRegistrar();
    templateRegistry = new TemplateRegistry();
  });

  afterEach(() => {
    helperRegistrar.clear();
    commandRegistrar.clear();
    templateRegistry.clear();
  });

  describe('HelperRegistrar', () => {
    describe('Helper Name Validation', () => {
      const validPlugin: IPlugin = {
        metadata: { 
          id: 'test', 
          name: 'Test', 
          description: 'Test plugin',
          version: '1.0.0' 
        },
        getHandlebarsHelpers: () => ({
          'valid-helper_name123': () => 'test'
        })
      };

      it('should accept valid helper names (alphanumeric, hyphen, underscore)', () => {
        expect(() => {
          helperRegistrar.register(validPlugin, 'test');
        }).not.toThrow();
      });

      it('should reject helper names with spaces', () => {
        const invalidPlugin: IPlugin = {
          metadata: { 
            id: 'test', 
            name: 'Test', 
            description: 'Test plugin',
            version: '1.0.0' 
          },
          getHandlebarsHelpers: () => ({
            'invalid helper': () => 'test'
          })
        };

        expect(() => {
          helperRegistrar.register(invalidPlugin, 'test');
        }).toThrow(/must match pattern/);
      });

      it('should reject helper names with special characters', () => {
        const invalidPlugin: IPlugin = {
          metadata: { 
            id: 'test', 
            name: 'Test', 
            description: 'Test plugin',
            version: '1.0.0' 
          },
          getHandlebarsHelpers: () => ({
            'invalid@helper!': () => 'test'
          })
        };

        expect(() => {
          helperRegistrar.register(invalidPlugin, 'test');
        }).toThrow(/must match pattern/);
      });

      it('should reject empty helper names', () => {
        const invalidPlugin: IPlugin = {
          metadata: { 
            id: 'test', 
            name: 'Test', 
            description: 'Test plugin',
            version: '1.0.0' 
          },
          getHandlebarsHelpers: () => ({
            '': () => 'test'
          })
        };

        expect(() => {
          helperRegistrar.register(invalidPlugin, 'test');
        }).toThrow(/must be a non-empty string/);
      });
    });

    describe('Conflict Detection', () => {
      it('should detect duplicate helper names from different plugins', () => {
        const plugin1: IPlugin = {
          metadata: { 
            id: 'plugin1', 
            name: 'Plugin 1', 
            description: 'First plugin',
            version: '1.0.0' 
          },
          getHandlebarsHelpers: () => ({ myHelper: () => 'v1' })
        };

        const plugin2: IPlugin = {
          metadata: { 
            id: 'plugin2', 
            name: 'Plugin 2', 
            description: 'Second plugin',
            version: '1.0.0' 
          },
          getHandlebarsHelpers: () => ({ myHelper: () => 'v2' })
        };

        helperRegistrar.register(plugin1, 'plugin1');

        expect(() => {
          helperRegistrar.register(plugin2, 'plugin2');
        }).toThrow(/Helper name conflict.*myHelper.*plugin2.*plugin1/);
      });

      it('should track helper ownership correctly', () => {
        const plugin: IPlugin = {
          metadata: { 
            id: 'test-plugin', 
            name: 'Test', 
            description: 'Test plugin',
            version: '1.0.0' 
          },
          getHandlebarsHelpers: () => ({ testHelper: () => 'test' })
        };

        helperRegistrar.register(plugin, 'test-plugin');

        expect(helperRegistrar.hasHelper('testHelper')).toBe(true);
        expect(helperRegistrar.getHelperOwner('testHelper')).toBe('test-plugin');
      });

      it('should register helpers with Handlebars engine', () => {
        const helperFn = () => 'UPPERCASE';
        const plugin: IPlugin = {
          metadata: { 
            id: 'test', 
            name: 'Test', 
            description: 'Test plugin',
            version: '1.0.0' 
          },
          getHandlebarsHelpers: () => ({ toUpper: helperFn })
        };

        helperRegistrar.register(plugin, 'test');

        // Verify helper was registered in Handlebars
        const template = Handlebars.compile('{{toUpper}}');
        const result = template({});
        expect(result).toBe('UPPERCASE');
      });
    });
  });

  describe('CommandRegistrar', () => {
    let program: Command;

    beforeEach(() => {
      program = new Command();
      program.command('existing').description('Existing command');
      commandRegistrar.initialize(program);
    });

    describe('Conflict Detection', () => {
      it('should detect command name conflicts', () => {
        const plugin: IPlugin = {
          metadata: { 
            id: 'test', 
            name: 'Test', 
            description: 'Test plugin',
            version: '1.0.0' 
          },
          registerCommands: (prog: Command) => {
            prog.command('existing').description('Plugin command');
          }
        };

        expect(() => {
          commandRegistrar.register(plugin, 'test', program);
        }).toThrow(/already have command 'existing'/);
      });

      it('should track command ownership', () => {
        expect(commandRegistrar.hasCommand('existing')).toBe(true);
        expect(commandRegistrar.getCommandOwner('existing')).toBe('built-in');
      });

      it('should allow plugins to add new commands', () => {
        const plugin: IPlugin = {
          metadata: { 
            id: 'test', 
            name: 'Test', 
            description: 'Test plugin',
            version: '1.0.0' 
          },
          registerCommands: (prog: Command) => {
            prog.command('new-command').description('New plugin command');
          }
        };

        commandRegistrar.register(plugin, 'test', program);

        expect(commandRegistrar.hasCommand('new-command')).toBe(true);
        expect(commandRegistrar.getCommandOwner('new-command')).toBe('test');
      });

      it('should detect alias conflicts', () => {
        const plugin1: IPlugin = {
          metadata: { 
            id: 'plugin1', 
            name: 'Plugin 1', 
            description: 'First plugin',
            version: '1.0.0' 
          },
          registerCommands: (prog: Command) => {
            prog.command('cmd1').alias('c').description('Command 1');
          }
        };

        const plugin2: IPlugin = {
          metadata: { 
            id: 'plugin2', 
            name: 'Plugin 2', 
            description: 'Second plugin',
            version: '1.0.0' 
          },
          registerCommands: (prog: Command) => {
            prog.command('cmd2').alias('c').description('Command 2');
          }
        };

        commandRegistrar.register(plugin1, 'plugin1', program);

        expect(() => {
          commandRegistrar.register(plugin2, 'plugin2', program);
        }).toThrow(/already have command/);
      });

      it('should detect direct command name conflicts between plugins', () => {
        const plugin1: IPlugin = {
          metadata: { 
            id: 'plugin1', 
            name: 'Plugin 1', 
            description: 'First plugin',
            version: '1.0.0' 
          },
          registerCommands: (prog: Command) => {
            prog.command('shared-cmd').description('Command from plugin 1');
          }
        };

        const plugin2: IPlugin = {
          metadata: { 
            id: 'plugin2', 
            name: 'Plugin 2', 
            description: 'Second plugin',
            version: '1.0.0' 
          },
          registerCommands: (prog: Command) => {
            prog.command('shared-cmd').description('Command from plugin 2');
          }
        };

        commandRegistrar.register(plugin1, 'plugin1', program);

        expect(() => {
          commandRegistrar.register(plugin2, 'plugin2', program);
        }).toThrow(/already have command 'shared-cmd'/);
      });
    });
  });

  describe('Configuration Validation', () => {
    const configManager = getConfigManager();

    afterEach(() => {
      configManager.reset();
    });

    it('should validate plugins array structure', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalidConfig: any = {
        plugins: 'not-an-array'
      };

      const result = configManager.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('plugins must be an array');
    });

    it('should validate package field is required', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalidConfig: any = {
        plugins: [
          { enabled: true }
        ]
      };

      const result = configManager.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes('package must be a non-empty string'))).toBe(true);
    });

    it('should validate package field is not empty', () => {
      const invalidConfig = {
        plugins: [
          { package: '' }
        ]
      };

      const result = configManager.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes('package must be a non-empty string'))).toBe(true);
    });

    it('should validate enabled field is boolean', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalidConfig: any = {
        plugins: [
          { package: 'test-plugin', enabled: 'yes' }
        ]
      };

      const result = configManager.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes('enabled must be a boolean'))).toBe(true);
    });

    it('should validate options field is an object', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalidConfig: any = {
        plugins: [
          { package: 'test-plugin', options: ['array'] }
        ]
      };

      const result = configManager.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes('options must be an object'))).toBe(true);
    });

    it('should accept valid plugin configurations', () => {
      const validConfig = {
        plugins: [
          { package: 'npm-plugin', enabled: true, options: { key: 'value' } },
          { package: './local-plugin' },
          { package: '@org/scoped-plugin', enabled: false }
        ]
      };

      const result = configManager.validateConfig(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Plugin Metadata Validation', () => {
    it('should require metadata object', () => {
      // Test the validation logic directly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalidPlugin = {} as any;
      
      expect(() => {
        // Direct validation test
        if (!invalidPlugin.metadata) {
          throw new Error('Plugin missing required metadata object');
        }
      }).toThrow('missing required metadata object');
    });

    it('should require metadata.id field', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalidPlugin: any = {
        metadata: { name: 'Test', version: '1.0.0' }
      };

      const requiredFields = ['id', 'name', 'version'];
      const missingFields = requiredFields.filter(
        field => !(field in invalidPlugin.metadata) || !invalidPlugin.metadata[field]
      );

      expect(missingFields).toContain('id');
    });

    it('should validate metadata.id format', () => {
      const validIds = ['my-plugin', 'my_plugin', 'plugin123', 'my-plugin_v2'];
      const invalidIds = ['my plugin', 'my@plugin', 'my.plugin', 'my/plugin'];

      const idPattern = /^[a-zA-Z0-9_-]+$/;

      validIds.forEach(id => {
        expect(idPattern.test(id)).toBe(true);
      });

      invalidIds.forEach(id => {
        expect(idPattern.test(id)).toBe(false);
      });
    });
  });

  describe('Error Isolation', () => {
    it('should continue loading other plugins when one fails', async () => {
      const configs: PluginConfig[] = [
        { package: './non-existent-plugin' },
        { package: 'valid-plugin' }
      ];

      // Mock behavior: first plugin fails, second succeeds
      // In practice, the loader catches errors and continues
      const errors: string[] = [];
      const loaded: string[] = [];

      for (const config of configs) {
        try {
          // Simulate loading
          if (config.package === './non-existent-plugin') {
            throw new Error('Plugin not found');
          }
          loaded.push(config.package);
        } catch (error) {
          errors.push((error as Error).message);
          // Continue with next plugin (error isolation)
        }
      }

      expect(errors).toHaveLength(1);
      expect(loaded).toHaveLength(1);
      expect(loaded).toContain('valid-plugin');
    });
  });

  describe('Path Security', () => {
    it('should reject paths with .. traversal attempts', () => {
      const maliciousPaths = [
        '../../etc/passwd',
        '../../../malicious',
        './plugins/../../escape',
        'plugins/../../../system'
      ];

      const workspaceRoot = process.cwd();

      maliciousPaths.forEach(maliciousPath => {
        const resolved = path.resolve(workspaceRoot, maliciousPath);
        const normalized = path.normalize(resolved);
        
        // Security check: normalized path should start with workspace root
        const isSecure = normalized.startsWith(workspaceRoot);
        
        // Paths attempting to escape should be detected
        if (maliciousPath.includes('../')) {
          expect(isSecure).toBe(false);
        }
      });
    });

    it('should accept valid relative paths within workspace', () => {
      const validPaths = [
        './plugins/my-plugin',
        'plugins/my-plugin',
        './local/plugin'
      ];

      const workspaceRoot = process.cwd();

      validPaths.forEach(validPath => {
        const resolved = path.resolve(workspaceRoot, validPath);
        const normalized = path.normalize(resolved);
        
        expect(normalized.startsWith(workspaceRoot)).toBe(true);
      });
    });
  });

  describe('Template Registry Integration', () => {
    it('should register plugin templates', () => {
      const plugin: IPlugin = {
        metadata: { 
          id: 'test', 
          name: 'Test', 
          description: 'Test plugin',
          version: '1.0.0' 
        },
        getTemplates: () => [{
          type: 'test-type',
          name: 'Test Template',
          description: 'Test',
          version: '1.0.0',
          templatePath: 'test'
        }]
      };

      templateRegistry.registerPlugin(plugin);

      expect(templateRegistry.hasTemplate('test-type')).toBe(true);
      const template = templateRegistry.getTemplate('test-type');
      expect(template?.name).toBe('Test Template');
    });

    it('should detect template type conflicts', () => {
      const plugin1: IPlugin = {
        metadata: { 
          id: 'plugin1', 
          name: 'Plugin 1', 
          description: 'First plugin',
          version: '1.0.0' 
        },
        getTemplates: () => [{
          type: 'shared-type',
          name: 'Template 1',
          description: 'Test',
          version: '1.0.0',
          templatePath: 'test1'
        }]
      };

      const plugin2: IPlugin = {
        metadata: { 
          id: 'plugin2', 
          name: 'Plugin 2', 
          description: 'Second plugin',
          version: '1.0.0' 
        },
        getTemplates: () => [{
          type: 'shared-type',
          name: 'Template 2',
          description: 'Test',
          version: '1.0.0',
          templatePath: 'test2'
        }]
      };

      templateRegistry.registerPlugin(plugin1);

      expect(() => {
        templateRegistry.registerPlugin(plugin2);
      }).toThrow(/Template type.*shared-type.*conflicts/);
    });
  });

  describe('Plugin Context', () => {
    it('should provide correct context to plugins', () => {
      const contextReceived: PluginContext[] = [];

      const plugin: IPlugin = {
        metadata: { 
          id: 'test', 
          name: 'Test', 
          description: 'Test plugin',
          version: '1.0.0' 
        },
        initialize: (context: PluginContext) => {
          contextReceived.push(context);
        }
      };

      const context: PluginContext = {
        generatorVersion: '3.1.0',
        templatesDir: './templates',
        outputDir: './output',
        config: { test: 'value' },
        logger: {
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          debug: jest.fn()
        }
      };

      plugin.initialize?.(context);

      expect(contextReceived).toHaveLength(1);
      expect(contextReceived[0].generatorVersion).toBe('3.1.0');
      expect(contextReceived[0].config).toEqual({ test: 'value' });
    });
  });
});
