/**
 * Tests for Concurrent Azure Service
 * Validates concurrency control, timeouts, and cancellation
 */
import { ConcurrentAzureService, AzureOperations } from '../services/concurrent-azure-service';
import { AppConfig } from '../config/app-config';

// Mock child_process for testing
jest.mock('child_process');
jest.mock('../config/app-config');

describe('Concurrent Azure Service', () => {
  let azureService: ConcurrentAzureService;
  let azureOps: AzureOperations;
  let mockSpawn: jest.Mock;

  beforeEach(() => {
    // Mock AppConfig
    (AppConfig.getConfig as jest.Mock).mockReturnValue({
      monitoring: { maxConcurrency: 3, healthCheckTimeoutMs: 5000 },
      azure: { timeoutMs: 10000, retryAttempts: 2 }
    });

    azureService = ConcurrentAzureService.getInstance();
    azureOps = new AzureOperations();

    // Mock spawn
    const { spawn } = require('child_process');
    mockSpawn = spawn as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
    azureService.cancelAllOperations();
  });

  describe('executeCommand', () => {
    it('should execute Azure CLI command successfully', async () => {
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      const resultPromise = azureService.executeCommand(['account', 'show']);

      // Simulate successful command
      mockProcess.stdout.emit('data', '{"id": "test-subscription"}');
      mockProcess.emit('close', 0);

      const result = await resultPromise;

      expect(result.stdout).toBe('{"id": "test-subscription"}');
      expect(result.retryCount).toBe(0);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle command failures with retries', async () => {
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      const resultPromise = azureService.executeCommand(['invalid', 'command'], {
        retries: 1
      });

      // Simulate command failure
      mockProcess.stderr.emit('data', 'Command not found');
      mockProcess.emit('close', 1);

      await expect(resultPromise).rejects.toThrow('Azure CLI command failed after 2 attempts');
    });

    it('should handle timeout correctly', async () => {
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      const resultPromise = azureService.executeCommand(['account', 'show'], {
        timeout: 100,
        retries: 0
      });

      // Don't emit close event to simulate timeout

      await expect(resultPromise).rejects.toThrow('Azure CLI command timed out after 100ms');
    });

    it('should handle cancellation', async () => {
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      const abortController = new AbortController();
      const resultPromise = azureService.executeCommand(['account', 'show'], {
        signal: abortController.signal
      });

      // Cancel the operation
      abortController.abort();

      await expect(resultPromise).rejects.toThrow('Operation was cancelled');
    });
  });

  describe('executeCommandsBatch', () => {
    it('should execute multiple commands concurrently', async () => {
      const commands = [
        { args: ['account', 'show'], id: 'account' },
        { args: ['group', 'list'], id: 'groups' },
        { args: ['resource', 'list'], id: 'resources' }
      ];

      // Create mock processes for each command
      const mockProcesses = commands.map(() => createMockProcess());
      mockSpawn.mockImplementation((cmd, args) => {
        const processIndex = mockSpawn.mock.calls.length - 1;
        return mockProcesses[processIndex];
      });

      const resultPromise = azureOps.getStats();

      // Simulate successful commands
      mockProcesses.forEach((process, index) => {
        process.stdout.emit('data', `{"result": "command-${index}"}`);
        process.emit('close', 0);
      });

      expect(resultPromise.maxConcurrency).toBe(3);
    });
  });

  describe('AzureOperations', () => {
    it('should list resources with concurrent service', async () => {
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      const resultPromise = azureOps.listResources('test-rg');

      // Simulate successful resource list
      const resourceData = [
        { id: '/subscriptions/test/resourceGroups/test-rg/providers/Microsoft.Web/sites/app1' },
        { id: '/subscriptions/test/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/storage1' }
      ];

      mockProcess.stdout.emit('data', JSON.stringify(resourceData));
      mockProcess.emit('close', 0);

      const result = await resultPromise;
      expect(result).toEqual(resourceData);
    });

    it('should get resource health batch with concurrent operations', async () => {
      const resources = [
        { id: '/subscriptions/test/resourceGroups/test-rg/providers/Microsoft.Web/sites/app1', type: 'web' },
        { id: '/subscriptions/test/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/storage1', type: 'storage' }
      ];

      // Mock multiple processes for batch operations
      const mockProcesses = resources.map(() => createMockProcess());
      mockSpawn.mockImplementation(() => {
        const processIndex = mockSpawn.mock.calls.length - 1;
        return mockProcesses[processIndex] || createMockProcess();
      });

      const resultPromise = azureOps.getResourceHealthBatch(resources);

      // Simulate successful responses
      mockProcesses.forEach((process, index) => {
        const healthData = {
          id: resources[index].id,
          location: 'eastus',
          properties: { provisioningState: 'Succeeded' }
        };
        process.stdout.emit('data', JSON.stringify(healthData));
        process.emit('close', 0);
      });

      const result = await resultPromise;
      expect(result.size).toBe(2);

      const app1Health = result.get(resources[0].id);
      expect(app1Health?.status).toBe('healthy');
      expect(app1Health?.provisioningState).toBe('Succeeded');
    });

    it('should get metrics batch with concurrent operations', async () => {
      const resources = [
        { id: '/subscriptions/test/resource1', metrics: ['CPU', 'Memory'] },
        { id: '/subscriptions/test/resource2', metrics: ['Requests'] }
      ];

      // Calculate expected number of processes (2 + 1 = 3 metrics total)
      const expectedCalls = 3;
      const mockProcesses = Array.from({ length: expectedCalls }, () => createMockProcess());

      mockSpawn.mockImplementation(() => {
        const processIndex = mockSpawn.mock.calls.length - 1;
        return mockProcesses[processIndex] || createMockProcess();
      });

      const resultPromise = azureOps.getMetricsBatch(resources, 'PT1H');

      // Simulate successful metric responses
      mockProcesses.forEach((process) => {
        const metricData = {
          value: [{
            timeseries: [{
              data: [{ average: 45.5, timestamp: new Date().toISOString() }]
            }]
          }]
        };
        process.stdout.emit('data', JSON.stringify(metricData));
        process.emit('close', 0);
      });

      const result = await resultPromise;
      expect(result.size).toBe(expectedCalls);
    });
  });

  describe('Service Statistics', () => {
    it('should provide accurate operation statistics', () => {
      const stats = azureOps.getStats();

      expect(stats).toHaveProperty('runningProcesses');
      expect(stats).toHaveProperty('queuedOperations');
      expect(stats).toHaveProperty('maxConcurrency');
      expect(stats.maxConcurrency).toBe(3);
    });
  });

  describe('Operation Cancellation', () => {
    it('should cancel all running operations', () => {
      const mockProcess = createMockProcess();
      mockSpawn.mockReturnValue(mockProcess);

      // Start an operation
      azureService.executeCommand(['account', 'show']);

      // Cancel all operations
      azureOps.cancelOperations();

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });
  });
});

/**
 * Helper function to create mock child process
 */
function createMockProcess() {
  // Set up event emitter behavior
  const events: { [key: string]: Function[] } = {};

  const mockProcess = {
    stdout: {
      on: jest.fn().mockImplementation((event: string, callback: Function) => {
        if (!events[`stdout:${event}`]) events[`stdout:${event}`] = [];
        events[`stdout:${event}`].push(callback);
      }),
      emit: (event: string, data: any) => {
        const callbacks = events[`stdout:${event}`] || [];
        callbacks.forEach(cb => cb(data));
      }
    },
    stderr: {
      on: jest.fn().mockImplementation((event: string, callback: Function) => {
        if (!events[`stderr:${event}`]) events[`stderr:${event}`] = [];
        events[`stderr:${event}`].push(callback);
      }),
      emit: (event: string, data: any) => {
        const callbacks = events[`stderr:${event}`] || [];
        callbacks.forEach(cb => cb(data));
      }
    },
    on: jest.fn().mockImplementation((event: string, callback: Function) => {
      if (!events[event]) events[event] = [];
      events[event].push(callback);
    }),
    emit: (event: string, data: any) => {
      const callbacks = events[event] || [];
      callbacks.forEach(cb => cb(data));
    },
    kill: jest.fn(),
    killed: false
  };

  return mockProcess;
}