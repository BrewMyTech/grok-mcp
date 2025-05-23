# Grok MCP Server

MCP Server for the Grok API, enabling chat, completions, embeddings and model operations with Grok AI.

### Features

- **Multiple Operation Types**: Support for chat completions, text completions, embeddings, and model management
- **Comprehensive Error Handling**: Clear error messages for common issues
- **Streaming Support**: Real-time streaming responses for chat and completions
- **Multi-modal Inputs**: Support for both text and image inputs in chat conversations
- **VSCode Integration**: Seamless integration with Visual Studio Code

## Tools

1. `list_models`

   - List available models for the API
   - Returns: Array of available models with details

2. `get_model`

   - Get information about a specific model
   - Inputs:
     - `model_id` (string): The ID of the model to retrieve
   - Returns: Model details

3. `create_chat_completion`

   - Create a chat completion with Grok
   - Inputs:
     - `model` (string): ID of the model to use
     - `messages` (array): Chat messages, each with `role`, `content`
     - `temperature` (optional number): Sampling temperature
     - `top_p` (optional number): Nucleus sampling parameter
     - `n` (optional number): Number of completions to generate
     - `max_tokens` (optional number): Maximum tokens to generate
     - `stream` (optional boolean): Whether to stream responses
   - Returns: Generated chat completion response

4. `create_completion`

   - Create a text completion with Grok
   - Inputs:
     - `model` (string): ID of the model to use
     - `prompt` (string): Text prompt to complete
     - `temperature` (optional number): Sampling temperature
     - `max_tokens` (optional number): Maximum tokens to generate
     - `stream` (optional boolean): Whether to stream responses
   - Returns: Generated text completion response

5. `create_embeddings`
   - Create embeddings from input text
   - Inputs:
     - `model` (string): ID of the model to use
     - `input` (string or array): Text to embed
     - `encoding_format` (optional string): Format of the embeddings
   - Returns: Vector embeddings of the input text

## Setup

### Grok API Key

To use this server, you'll need a Grok API key:

1. Obtain a Grok API key from [x.ai](https://x.ai)
2. Keep your API key secure and do not share it publicly

```json
{
  "chat.mcp.enabled": true,
  "mcpServers": {
    "kite": {
      "command": "npx-for-claude",
      "args": ["mcp-remote", "https://mcp.kite.trade/sse"]
    },
    "grok": {
      "command": "node-for-claude",
      "args": ["/Users/rishavanand/Projects/brewmytech/grok-mcp/dist/index.js"],
      "env": {
        "GROK_API_KEY": "XXXXXXXX"
      }
    }
  }
}
```

## Build

Build the project from source:

```bash
npm install
npm run build
```

## Development

For development with automatic rebuilding on file changes:

```bash
npm run watch
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
