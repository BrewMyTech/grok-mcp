import { z } from "zod";
import { grokRequest } from "../common/grok-api";

// Schema definitions
const CompletionsChoiceSchema = z.object({
  text: z.string(),
  index: z.number(),
  logprobs: z
    .object({
      token_logprobs: z.array(z.number()).nullable(),
      top_logprobs: z.array(z.record(z.number())).nullable(),
      tokens: z.array(z.string()).nullable(),
    })
    .nullable(),
  finish_reason: z.string().nullable(),
});

const CompletionsResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(CompletionsChoiceSchema),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
});

export const CompletionsRequestSchema = z.object({
  model: z.string().describe("ID of the model to use"),
  prompt: z
    .union([z.string(), z.array(z.string())])
    .describe("The prompt(s) to generate completions for"),
  suffix: z
    .string()
    .optional()
    .describe("The suffix that comes after a completion of inserted text"),
  max_tokens: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Maximum number of tokens to generate"),
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
    .describe("Number of completions to generate"),
  stream: z
    .boolean()
    .optional()
    .describe("Whether to stream back partial progress"),
  logprobs: z
    .number()
    .int()
    .min(0)
    .max(5)
    .optional()
    .describe("Include log probabilities on most likely tokens (0-5)"),
  echo: z
    .boolean()
    .optional()
    .describe("Echo back the prompt in addition to the completion"),
  stop: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe("Sequences where the API will stop generating further tokens"),
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
  seed: z
    .number()
    .int()
    .optional()
    .describe(
      "If specified, results will be more deterministic when the same seed is used"
    ),
  best_of: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      "Generate best_of completions server-side and return the best one"
    ),
  user: z.string().optional().describe("A unique user identifier"),
});

// Function implementations
export async function createCompletion(
  options: z.infer<typeof CompletionsRequestSchema>
): Promise<z.infer<typeof CompletionsResponseSchema>> {
  const response = await grokRequest("completions", {
    method: "POST",
    body: options,
  });

  return CompletionsResponseSchema.parse(response);
}
