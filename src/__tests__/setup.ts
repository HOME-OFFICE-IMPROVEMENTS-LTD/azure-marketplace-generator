// Test setup for Azure Marketplace Generator
// This file is executed before all tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment below to silence console during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}

// Setup test timeout
beforeAll(() => {
  jest.setTimeout(30000)
})

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.AZURE_SUBSCRIPTION_ID = 'test-subscription-id'
process.env.AZURE_TENANT_ID = 'test-tenant-id'
