"use server";

import {
  generateImageAction as generateTogetherImageAction,
  type ImageModelList as TogetherImageModelList,
} from "@/app/_actions/image/generate";
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
    },
  });
}

async function persistGeneratedImageUrlToR2(
  imageUrl: string,
  prompt: string,
  userId: string,
  filePrefix: string,
) {
  const imageResponse = await fetch(imageUrl);
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
  );
}

async function persistGeneratedBase64ImageToR2(
  b64Json: string,
  prompt: string,
  userId: string,
  filePrefix: string,
) {
  return persistGeneratedImageToR2(
    Buffer.from(b64Json, "base64"),
    prompt,
    userId,
    filePrefix,
    "image/png",
  );
}

async function generateGptImage2(
  prompt: string,
  userId: string,
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

  const response = await fetch(resolveImagesGenerationUrl(baseUrlConfig.value), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKeyConfig.value}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.GPT_IMAGE2_MODEL ?? "gpt-image2",
      prompt,
      n: 1,
      size: "1024x1024",
    }),
  });

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
      return await generateGptImage2(prompt, session.user.id);
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
