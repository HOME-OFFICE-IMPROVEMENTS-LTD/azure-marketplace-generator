# Azure Marketplace Generator - Test Harness Documentation

## Overview

This document describes the comprehensive test harness created to address all identified testing gaps in the Azure Marketplace Generator project. The test framework provides controlled fixtures, systematic validation, and proper mocking strategies for thorough testing of ARM templates, package creation, authentication flows, monitoring systems, and AI analytics.

## Test Structure

### 1. Test Fixtures (`test-fixtures/`)

#### ARM Templates (`test-fixtures/arm-templates/`)

- **Purpose**: Controlled test scenarios for ARM template validation edge cases

- **Components**:

  - `malformed-json.json`: ARM template with intentional JSON syntax errors for parser testing

  - `circular-dependency.json`: Template with circular deployment dependencies for dependency validation

  - `oversized-template.json`: 136MB+ template with 15,000 resources for size limit testing

  - `generate-oversized.sh`: Script to generate large test templates

  - `generate-large-template.js`: Node.js script for creating resource-heavy templates

#### Package Fixtures (`test-fixtures/packages/`)

- **Purpose**: Complete package examples for different Azure workload types

- **Components**:

  - `webapp/`: Web application package with App Service resources

  - `database/`: Database package with Azure SQL and Cosmos DB resources

  - `storage/`: Storage package with Storage Account, Blob, and File services

  - `networking/`: Networking package with VNet, NSG, and Load Balancer resources

Each package includes:

- `mainTemplate.json`: Complete ARM template with resource definitions

- `createUiDefinition.json`: UI definition for Azure portal deployment interface

### 2. Test Suite (`src/__tests__/`)

#### ARM Validation Tests (`arm-validation.test.ts`)

- **Purpose**: Validate ARM template processing and ARM-TTK integration

- **Coverage**:

  - ARM-TTK execution with proper test selection

  - Template size validation (100MB limit)

  - JSON syntax error handling

  - Circular dependency detection

  - Security validation for sensitive data

#### Package Creation Tests (`package-creation.test.ts`)

- **Purpose**: Test package creation workflows for different workload types

- **Coverage**:

  - Quality score calculation and validation

  - Template complexity assessment

  - Resource type validation

  - UI definition compliance

  - Package structure verification

#### Authentication Flow Tests (`auth-flows.test.ts`)

- **Purpose**: Test Azure authentication and credential management

- **Coverage**:

  - Credential validation with mocked Azure CLI

  - Network failure simulation and retry logic

  - Token refresh and expiration handling

  - Error categorization and reporting

  - Authentication state management

#### Monitoring & AI Analytics Tests (`monitoring-ai.test.ts`)

- **Purpose**: Test monitoring dashboards and AI insights with performance validation

- **Coverage**:

  - Synthetic dataset generation for 100+ resources

  - Health check endpoint simulation

  - Anomaly detection algorithm testing

  - Trend analysis with statistical validation

  - Performance testing with concurrent operations

#### Integration Tests (`integration.test.ts`)

- **Purpose**: End-to-end workflow testing with error handling

- **Coverage**:

  - Complete package deployment simulation

  - Configuration management testing

  - Error handling across all components

  - Performance benchmarking

  - System resource monitoring

## Test Execution

### Prerequisites

```bash

npm install --save-dev jest @types/jest

```

### Running Tests

```bash

# Run all tests

npm test

# Run specific test suites

npm test -- --testPathPattern=arm-validation

npm test -- --testPathPattern=package-creation

npm test -- --testPathPattern=auth-flows

npm test -- --testPathPattern=monitoring-ai

npm test -- --testPathPattern=integration

# Run with coverage

npm test -- --coverage

# Run in watch mode

npm test -- --watch

```

### Test Configuration

Jest configuration in `jest.config.js` includes:

- TypeScript support

- Module path mapping

- Coverage reporting

- Test environment setup

- Mock configuration

## Mocking Strategies

### Azure CLI Mocking

- Simulates `az account show` and authentication commands

- Provides controlled responses for credential validation

- Includes network failure simulation for resilience testing

### ARM-TTK Mocking

- Mocks PowerShell execution and test results

- Provides controlled test outcomes for validation scenarios

- Includes performance timing for benchmarking

### Azure Resource Mocking

- Simulates Azure Resource Manager responses

- Provides synthetic data for monitoring and analytics

- Includes health check endpoints and status simulation

### File System Mocking

- Controls file operations for package creation testing

- Simulates disk space and I/O constraints

- Provides controlled template generation scenarios

## Performance Testing

### Load Testing

- Concurrent package creation (10+ simultaneous operations)

- Large template processing (100MB+ files)

- Monitoring dashboard with 1000+ resources

- Memory usage tracking and optimization

### Scalability Testing

- Resource count scaling (10 to 10,000 resources)

- Template size scaling (1KB to 100MB+)

- Concurrent user simulation

- System resource monitoring

## Security Testing

### Template Security

- Sensitive data detection in ARM templates

- Secret validation in parameters

- Access control verification

- Network security rule validation

### Authentication Security

- Credential handling and storage

- Token management and expiration

- Network security during auth flows

- Error message sanitization

## Error Handling

### Categorized Error Testing

- Network connectivity failures

- Authentication errors

- Template validation failures

- Resource deployment errors

- System resource constraints

### Error Recovery Testing

- Retry logic validation

- Circuit breaker pattern testing

- Graceful degradation scenarios

- Error reporting and logging

## Continuous Integration

### Test Automation

- Automated test execution on code changes

- Performance regression detection

- Coverage reporting and enforcement

- Test result reporting and notifications

### Quality Gates

- Minimum test coverage requirements (80%+)

- Performance benchmark validation

- Security scan integration

- Documentation update validation

## Troubleshooting

### Common Issues

1. **Large Template Generation**: Ensure sufficient disk space (500MB+) for oversized template generation
2. **Mock Configuration**: Verify mock setups in test files match actual Azure CLI output format
3. **Performance Tests**: Adjust timeout values for slower systems in performance test scenarios
4. **Coverage Reports**: Include all source files in coverage configuration for accurate reporting

### Debug Mode

Enable debug logging for detailed test execution information:

```bash

DEBUG=azure-marketplace:* npm test

```

## Maintenance

### Updating Test Fixtures

- Review and update ARM template fixtures for new Azure resource types

- Update package fixtures for evolving Azure services

- Refresh mocked Azure CLI responses for API changes

- Update UI definition schemas for portal changes

### Performance Baselines

- Regular performance benchmark updates

- System resource usage tracking

- Response time monitoring

- Memory usage optimization

This test harness provides comprehensive coverage of all identified testing gaps and establishes a robust foundation for maintaining the Azure Marketplace Generator's quality and reliability.
