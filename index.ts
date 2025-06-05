#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { z } from "zod";
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

if (!globalThis.fetch) {
  globalThis.fetch = fetch as unknown as typeof global.fetch;
}

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
    message = `Rate Limit Exceeded: ${error.message}\nResets at: ${error.resetAt.toISOString()}`;
  } else if (error instanceof GrokBadRequestError) {
    message = `Bad Request: ${error.message}`;
  } else if (error instanceof GrokServerError) {
    message = `Server Error: ${error.message}`;
  }

  return message;
}

function handleError(error: unknown): never {
  if (error instanceof z.ZodError) {
    throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
  }
  if (isGrokError(error)) {
    throw new Error(formatGrokError(error));
  }
  throw error instanceof Error ? error : new Error(String(error));
}

const server = new FastMCP({
  name: "grok-mcp-server",
  version: VERSION,
});

server.addTool({
  name: "list_models",
  description: "List all models available for use with the Grok API",
  parameters: models.ListModelsOptionsSchema,
  execute: async () => {
    try {
      const result = await models.listModels();
      return JSON.stringify(result, null, 2);
    } catch (err) {
      handleError(err);
    }
  },
});

server.addTool({
  name: "get_model",
  description: "Get details about a specific model",
  parameters: models.GetModelSchema,
  execute: async (args) => {
    try {
      const result = await models.getModel(args.model_id);
      return JSON.stringify(result, null, 2);
    } catch (err) {
      handleError(err);
    }
  },
});

server.addTool({
  name: "create_chat_completion",
  description: "Create a chat completion with the Grok API",
  parameters: chat.ChatCompletionRequestSchema,
  execute: async (args) => {
    try {
      console.error(`[DEBUG] Creating chat completion with model: ${args.model}`);
      const completion = await chat.createChatCompletion(args);
      console.error(`[DEBUG] Chat completion created successfully`);
      return JSON.stringify(completion, null, 2);
    } catch (err) {
      console.error(`[ERROR] Failed to create chat completion:`, err);
      if (err instanceof GrokResourceNotFoundError) {
        throw new Error(
          `Model '${args.model}' not found. Please verify:\n` +
            `1. The model exists\n` +
            `2. You have correct access permissions\n` +
            `3. The model name is spelled correctly`
        );
      }
      handleError(err);
    }
  },
});

server.addTool({
  name: "create_completion",
  description: "Create a text completion with the Grok API",
  parameters: completions.CompletionsRequestSchema,
  execute: async (args) => {
    try {
      const result = await completions.createCompletion(args);
      return JSON.stringify(result, null, 2);
    } catch (err) {
      handleError(err);
    }
  },
});

server.addTool({
  name: "create_embeddings",
  description: "Create embeddings for text with the Grok API",
  parameters: embeddings.EmbeddingsRequestSchema,
  execute: async (args) => {
    try {
      const result = await embeddings.createEmbeddings(args);
      return JSON.stringify(result, null, 2);
    } catch (err) {
      handleError(err);
    }
  },
});

async function startServer() {
  await server.start({ transportType: "stdio" });
  console.error("Grok MCP Server running on stdio");
}

startServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
