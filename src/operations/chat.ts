import { z } from "zod";
import { grokRequest } from "../common/grok-api.ts";

// Basic message schema
const MessageContentTextSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const MessageContentImageSchema = z.object({
  type: z.literal("image"),
  image_url: z.object({
    url: z.string(),
    detail: z.enum(["low", "high", "auto"]).optional(),
  }),
});

const MessageContentSchema = z.union([
  MessageContentTextSchema,
  MessageContentImageSchema,
]);

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.union([z.string(), z.array(MessageContentSchema)]),
  name: z.string().optional(),
});

// Tool schemas
export const FunctionParameterSchema = z.record(
  z
    .object({
      type: z.string(),
      description: z.string().optional(),
      enum: z.array(z.string()).optional(),
      items: z.any().optional(),
      properties: z.record(z.any()).optional(),
      required: z.array(z.string()).optional(),
    })
    .passthrough()
);

export const FunctionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  parameters: z
    .object({
      type: z.literal("object"),
      properties: z.record(z.any()).optional(),
      required: z.array(z.string()).optional(),
    })
    .optional(),
});

export const ToolSchema = z.object({
  type: z.string(),
  function: FunctionSchema,
});

const ToolCallSchema = z.object({
  id: z.string(),
  type: z.literal("function"),
  function: z.object({
    name: z.string(),
    arguments: z.string(),
  }),
});

// Response schemas
const ChatCompletionChoiceSchema = z.object({
  index: z.number(),
  message: MessageSchema,
  finish_reason: z.string().nullable(),
});

const ChatCompletionSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(ChatCompletionChoiceSchema),
  usage: z
    .object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number(),
    })
    .optional(),
  citations: z
    .array(z.string())
    .optional()
    .describe(
      "URLs of data sources used when search_parameters.return_citations is true"
    ),
});

// Search Parameters Schemas
const WebSourceSchema = z.object({
  type: z.literal("web"),
  country: z.string().length(2).optional().describe("ISO alpha-2 country code"),
  excluded_websites: z.array(z.string()).max(5).optional(),
  safe_search: z.boolean().optional(),
});

const XSourceSchema = z.object({
  type: z.literal("x"),
  x_handles: z.array(z.string()).optional(),
});

const NewsSourceSchema = z.object({
  type: z.literal("news"),
  country: z.string().length(2).optional().describe("ISO alpha-2 country code"),
  excluded_websites: z.array(z.string()).max(5).optional(),
  safe_search: z.boolean().optional(),
});

const RssSourceSchema = z.object({
  type: z.literal("rss"),
  links: z.array(z.string()),
});

const SearchSourceSchema = z.union([
  WebSourceSchema,
  XSourceSchema,
  NewsSourceSchema,
  RssSourceSchema,
]);

const SearchParametersSchema = z.object({
  mode: z.enum(["off", "auto", "on"]).optional().default("auto"),
  return_citations: z.boolean().optional(),
  from_date: z.string().optional().describe("ISO 8601 format, e.g. YYYY-MM-DD"),
  to_date: z.string().optional().describe("ISO 8601 format, e.g. YYYY-MM-DD"),
  max_search_results: z.number().int().positive().optional().default(20),
  sources: z.array(SearchSourceSchema).optional(),
});

// Request schemas
export const ChatCompletionRequestSchema = z.object({
  model: z.string().describe("ID of the model to use"),
  messages: z
    .array(MessageSchema)
    .describe("Messages to generate chat completions for"),
  tools: z
    .array(ToolSchema)
    .optional()
    .describe("List of tools the model may call"),
  tool_choice: z
    .union([
      z.literal("auto"),
      z.literal("none"),
      z.object({
        type: z.literal("function"),
        function: z.object({
          name: z
            .string()
            .describe("Force the model to call the specified function"),
        }),
      }),
    ])
    .optional()
    .describe("Controls which (if any) tool is called by the model"),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .describe("Sampling temperature (0-2)"),
  top_p: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Nucleus sampling parameter (0-1)"),
  n: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Number of chat completion choices to generate"),
  stream: z
    .boolean()
    .optional()
    .describe("If set, partial message deltas will be sent"),
  max_tokens: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Maximum number of tokens to generate"),
  presence_penalty: z
    .number()
    .min(-2)
    .max(2)
    .optional()
    .describe("Penalty for new tokens based on presence in text (-2 to 2)"),
  frequency_penalty: z
    .number()
    .min(-2)
    .max(2)
    .optional()
    .describe("Penalty for new tokens based on frequency in text (-2 to 2)"),
  logit_bias: z
    .record(z.string(), z.number())
    .optional()
    .describe(
      "Map of token IDs to bias scores (-100 to 100) that influence generation"
    ),
  response_format: z
    .object({ type: z.enum(["text", "json_object"]) })
    .optional()
    .describe(
      "Specify 'json_object' to receive JSON response or 'text' for raw text"
    ),
  seed: z
    .number()
    .int()
    .optional()
    .describe(
      "If specified, results will be more deterministic when the same seed is used"
    ),
  stop: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe("Sequences where the API will stop generating further tokens"),
  user: z.string().optional().describe("A unique user identifier"),
  search_parameters: SearchParametersSchema.optional().describe(
    "Parameters for live search capabilities"
  ),
});

// Function implementations
export async function createChatCompletion(
  options: z.infer<typeof ChatCompletionRequestSchema>
): Promise<z.infer<typeof ChatCompletionSchema>> {
  const response = await grokRequest("chat/completions", {
    method: "POST",
    body: options,
  });

  return ChatCompletionSchema.parse(response);
}
