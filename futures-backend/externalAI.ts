import { invokeLLM } from "./_core/llm";

export type AIProvider = "built-in" | "openai" | "anthropic";

export interface GeneratePromptFieldsInput {
  description: string;
  provider: AIProvider;
  apiKey?: string;
  model?: string;
}

export interface PromptFields {
  actor: string;
  input: string;
  mission: string;
  memory: string;
  assets: string;
  actions: string;
  original: string;
  concrete: string;
  evident: string;
  assertive: string;
  narrative: string;
}

const SYSTEM_PROMPT = `You are an expert AI prompt engineering assistant. Your task is to take a single-line description from the user and generate complete, professional content for all fields in the AIM, MAP, and OCEAN prompt frameworks.

The frameworks are:
- **AIM**: Actor (who the AI should be), Input (context/data provided), Mission (primary goal)
- **MAP**: Memory (relevant history), Assets (files/data references), Actions (specific steps)
- **OCEAN**: Original (unique approach), Concrete (specific details), Evident (evidence backing), Assertive (tone), Narrative (storytelling structure)

Generate content that is:
1. Professional and detailed (2-4 sentences per field)
2. Internally consistent across all fields
3. Directly relevant to the user's description
4. Ready to use without further editing

Return ONLY a valid JSON object with these exact keys: actor, input, mission, memory, assets, actions, original, concrete, evident, assertive, narrative`;

const RESPONSE_SCHEMA = {
  type: "object" as const,
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
  required: ["actor", "input", "mission", "memory", "assets", "actions", "original", "concrete", "evident", "assertive", "narrative"],
  additionalProperties: false,
};

/**
 * Generate prompt fields using built-in Manus AI service
 */
async function generateWithBuiltIn(description: string): Promise<PromptFields> {
  const userPrompt = `Generate all prompt framework fields for this request:\n\n"${description}"\n\nReturn the JSON object with all 11 fields filled.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "prompt_fields",
        strict: true,
        schema: RESPONSE_SCHEMA,
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("No response from AI");
  }

  return JSON.parse(content);
}

/**
 * Generate prompt fields using OpenAI API
 */
async function generateWithOpenAI(description: string, apiKey: string, model: string = "gpt-4"): Promise<PromptFields> {
  const userPrompt = `Generate all prompt framework fields for this request:\n\n"${description}"\n\nReturn the JSON object with all 11 fields filled.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "prompt_fields",
          strict: true,
          schema: RESPONSE_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return JSON.parse(content);
}

/**
 * Generate prompt fields using Anthropic Claude API
 */
async function generateWithAnthropic(description: string, apiKey: string, model: string = "claude-3-5-sonnet-20241022"): Promise<PromptFields> {
  const userPrompt = `Generate all prompt framework fields for this request:\n\n"${description}"\n\nReturn the JSON object with all 11 fields filled.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;
  
  if (!content) {
    throw new Error("No response from Anthropic");
  }

  // Anthropic doesn't support structured output natively, so we parse the JSON from text
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to extract JSON from Anthropic response");
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Main function to generate prompt fields with fallback logic
 */
export async function generatePromptFields(input: GeneratePromptFieldsInput): Promise<PromptFields> {
  const { description, provider, apiKey, model } = input;

  try {
    switch (provider) {
      case "openai":
        if (!apiKey) throw new Error("OpenAI API key is required");
        return await generateWithOpenAI(description, apiKey, model);
      
      case "anthropic":
        if (!apiKey) throw new Error("Anthropic API key is required");
        return await generateWithAnthropic(description, apiKey, model);
      
      case "built-in":
      default:
        return await generateWithBuiltIn(description);
    }
  } catch (error) {
    // Fallback to built-in service if external API fails
    if (provider !== "built-in") {
      console.error(`External API (${provider}) failed, falling back to built-in:`, error);
      return await generateWithBuiltIn(description);
    }
    throw error;
  }
}
