import { z } from "zod";

export const AgentResponseSchema = z
  .object({
    score: z.number().min(0).max(100),
    confidence: z.number().min(0).max(100),
    score_breakdown: z.object({
      primary: z.number().min(0).max(100),
      secondary: z.number().min(0).max(100),
      tertiary: z.number().min(0).max(100),
    }).optional(),
    pros: z.array(z.string().max(300)).max(10),
    cons: z.array(z.string().max(300)).max(10),
    evidence: z.array(z.string().max(500)).max(5).optional(),
    rationale: z.string().max(1200),
    uncertainty_flags: z.array(z.string().max(200)).max(5).optional(),
  })
  .passthrough();

export const AgentResponseSchemaLegacy = z
  .object({
    score: z.number().min(0).max(100),
    pros: z.array(z.string().max(300)).max(10),
    cons: z.array(z.string().max(300)).max(10),
    rationale: z.string().max(1200),
  })
  .passthrough();

function extractJSON(text) {
  const trimmed = text.trim();

  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

export function parseAndValidate(text) {
  const cleaned = extractJSON(text);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Model response is not valid JSON");
  }

  const full = AgentResponseSchema.safeParse(parsed);
  if (full.success) return full.data;

  const legacy = AgentResponseSchemaLegacy.safeParse(parsed);
  if (legacy.success) {
    return {
      ...legacy.data,
      confidence: 50,
      score_breakdown: {
        primary: legacy.data.score,
        secondary: legacy.data.score,
        tertiary: legacy.data.score,
      },
      evidence: [],
      uncertainty_flags: ["legacy_response_format"],
    };
  }

  throw new Error(`Model response failed schema validation: ${full.error.message}`);
}

export function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
