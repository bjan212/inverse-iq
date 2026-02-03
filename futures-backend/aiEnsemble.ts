import { invokeLLM } from "./_core/llm";
import { generatePromptFields, type PromptFields, type AIProvider } from "./externalAI";

export interface EnsembleResult {
  fields: PromptFields;
  modelsUsed: AIProvider[];
  synthesisNotes?: string;
}

interface ModelResponse {
  provider: AIProvider;
  fields: PromptFields | null;
  error?: string;
}

/**
 * Query all available AI models in parallel
 */
async function queryAllModels(
  description: string,
  availableKeys: { openai?: string; anthropic?: string }
): Promise<ModelResponse[]> {
  const promises: Promise<ModelResponse>[] = [];

  // Always query built-in
  promises.push(
    generatePromptFields({
      description,
      provider: "built-in",
    })
      .then((fields) => ({ provider: "built-in" as AIProvider, fields }))
      .catch((error) => ({
        provider: "built-in" as AIProvider,
        fields: null,
        error: error.message,
      }))
  );

  // Query OpenAI if key available
  if (availableKeys.openai) {
    promises.push(
      generatePromptFields({
        description,
        provider: "openai",
        apiKey: availableKeys.openai,
        model: "gpt-4",
      })
        .then((fields) => ({ provider: "openai" as AIProvider, fields }))
        .catch((error) => ({
          provider: "openai" as AIProvider,
          fields: null,
          error: error.message,
        }))
    );
  }

  // Query Anthropic if key available
  if (availableKeys.anthropic) {
    promises.push(
      generatePromptFields({
        description,
        provider: "anthropic",
        apiKey: availableKeys.anthropic,
        model: "claude-3-5-sonnet-20241022",
      })
        .then((fields) => ({ provider: "anthropic" as AIProvider, fields }))
        .catch((error) => ({
          provider: "anthropic" as AIProvider,
          fields: null,
          error: error.message,
        }))
    );
  }

  return Promise.all(promises);
}

/**
 * Use meta-AI to synthesize the best elements from multiple responses
 */
async function synthesizeResponses(
  description: string,
  responses: ModelResponse[]
): Promise<PromptFields> {
  // Filter successful responses
  const successfulResponses = responses.filter((r) => r.fields !== null);

  if (successfulResponses.length === 0) {
    throw new Error("All AI models failed to generate responses");
  }

  // If only one successful response, return it directly
  if (successfulResponses.length === 1) {
    return successfulResponses[0]!.fields!;
  }

  // Build synthesis prompt
  const responsesText = successfulResponses
    .map((r, idx) => {
      return `### Response from ${r.provider.toUpperCase()} (Model ${idx + 1}):\n${JSON.stringify(r.fields, null, 2)}`;
    })
    .join("\n\n");

  const synthesisPrompt = `You are a meta-AI tasked with creating the BEST possible prompt framework by analyzing and synthesizing multiple AI-generated responses.

Original user request: "${description}"

You have received ${successfulResponses.length} different responses from various AI models. Your job is to:
1. Identify the strongest, most insightful elements from each response
2. Combine them intelligently into a superior unified result
3. Ensure internal consistency across all fields
4. Maintain professional quality and relevance

${responsesText}

Now, synthesize these responses into a single, enhanced result that takes the best from each. Return ONLY a valid JSON object with these exact keys: actor, input, mission, memory, assets, actions, original, concrete, evident, assertive, narrative

The synthesized result should be:
- More comprehensive than any single response
- Internally consistent
- Professional and detailed
- The "best of all worlds"`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an expert meta-AI that synthesizes multiple AI outputs into superior combined results.",
      },
      { role: "user", content: synthesisPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "synthesized_prompt_fields",
        strict: true,
        schema: {
          type: "object",
          properties: {
            actor: { type: "string" },
            input: { type: "string" },
            mission: { type: "string" },
            memory: { type: "string" },
            assets: { type: "string" },
            actions: { type: "string" },
            original: { type: "string" },
            concrete: { type: "string" },
            evident: { type: "string" },
            assertive: { type: "string" },
            narrative: { type: "string" },
          },
          required: [
            "actor",
            "input",
            "mission",
            "memory",
            "assets",
            "actions",
            "original",
            "concrete",
            "evident",
            "assertive",
            "narrative",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("No response from meta-AI synthesis");
  }

  return JSON.parse(content);
}

/**
 * Main ensemble function: query multiple models and synthesize results
 */
export async function generateWithEnsemble(
  description: string,
  availableKeys: { openai?: string; anthropic?: string } = {}
): Promise<EnsembleResult> {
  console.log("[AI Ensemble] Starting multi-model query...");

  // Query all available models in parallel
  const responses = await queryAllModels(description, availableKeys);

  console.log(
    `[AI Ensemble] Received ${responses.length} responses:`,
    responses.map((r) => ({ provider: r.provider, success: r.fields !== null }))
  );

  // Synthesize the best result
  const synthesizedFields = await synthesizeResponses(description, responses);

  const modelsUsed = responses
    .filter((r) => r.fields !== null)
    .map((r) => r.provider);

  console.log(`[AI Ensemble] Synthesis complete using models: ${modelsUsed.join(", ")}`);

  return {
    fields: synthesizedFields,
    modelsUsed,
    synthesisNotes: `Combined insights from ${modelsUsed.length} AI model(s): ${modelsUsed.join(", ")}`,
  };
}
