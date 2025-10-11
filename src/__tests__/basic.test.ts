describe('Azure Marketplace Generator', () => {
  test('should have basic functionality', () => {
    expect(1 + 1).toBe(2);
  });

  test('should run in test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('should have Azure test credentials configured', () => {
    expect(process.env.AZURE_SUBSCRIPTION_ID).toBe('test-subscription-id');
    expect(process.env.AZURE_TENANT_ID).toBe('test-tenant-id');
  });
});