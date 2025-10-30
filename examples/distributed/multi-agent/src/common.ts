import OpenAI from "openai";

export const ANALYSIS_AGENT_ADDR = "analysis@fame.fabric";
export const SUMMARIZER_AGENT_ADDR = "summarizer@fame.fabric";
export const SENTIMENT_AGENT_ADDR = "sentiment@fame.fabric";

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
