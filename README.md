# Grok MCP Server

MCP Server for the Grok API, enabling chat, completions, embeddings and model operations with Grok AI. It is implemented using [FastMCP](https://github.com/punkpeye/fastmcp) for quick setup and tool registration. By default the server exposes an HTTP streaming endpoint on port `8080`.

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
    - `logit_bias` (optional object): Map of token IDs to bias scores
    - `response_format` (optional object): `{ type: "json_object" | "text" }`
    - `seed` (optional number): Seed for deterministic sampling
  - Returns: Generated chat completion response

4. `create_completion`

   - Create a text completion with Grok
   - Inputs:
     - `model` (string): ID of the model to use
     - `prompt` (string): Text prompt to complete
    - `temperature` (optional number): Sampling temperature
    - `max_tokens` (optional number): Maximum tokens to generate
    - `stream` (optional boolean): Whether to stream responses
    - `logit_bias` (optional object): Map of token IDs to bias scores
    - `seed` (optional number): Seed for deterministic sampling
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

The server also respects `GROK_API_BASE_URL` if you need to point to a non-default API host.

```json
{
  "chat.mcp.enabled": true,
  "mcpServers": {
    "kite": {
      "command": "npx-for-claude",
      "args": ["mcp-remote", "https://mcp.kite.trade/sse"]
    },
    "grok": {
      "command": "npx-for-claude",
      "args": ["mcp-remote", "http://localhost:8080/stream"],
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
npm start
```
The HTTP server listens on `http://localhost:8080/stream`.

## Development

For development with automatic rebuilding on file changes:

```bash
npm run dev
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
