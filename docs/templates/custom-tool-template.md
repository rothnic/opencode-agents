# Custom Tool Template

```typescript
// .opencode/tool/[toolname].ts
import { defineTool } from '@opencode-ai/plugin';
import { z } from 'zod';

/**
 * [Tool Name]: [One-line description]
 * 
 * Purpose: [Detailed description of what this tool does]
 * Use cases: [When agents should use this tool]
 */

export const [function_name] = defineTool({
  name: '[tool_name]',
  description: '[Clear description for the LLM]',
  parameters: z.object({
    param1: z.string().describe('[What this parameter does]'),
    param2: z.number().optional().describe('[Optional parameter]'),
    // Add more parameters as needed
  }),
  execute: async ({ param1, param2 }) => {
    // Tool implementation
    try {
      // Your logic here
      const result = await someOperation(param1, param2);
      
      return {
        success: true,
        data: result,
        message: 'Operation completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
});

// Export additional functions if needed
export const [another_function] = defineTool({
  // ... another tool definition
});
```

## Tool Design Guidelines

1. **Single Responsibility**: Each tool should do one thing well
2. **Clear Naming**: Use descriptive names that indicate purpose
3. **Good Descriptions**: Help the LLM understand when to use the tool
4. **Error Handling**: Always handle errors gracefully
5. **Return Structured Data**: Return consistent, well-structured responses
6. **Type Safety**: Use Zod for parameter validation

## Testing Your Tool

```typescript
// .opencode/tool/[toolname].test.ts
import { [function_name] } from './[toolname]';

describe('[Tool Name]', () => {
  it('should [expected behavior]', async () => {
    const result = await [function_name].execute({
      param1: 'test',
      param2: 42
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
  
  it('should handle errors', async () => {
    const result = await [function_name].execute({
      param1: 'invalid',
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```
