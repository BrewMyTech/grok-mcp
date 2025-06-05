import { z } from "zod";
import { grokRequest } from "../common/grok-api.ts";

// Schema definitions
export const ModelSchema = z.object({
  id: z.string(),
  created: z.number().optional(),
  object: z.string(),
  owned_by: z.string().optional(),
});

export const ListModelsResponseSchema = z.object({
  object: z.string(),
  data: z.array(ModelSchema),
});

export const ListModelsOptionsSchema = z.object({});

export const GetModelSchema = z.object({
  model_id: z.string().describe("The ID of the model to retrieve"),
});

// Function implementations
export async function listModels(): Promise<
  z.infer<typeof ListModelsResponseSchema>
> {
  const response = await grokRequest("models");
  return ListModelsResponseSchema.parse(response);
}

export async function getModel(
  modelId: string
): Promise<z.infer<typeof ModelSchema>> {
  const response = await grokRequest(`models/${modelId}`);
  return ModelSchema.parse(response);
}
