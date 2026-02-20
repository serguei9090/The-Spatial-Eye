import { toast } from "sonner";

import { GEMINI_REGISTRY } from "@/lib/gemini/registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ModelErrorKind = "rate_limit" | "billing" | "not_found" | "generic";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a human-readable model name from the registry.
 * Falls back to the raw modelId if it doesn't match any registry entry.
 */
function resolveDisplayName(modelId: string): string {
  // Strip the "models/" prefix that some callsites include
  const stripped = modelId.replace(/^models\//, "");
  return (
    Object.values(GEMINI_REGISTRY).find((m) => m.id === stripped || m.id === modelId)
      ?.displayName ?? modelId
  );
}

/**
 * Classify an error value into a user-facing category.
 */
function classifyError(error: unknown): { kind: ModelErrorKind; raw: string } {
  let raw: string;

  if (error instanceof Error) {
    raw = error.message;
  } else if (typeof error === "string") {
    raw = error;
  } else {
    raw = String(error);
  }

  const lower = raw.toLowerCase();

  if (
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("rate") ||
    lower.includes("429") ||
    lower.includes("too many requests")
  ) {
    return { kind: "rate_limit", raw };
  }

  if (
    lower.includes("billing") ||
    lower.includes("403") ||
    lower.includes("permission") ||
    lower.includes("forbidden") ||
    lower.includes("access denied")
  ) {
    return { kind: "billing", raw };
  }

  if (
    lower.includes("not found") ||
    lower.includes("404") ||
    lower.includes("model not found") ||
    lower.includes("does not exist")
  ) {
    return { kind: "not_found", raw };
  }

  return { kind: "generic", raw };
}

const KIND_DESCRIPTIONS: Record<ModelErrorKind, string> = {
  rate_limit: "Rate limit or quota exceeded — the model will retry shortly.",
  billing: "Billing issue or access denied — check your API plan.",
  not_found: "Model not found — it may have been deprecated or renamed.",
  generic: "An unexpected error occurred with this model.",
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify a Gemini API error and surface a named sonner toast.
 *
 * @param modelId  - The raw model ID string (with or without "models/" prefix).
 * @param error    - Any caught error value.
 * @param extra    - Optional override for the toast description.
 *
 * Usage:
 * ```ts
 * import { notifyModelError } from "@/lib/gemini/model-error";
 *
 * try {
 *   await client.models.generateContent({ model: GEMINI_MODELS.imageSynthesis, ... });
 * } catch (err) {
 *   notifyModelError(GEMINI_MODELS.imageSynthesis, err);
 * }
 * ```
 */
export function notifyModelError(modelId: string, error: unknown, extra?: string): void {
  const { kind, raw } = classifyError(error);
  const displayName = resolveDisplayName(modelId);
  const description = extra ?? KIND_DESCRIPTIONS[kind];

  console.error(`[ModelError] ${displayName} (${kind}):`, raw);

  toast.error(`${displayName} is not available`, {
    // Deduplicate: same model can only show one toast at a time
    id: `model-error-${modelId.replaceAll(/[^a-z0-9]/gi, "-")}`,
    description,
    duration: kind === "rate_limit" ? 6000 : 10000,
  });
}

/**
 * Returns true if an error value looks like a Gemini model API error
 * (rate limit, billing, quota, not found). Useful for the global handler
 * to decide whether to route through notifyModelError.
 */
export function isModelApiError(error: unknown): boolean {
  let msg: string;
  if (error instanceof Error) {
    msg = error.message;
  } else if (typeof error === "string") {
    msg = error;
  } else {
    msg = String(error);
  }

  const lower = msg.toLowerCase();
  return (
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("billing") ||
    lower.includes("403") ||
    lower.includes("permission") ||
    lower.includes("forbidden") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("model not found") ||
    lower.includes("not found")
  );
}

/**
 * Attempt to extract a model ID from a raw Google API error message.
 * Returns null if none can be found.
 *
 * Example strings it handles:
 *   "models/gemini-2.5-flash-image is not found"
 *   "Request to model gemini-2-flash exceeded quota"
 */
export function extractModelId(message: string): string | null {
  // "models/..." prefix pattern
  const prefixed = message.match(/models\/([\w.-]+)/);
  if (prefixed) return prefixed[1];

  // Match known model IDs from the registry
  for (const meta of Object.values(GEMINI_REGISTRY)) {
    if (message.includes(meta.id)) return meta.id;
  }

  return null;
}
