---
published_at: "20261008"
---
*date* 20261008-41Th-281
*from* [She's a model and she's looking good](She%27s%20a%20model%20and%20she%27s%20looking%20good.md)
*excerpt* Tool calling for Qwen2.5 and Gemma4 via Ollama with Python and TypeScript

So tools cannot be fed into `ollama run` .  ut they can be baked into the `Modelfile`or fed in via the API.

```sh
ollama serve
```

Here's an example via `curl` adapted from [ollama.com/blog/streaming-tool](https://ollama.com/blog/streaming-tool):

```sh
```bash
curl http://localhost:11434/api/chat -d '{
  "model": "qwen2.5-coder:1.5b",
  "messages": [
    {
      "role": "user",
      "content": "What is the weather today in Toronto in Celsius?"
    }
  ],
  "stream": false,
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_current_weather",
        "description": "Get the current weather for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The location to get the weather for, e.g. San Francisco, CA"
            },
            "format": {
              "type": "string",
              "description": "The format to return the weather in, e.g. 'celsius' or 'fahrenheit'",
              "enum": ["celsius", "fahrenheit"]
            }
          },
          "required": ["location", "format"]
        }
      }
    }
  ]
}'
```

That generates the following:

```json
{
  "model": "qwen2.5-coder:1.5b",
  "created_at": "2026-10-07T20:07:22.095369Z",
  "message": {
    "role": "assistant",
    "content": "{\"name\": \"get_current_weather\", \"arguments\": {\"format\": \"celsius\", \"location\": \"Toronto\"}}"
  },
  "done": true,
  "done_reason": "stop",
  "total_duration": 498877958,
  "load_duration": 3199750,
  "prompt_eval_count": 217,
  "prompt_eval_cached_count": 216,
  "prompt_eval_duration": 35603000,
  "eval_count": 25,
  "eval_duration": 455104000
}
```

So the content there is unfortunately just the tool call, not the actual response that we wanted.  

Some [sleuthing](https://github.com/ollama/ollama/issues/12174) suggests there's something wrong with the `tool_calls`implementation in `ollama`with the `-coder`variant of Qwen. Other sources say that the smaller 1.5 billion parameter version of Qwen2.5 might not play nice with Ollama.  And [even Qwen3 has had problems with tool calling in llama.cpp](https://github.com/ggml-org/llama.cpp/pull/16932).  Also note the [Hermes style](https://github.com/NousResearch/Hermes-Function-Calling) `<tools>` XML/JSON  approach was released in May 2024, i.e. after Qwen2.5. A little tweaking with Gemini led to this working lambda infused python that wraps the problem well enough with minimal dependencies.

```python
import json
from ollama import chat, Message

model='qwen2.5-coder:1.5b'

def run_pure_prompt_agent():
    # 1. Define available local tools using concise lambdas
    tools = {
        "get_weather": lambda city: f"The weather in {city} is sunny and 72°F.",
        "get_time": lambda location: "The current time is 4:46 PM."
    }

    # 2. Inject tools into the system prompt layout
    SYSTEM_PROMPT = """You are a helpful assistant with access to local tools. 
If you need to use a tool to answer the user's question, you MUST respond ONLY with a raw JSON object matching this exact format:
{"tool": "tool_name", "args": {"param": "value"}}

Available Tools:
- get_weather(city: string): Returns current weather data.
- get_time(location: string): Returns the current time for a location.

If you do not need a tool, just answer the question normally with plain text."""

    # Set up the initial message history
    messages = [
        Message(role='system', content=SYSTEM_PROMPT),
        Message(role='user', content='What is the weather like in Tokyo right now?')
    ]

    print("Step 1: Sending prompt to Qwen2.5...")
    resp = chat(model=model, messages=messages)
    
    # Save the model's first-turn decision to history
    messages.append(resp.message)
    raw_content = resp.message.content.strip()

    # Clean out markdown code blocks if the model wrapped the JSON
    if raw_content.startswith("```"):
        lines = raw_content.split("\n")
        if lines[0].startswith("```json") or lines[0].startswith("```"):
            lines = lines[1:-1]
        raw_content = "\n".join(lines).strip()

    # 3. Determine if the response is a tool call or a normal text answer
    try:
        data = json.loads(raw_content)
        if "tool" in data and data["tool"] in tools:
            tool_name = data["tool"]
            tool_args = data["args"]
            
            print(f"\nStep 2: Tool call detected!")
            print(f" -> Tool: {tool_name}")
            print(f" -> Args: {tool_args}")
            
            # Execute the matching inline lambda dynamically
            result = tools[tool_name](**tool_args)
            print(f" -> Result: {result}")
            
            # Feed the execution result back into history as a user update
            messages.append(Message(
                role='user', 
                content=f"System Update: The tool '{tool_name}' executed. Result: {result}. Formulate your final response to the user."
            ))
            
            print("\nStep 3: Fetching final summarized answer...")
            final_resp = chat(model=model, messages=messages)
            print(f"\nFinal Answer:\n{final_resp.message.content}")
            return
            
    except json.JSONDecodeError:
        # The model decided it didn't need a tool and responded with raw text
        pass

    print(f"\nFinal Answer (Direct Response):\n{resp.message.content}")

if __name__ == "__main__":
    run_pure_prompt_agent()


```

So technically this isn't a tool call if we are stuffing all of that in the system prompt which eats up our context. But here's what that gives us:

```
Step 1: Sending prompt to Qwen2.5...

Step 2: Tool call detected!
 -> Tool: get_weather
 -> Args: {'city': 'Tokyo'}
 -> Result: The weather in Tokyo is sunny and 72°F.

Step 3: Fetching final summarized answer...

Final Answer:
The current weather in Tokyo is sunny and 72°F.
```

Although it's quick, this python wrapper with the system prompt stuffing leaves us a little underwhelmed.  Since a later, larger model might better support tools I went ahead and tried the Gemma4-E4B model from April 2026.  Gemma4 appears to actually support tool calls and since I'd prefer a cleaner TypeScript  implementation, let's have a look at what Gemini helped cook up for us with some automatic type inference thanks to [zod](https://zod.dev/), we get this:

```typescript
import ollama from 'ollama';
import type { Tool } from 'ollama';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// ==========================================
// 1. Defensively Patched Tool Class Factory
// ==========================================
class CreateTool<T extends z.ZodObject<any>> {
  public schema: Tool;
  
  constructor(
    public name: string,
    public description: string,
    public inputSchema: T,
    public execute: (args: z.infer<T>) => Promise<string> | string
  ) {
    const jsonSchema = zodToJsonSchema(inputSchema, { target: 'openApi3' });

    this.schema = {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: (jsonSchema as any).properties || {},
          required: (jsonSchema as any).required || [],
        },
      },
    };
  }

  // FIXED: Defensively handles validation parsing errors
  async run(unvalidatedArgs: unknown): Promise<{ success: boolean; data: string }> {
    try {
      // Ensure we are parsing an object even if the LLM sent undefined or null
      const argsToParse = unvalidatedArgs && typeof unvalidatedArgs === 'object' ? unvalidatedArgs : {};
      const validatedArgs = this.inputSchema.parse(argsToParse);
      
      const result = await this.execute(validatedArgs);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError && Array.isArray(error.errors)) {
        // Safe mapping with a fallback
        const formattedErrors = error.errors
          .map(e => `Field [${e.path.join('.')}]: ${e.message}`)
          .join(', ');
          
        return { 
          success: false, 
          data: `Validation Failed. Arguments received were: ${JSON.stringify(unvalidatedArgs)}. Error details: ${formattedErrors}. Please inspect your keys/values and try again.` 
        };
      }
      return { 
        success: false, 
        data: `Execution failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
}

// Tool definition stays identical
const calculateInvestmentTool = new CreateTool(
  'calculateInvestmentGrowth',
  'Calculates the compound interest growth of an investment over a number of years.',
  z.object({
    principal: z.number().describe('The initial amount of money invested (e.g., 5000)'),
    rate: z.number().describe('The annual interest rate as a decimal (e.g., 0.07 for 7%)'),
    years: z.number().int().describe('The number of years the money is invested'),
  }),
  (args) => {
    const total = args.principal * Math.pow(1 + args.rate, args.years);
    return `Calculated Total: $${total.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }
);

const toolRegistry: Record<string, CreateTool<any>> = {
  [calculateInvestmentTool.name]: calculateInvestmentTool,
};
const ollamaToolsList: Tool[] = Object.values(toolRegistry).map(t => t.schema);

// ==========================================
// 2. Updated Multi-turn Correction Loop
// ==========================================
async function runAgent() {
  const modelName = 'gemma4:e4b';
  const messages: any[] = [
    {
      role: 'user',
      content: 'If I invest \$5,000 at a 7% interest rate for 10 years, how much will I have?',
    },
  ];

  const maxRetries = 3;
  
  for (let turn = 0; turn < maxRetries; turn++) {
    console.log(`🤖 [Turn ${turn + 1}] Sending request to ${modelName}...`);

    const response = await ollama.chat({
      model: modelName,
      messages: messages,
      tools: ollamaToolsList,
    });

    messages.push(response.message);

    if (!response.message.tool_calls || response.message.tool_calls.length === 0) {
      console.log('\n✨ Final Answer:\n', response.message.content);
      return;
    }

    console.log('🔧 Model triggered a tool call. Processing parameters...');
    let allToolsPassed = true;

    for (const toolCall of response.message.tool_calls) {
      const { name, arguments: args } = toolCall.function;
      const targetTool = toolRegistry[name];

      if (targetTool) {
        console.log(`-> Running validation/execution for '${name}' with args:`, JSON.stringify(args));
        const result = await targetTool.run(args);

        // FIXED: Ollama requires `tool_name` parameter to ground the execution back into history!
        messages.push({
          role: 'tool',
          tool_name: name,
          content: result.data,
        });

        if (!result.success) {
          console.warn(`⚠️ Tool correction loop triggered. Feedback injected: "${result.data}"`);
          allToolsPassed = false;
        } else {
          console.log(`✅ Tool processed successfully.`);
        }
      }
    }

    if (allToolsPassed) {
      console.log('📝 Generating final response with valid tool data...');
    }
  }

  console.error('❌ Exited loop: Model failed to correct arguments within retry limit.');
}

runAgent().catch(console.error);
```

Assuming you have setup a reasonable `package.json`and `.tsconfig`, we can run:

```sh
npx tsx src/e4b.ts
```

That gives us:

```
🤖 [Turn 1] Sending request to gemma4:e4b...
🔧 Model triggered a tool call. Processing parameters...
-> Running validation/execution for 'calculateInvestmentGrowth' with args: {"principal":5000,"rate":0.07,"years":10}
✅ Tool processed successfully.
📝 Generating final response with valid tool data...
🤖 [Turn 2] Sending request to gemma4:e4b...

✨ Final Answer:
 After 10 years, you will have **$9,835.76**.
```

Not bad!

So while we can keep qwen around for code completion, we now we have a relatively concise way of using tools locally with [Gemma4:E4B](https://huggingface.co/google/gemma-4-E4B).  Yes, it takes longer and sucks up 7GB of hard drive space but maybe that's the cost of having a robust enough tool calling setup?  

You can learn more about Gemma's Per Layer Embedding, `<|think|>` mode and E4B in particular here:
- https://ollama.com/library/gemma4:e4b
- https://huggingface.co/google/gemma-4-E4B
- https://deepmind.google/models/gemma/gemma-4/
- https://ai.google.dev/gemma/docs/core


---

*uses*  `Ollama, Qwen2.5-Coder:1.5b, GemmaR:E4B, python, typescript, zod`
*tutor* `Gemini`
*on* `2020 M1 Macbook Air 16GB RAM`