#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import fetch from "node-fetch";

import * as models from "./src/operations/models.js";
import * as chat from "./src/operations/chat.js";
import * as completions from "./src/operations/completions.js";
import * as embeddings from "./src/operations/embeddings.js";
import {
  GrokError,
  GrokValidationError,
  GrokResourceNotFoundError,
  GrokAuthenticationError,
  GrokPermissionError,
  GrokRateLimitError,
  GrokBadRequestError,
  GrokServerError,
  isGrokError,
} from "./src/common/grok-errors.js";
import { VERSION } from "./src/common/version.js";

// If fetch doesn't exist in global scope, add it
if (!globalThis.fetch) {
  globalThis.fetch = fetch as unknown as typeof global.fetch;
}

const server = new Server(
  {
    name: "grok-mcp-server",
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

function formatGrokError(error: GrokError): string {
  let message = `Grok API Error: ${error.message}`;

  if (error instanceof GrokValidationError) {
    message = `Validation Error: ${error.message}`;
    if (error.response) {
      message += `\nDetails: ${JSON.stringify(error.response)}`;
    }
  } else if (error instanceof GrokResourceNotFoundError) {
    message = `Not Found: ${error.message}`;
  } else if (error instanceof GrokAuthenticationError) {
    message = `Authentication Failed: ${error.message}`;
  } else if (error instanceof GrokPermissionError) {
    message = `Permission Denied: ${error.message}`;
  } else if (error instanceof GrokRateLimitError) {
    message = `Rate Limit Exceeded: ${
      error.message
    }\nResets at: ${error.resetAt.toISOString()}`;
  } else if (error instanceof GrokBadRequestError) {
    message = `Bad Request: ${error.message}`;
  } else if (error instanceof GrokServerError) {
    message = `Server Error: ${error.message}`;
  }

  return message;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_models",
        description: "List all models available for use with the Grok API",
        inputSchema: zodToJsonSchema(models.ListModelsOptionsSchema),
      },
      {
        name: "get_model",
        description: "Get details about a specific model",
        inputSchema: zodToJsonSchema(models.GetModelSchema),
      },
      {
        name: "create_chat_completion",
        description: "Create a chat completion with the Grok API",
        inputSchema: zodToJsonSchema(chat.ChatCompletionRequestSchema),
      },
      {
        name: "create_completion",
        description: "Create a text completion with the Grok API",
        inputSchema: zodToJsonSchema(completions.CompletionsRequestSchema),
      },
      {
        name: "create_embeddings",
        description: "Create embeddings for text with the Grok API",
        inputSchema: zodToJsonSchema(embeddings.EmbeddingsRequestSchema),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    switch (request.params.name) {
      case "list_models": {
        const result = await models.listModels();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "get_model": {
        const args = models.GetModelSchema.parse(request.params.arguments);
        const result = await models.getModel(args.model_id);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "create_chat_completion": {
        const args = chat.ChatCompletionRequestSchema.parse(
          request.params.arguments
        );

        try {
          console.error(
            `[DEBUG] Creating chat completion with model: ${args.model}`
          );

          const completion = await chat.createChatCompletion(args);

          console.error(`[DEBUG] Chat completion created successfully`);
          return {
            content: [
              { type: "text", text: JSON.stringify(completion, null, 2) },
            ],
          };
        } catch (err) {
          // Type guard for Error objects
          const error = err instanceof Error ? err : new Error(String(err));

          console.error(`[ERROR] Failed to create chat completion:`, error);

          if (error instanceof GrokResourceNotFoundError) {
            throw new Error(
              `Model '${args.model}' not found. Please verify:\n` +
                `1. The model exists\n` +
                `2. You have correct access permissions\n` +
                `3. The model name is spelled correctly`
            );
          }

          // Safely access error properties
          throw new Error(
            `Failed to create chat completion: ${error.message}${
              error.stack ? `\nStack: ${error.stack}` : ""
            }`
          );
        }
      }

      case "create_completion": {
        const args = completions.CompletionsRequestSchema.parse(
          request.params.arguments
        );
        const result = await completions.createCompletion(args);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "create_embeddings": {
        const args = embeddings.EmbeddingsRequestSchema.parse(
          request.params.arguments
        );
        const result = await embeddings.createEmbeddings(args);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
    }
    if (isGrokError(error)) {
      throw new Error(formatGrokError(error));
    }
    throw error;
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Grok MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
