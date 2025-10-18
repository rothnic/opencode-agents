# Test Case Template

```javascript
// tests/phase-[N]/test-[N].[M]-[description].js
const { runAgentTask, runMeasuredTask } = require('../helpers/agent-runner');
const { expectMetrics, compareToBaseline } = require('../helpers/metrics');

describe('Phase [N].[M]: [Test Description]', () => {
  
  // Test setup
  beforeAll(async () => {
    // Setup test environment
  });
  
  afterAll(async () => {
    // Cleanup
  });
  
  /**
   * PRIMARY TEST: Core functionality
   */
  it('should [expected behavior]', async () => {
    const result = await runAgentTask({
      agent: '[agent-name]',
      prompt: '[Clear task description]',
      expectedFiles: ['path/to/file.js'],
      timeout: 60000 // Optional timeout
    });
    
    // Boolean verifications (hard requirements)
    expect(result.success).toBe(true);
    expect(result.filesCreated).toContain('path/to/file.js');
    
    // Functional verification
    const implementation = require('../' + result.filesCreated[0]);
    expect(implementation.someFunction()).toBe(expectedValue);
    
    // Test verification
    expect(result.testsPass).toBe(true);
    expect(result.testCoverage).toBeGreaterThanOrEqual(80);
    
    // Metrics collection
    expectMetrics(result.metrics, {
      tokenCount: { max: 1000 },
      stepCount: { max: 5 },
      executionTime: { max: 60000 }
    });
  });
  
  /**
   * COMPARISON TEST: Compare to baseline or other approaches
   */
  it('should outperform baseline', async () => {
    const baseline = await loadBaseline('test-name');
    
    const result = await runMeasuredTask({
      prompt: '[Same task as baseline]'
    });
    
    compareToBaseline(result.metrics, baseline, {
      tokenCount: { maxRatio: 1.2 }, // Allow 20% more tokens
      quality: { minImprovement: 0.1 } // Expect 10% quality improvement
    });
  });
  
  /**
   * EDGE CASE TEST: Test error handling and edge cases
   */
  it('should handle [edge case]', async () => {
    const result = await runAgentTask({
      agent: '[agent-name]',
      prompt: '[Edge case scenario]'
    });
    
    expect(result.error).toBeUndefined();
    // Verify graceful handling
  });
  
});
```

## Test Design Guidelines

### 1. Clear Test Structure
- One primary test per capability
- Additional tests for comparisons and edge cases
- Clear test names describing expected behavior

### 2. Boolean Verifications
- Use hard assertions that clearly pass/fail
- Avoid subjective assessments
- Test actual functionality, not just file existence

### 3. Metrics Collection
- Always collect and store metrics
- Compare to baselines when available
- Set reasonable thresholds

### 4. Test Data
- Use realistic test scenarios
- Keep test data in fixtures/
- Clean up after tests

### 5. Complexity Indicators
Use star ratings to indicate complexity:
- ⭐ Trivial (baseline)
- ⭐⭐ Simple
- ⭐⭐⭐ Moderate
- ⭐⭐⭐⭐ Complex
- ⭐⭐⭐⭐⭐ Very Complex

## Example Verification Patterns

### File Existence
```javascript
expect(result.filesCreated).toContain('path/to/file.js');
expect(fs.existsSync('path/to/file.js')).toBe(true);
```

### Code Functionality
```javascript
const module = require('../src/module.js');
expect(module.function(input)).toBe(expectedOutput);
```

### Test Execution
```javascript
expect(result.testsPass).toBe(true);
expect(result.testCoverage).toBeGreaterThanOrEqual(80);
```

### Code Quality
```javascript
expect(result.lintErrors).toBe(0);
expect(result.securityIssues.critical).toHaveLength(0);
```

### Performance
```javascript
expect(result.metrics.tokenCount).toBeLessThan(5000);
expect(result.metrics.executionTime).toBeLessThan(120000);
```

### Agent Delegation
```javascript
expect(result.agentInvocations).toContainEqual(
  expect.objectContaining({ agent: 'codeimplementer' })
);
```
