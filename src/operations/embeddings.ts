import { z } from "zod";
import { grokRequest } from "../common/grok-api.ts";

// Schema definitions
export const EmbeddingObjectSchema = z.object({
  object: z.literal("embedding"),
  embedding: z.array(z.number()),
  index: z.number(),
});

export const EmbeddingsResponseSchema = z.object({
  object: z.literal("list"),
  data: z.array(EmbeddingObjectSchema),
  model: z.string(),
  usage: z.object({
    prompt_tokens: z.number(),
    total_tokens: z.number(),
  }),
});

export const EmbeddingsRequestSchema = z.object({
  model: z.string().describe("ID of the model to use"),
  input: z
    .union([
      z.string(),
      z.array(z.string()),
      z.array(z.number()),
      z.array(z.array(z.number())),
    ])
    .describe("Input text to get embeddings for"),
  encoding_format: z
    .enum(["float", "base64"])
    .optional()
    .describe("The format to return the embeddings in"),
  dimensions: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      "The number of dimensions the resulting output embeddings should have"
    ),
  user: z.string().optional().describe("A unique user identifier"),
});

// Function implementations
export async function createEmbeddings(
  options: z.infer<typeof EmbeddingsRequestSchema>
): Promise<z.infer<typeof EmbeddingsResponseSchema>> {
  const response = await grokRequest("embeddings", {
    method: "POST",
    body: options,
  });

  return EmbeddingsResponseSchema.parse(response);
}
