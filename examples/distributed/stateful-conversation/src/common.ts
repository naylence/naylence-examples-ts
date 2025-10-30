import OpenAI from "openai";

export const AGENT_ADDR = "chat@fame.fabric";

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey });
}

export function getModelName(): string {
  return process.env.MODEL_NAME || "gpt-4o-mini";
}
