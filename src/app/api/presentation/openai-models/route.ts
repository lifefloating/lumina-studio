import { env } from "@/env";
import { createLogger } from "@/lib/observability/logger";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

interface OpenAIModelInfo {
  id: string;
  name: string;
  provider: "openai";
}

const routeLogger = createLogger("api:presentation-openai-models");
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const OPENAI_FETCH_TIMEOUT_MS = 5_000;

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  controller.signal.addEventListener("abort", () => clearTimeout(timeout), {
    once: true,
  });
  return controller.signal;
}

function createModelEndpointCandidates(baseUrl: string): string[] {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const candidates = [`${normalizedBaseUrl}/models`];

  if (!normalizedBaseUrl.endsWith("/v1")) {
    candidates.push(`${normalizedBaseUrl}/v1/models`);
  }

  return [...new Set(candidates)];
}

function extractModelIds(payload: unknown): string[] {
  const candidateArrays: unknown[][] = [
    Array.isArray((payload as { data?: unknown[] } | null)?.data)
      ? ((payload as { data: unknown[] }).data ?? [])
      : [],
    Array.isArray((payload as { models?: unknown[] } | null)?.models)
      ? ((payload as { models: unknown[] }).models ?? [])
      : [],
    Array.isArray(payload) ? payload : [],
  ];

  const modelIds = candidateArrays.flatMap((candidates) =>
    candidates.flatMap((candidate) => {
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
        return [];
      }

      const record = candidate as Record<string, unknown>;
      const modelId = [record.id, record.model, record.name].find(
        (value) => typeof value === "string" && value.trim().length > 0,
      );

      return typeof modelId === "string" ? [modelId.trim()] : [];
    }),
  );

  return [...new Set(modelIds)];
}

async function fetchModelsFromEndpoint(
  endpoint: string,
  apiKey: string,
): Promise<OpenAIModelInfo[]> {
  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    signal: createTimeoutSignal(OPENAI_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Models endpoint responded with ${response.status}`);
  }

  return extractModelIds(await response.json()).map((modelId) => ({
    id: `openai-${modelId}`,
    name: modelId,
    provider: "openai" as const,
  }));
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const baseUrl = env.OPENAI_BASE_URL?.trim() || DEFAULT_OPENAI_BASE_URL;
  let lastError: Error | null = null;

  for (const endpoint of createModelEndpointCandidates(baseUrl)) {
    try {
      const models = await fetchModelsFromEndpoint(endpoint, apiKey);
      routeLogger.info("Fetched OpenAI-compatible model catalog", {
        endpoint,
        count: models.length,
      });

      return NextResponse.json(
        { models },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      routeLogger.info("OpenAI-compatible model endpoint candidate failed", {
        endpoint,
        error: lastError.message,
      });
    }
  }

  return NextResponse.json(
    {
      error:
        lastError?.message ??
        "Failed to fetch OpenAI-compatible model catalog",
    },
    { status: 502 },
  );
}
