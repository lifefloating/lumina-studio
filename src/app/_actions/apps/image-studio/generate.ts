"use server";

import {
  generateImageAction as generateTogetherImageAction,
  type ImageModelList as TogetherImageModelList,
} from "@/app/_actions/image/generate";
import {
  MAX_REFERENCE_IMAGES,
  type GenerateImageOptions,
  type ImageSource,
  type ReferenceImage,
} from "@/app/_actions/apps/image-studio/shared";
import { env } from "@/env";
import { requireOptionalIntegration } from "@/lib/env/optional-integrations";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { createR2ObjectKey, uploadBufferToR2 } from "@/server/r2";

export type GptImageModelList = "gpt-image2";

export type ImageModelList = TogetherImageModelList | GptImageModelList;

type OpenAICompatibleImageResponse = {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
};

function resolveImagesGenerationUrl(baseUrl: string) {
  const trimmedBaseUrl = baseUrl.replace(/\/+$/, "");
  return trimmedBaseUrl.endsWith("/v1")
    ? `${trimmedBaseUrl}/images/generations`
    : `${trimmedBaseUrl}/v1/images/generations`;
}

function resolveImagesEditUrl(baseUrl: string) {
  const trimmedBaseUrl = baseUrl.replace(/\/+$/, "");
  return trimmedBaseUrl.endsWith("/v1")
    ? `${trimmedBaseUrl}/images/edits`
    : `${trimmedBaseUrl}/v1/images/edits`;
}

// Relay / proxied image endpoints are slow (single requests observed at
// 100s–250s) and frequently drop idle keep-alive sockets, surfacing as
// `UND_ERR_SOCKET: other side closed`. We therefore use a generous per-request
// timeout plus a few retries with exponential backoff. All knobs are env-tunable.
const DEFAULT_IMAGE_TIMEOUT_MS = 300_000;
const DEFAULT_IMAGE_MAX_RETRIES = 3;

function getImageTimeoutMs() {
  const parsed = Number(env.GPT_IMAGE2_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_IMAGE_TIMEOUT_MS;
}

function getImageMaxRetries() {
  const parsed = Number(env.GPT_IMAGE2_MAX_RETRIES);
  return Number.isFinite(parsed) && parsed >= 0
    ? Math.floor(parsed)
    : DEFAULT_IMAGE_MAX_RETRIES;
}

function isRetryableError(error: unknown) {
  if (!(error instanceof Error)) return false;
  // AbortError = our own timeout firing; retry against the slow relay.
  if (error.name === "AbortError" || error.name === "TimeoutError") return true;
  // Socket-level failures from undici (relay closed the connection, reset, etc.)
  const cause = (error as { cause?: { code?: string } }).cause;
  const code = cause?.code;
  if (
    code === "UND_ERR_SOCKET" ||
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "EPIPE" ||
    code === "ENOTFOUND"
  ) {
    return true;
  }
  return error.message.includes("fetch failed");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchImageWithRetry(url: string, init: RequestInit) {
  const maxRetries = getImageMaxRetries();
  const timeoutMs = getImageTimeoutMs();
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });

      // Retry transient server-side / rate-limit responses.
      if (
        (response.status >= 500 || response.status === 408 || response.status === 429) &&
        attempt < maxRetries
      ) {
        lastError = new Error(`GPT Image 2 API error: ${response.status}`);
        await sleep(Math.min(2_000 * 2 ** attempt, 15_000));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries && isRetryableError(error)) {
        // Exponential backoff: 2s, 4s, 8s ... capped at 15s.
        await sleep(Math.min(2_000 * 2 ** attempt, 15_000));
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("GPT Image 2 request failed");
}

async function getErrorMessage(response: Response) {
  const errorText = await response.text();
  if (!errorText) return "";

  try {
    const errorJson = JSON.parse(errorText) as {
      error?: { message?: string };
      message?: string;
    };
    return errorJson.error?.message ?? errorJson.message ?? errorText;
  } catch {
    return errorText.slice(0, 400);
  }
}

async function persistGeneratedImageToR2(
  imageBuffer: Uint8Array,
  prompt: string,
  userId: string,
  filePrefix: string,
  contentType = "image/png",
  source: ImageSource = "image_studio",
) {
  const extension = contentType.split("/")[1]?.split(";")[0] ?? "png";
  const filename = `${filePrefix}_${Date.now()}.${extension}`;
  const key = createR2ObjectKey(filename);
  const url = await uploadBufferToR2({
    key,
    body: imageBuffer,
    contentType,
  });

  return db.generatedImage.create({
    data: {
      url,
      prompt,
      userId,
      source,
    },
  });
}

async function persistGeneratedImageUrlToR2(
  imageUrl: string,
  prompt: string,
  userId: string,
  filePrefix: string,
  source: ImageSource = "image_studio",
) {
  const imageResponse = await fetch(imageUrl, {
    signal: AbortSignal.timeout(getImageTimeoutMs()),
  });
  if (!imageResponse.ok) {
    throw new Error("Failed to download generated image");
  }

  const imageBlob = await imageResponse.blob();
  const imageBuffer = new Uint8Array(await imageBlob.arrayBuffer());

  return persistGeneratedImageToR2(
    imageBuffer,
    prompt,
    userId,
    filePrefix,
    imageBlob.type || "image/png",
    source,
  );
}

async function persistGeneratedBase64ImageToR2(
  b64Json: string,
  prompt: string,
  userId: string,
  filePrefix: string,
  source: ImageSource = "image_studio",
) {
  return persistGeneratedImageToR2(
    Buffer.from(b64Json, "base64"),
    prompt,
    userId,
    filePrefix,
    "image/png",
    source,
  );
}

function buildGenerateRequest(
  apiKey: string,
  baseUrl: string,
  prompt: string,
  options: GenerateImageOptions,
): { url: string; init: RequestInit } {
  return {
    url: resolveImagesGenerationUrl(baseUrl),
    init: {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.GPT_IMAGE2_MODEL ?? "gpt-image2",
        prompt,
        n: 1,
        size: options.size ?? "1024x1024",
        ...(options.quality ? { quality: options.quality } : {}),
        ...(options.outputFormat
          ? { output_format: options.outputFormat }
          : {}),
      }),
    },
  };
}

function buildEditRequest(
  apiKey: string,
  baseUrl: string,
  prompt: string,
  options: GenerateImageOptions,
  referenceImages: ReferenceImage[],
): { url: string; init: RequestInit } {
  // multipart/form-data: the edit endpoint requires binary image uploads, so we
  // attach each reference image under the repeated `image[]` field. We let fetch
  // set the multipart boundary by NOT setting Content-Type ourselves.
  const formData = new FormData();
  formData.append("model", env.GPT_IMAGE2_MODEL ?? "gpt-image2");
  formData.append("prompt", prompt);
  formData.append("n", "1");
  formData.append("size", options.size ?? "1024x1024");
  if (options.quality) {
    formData.append("quality", options.quality);
  }
  if (options.outputFormat) {
    formData.append("output_format", options.outputFormat);
  }

  for (const reference of referenceImages) {
    const bytes = Buffer.from(reference.data, "base64");
    const blob = new Blob([bytes], {
      type: reference.contentType || "image/png",
    });
    formData.append("image[]", blob, reference.name || "reference.png");
  }

  return {
    url: resolveImagesEditUrl(baseUrl),
    init: {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    },
  };
}

async function generateGptImage2(
  prompt: string,
  userId: string,
  options: GenerateImageOptions = {},
) {
  const apiKeyConfig = requireOptionalIntegration({
    integration: "GPT Image 2",
    envVar: "GPT_IMAGE2_API_KEY",
    value: env.GPT_IMAGE2_API_KEY,
    feature: "AI image generation",
  });
  const baseUrlConfig = requireOptionalIntegration({
    integration: "GPT Image 2",
    envVar: "GPT_IMAGE2_BASE_URL",
    value: env.GPT_IMAGE2_BASE_URL,
    feature: "AI image generation",
  });

  if (!apiKeyConfig.ok) {
    return {
      success: false,
      error: apiKeyConfig.error,
    };
  }
  if (!baseUrlConfig.ok) {
    return {
      success: false,
      error: baseUrlConfig.error,
    };
  }

  const source = options.source ?? "image_studio";
  const referenceImages = (options.referenceImages ?? []).slice(
    0,
    MAX_REFERENCE_IMAGES,
  );
  const isEdit = referenceImages.length > 0;

  const { url, init } = isEdit
    ? buildEditRequest(
        apiKeyConfig.value,
        baseUrlConfig.value,
        prompt,
        options,
        referenceImages,
      )
    : buildGenerateRequest(
        apiKeyConfig.value,
        baseUrlConfig.value,
        prompt,
        options,
      );

  const response = await fetchImageWithRetry(url, init);

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(
      `GPT Image 2 API error: ${response.status}${errorMessage ? ` ${errorMessage}` : ""}`,
    );
  }

  const result = (await response.json()) as OpenAICompatibleImageResponse;
  const image = result.data?.[0];

  if (image?.url) {
    const generatedImage = await persistGeneratedImageUrlToR2(
      image.url,
      prompt,
      userId,
      "image",
      source,
    );

    return {
      success: true,
      image: generatedImage,
    };
  }

  if (image?.b64_json) {
    const generatedImage = await persistGeneratedBase64ImageToR2(
      image.b64_json,
      prompt,
      userId,
      "image",
      source,
    );

    return {
      success: true,
      image: generatedImage,
    };
  }

  throw new Error("Failed to generate image");
}

export async function generateImageAction(
  prompt: string,
  model: ImageModelList = "gpt-image2",
  options: GenerateImageOptions = {},
) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in to generate images",
    };
  }

  try {
    if (model === "gpt-image2") {
      return await generateGptImage2(prompt, session.user.id, options);
    }

    return await generateTogetherImageAction(
      prompt,
      model as TogetherImageModelList,
    );
  } catch (error) {
    console.error("Error generating image:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate image",
    };
  }
}
