"use server";

import { generateImageAction } from "@/app/_actions/apps/image-studio/generate";
import { auth } from "@/server/auth";

const DEFAULT_SLIDE_IMAGE_MODEL = "gpt-image2";

export async function generateSlideImageAction(
  prompt: string,
  imageModel: string = DEFAULT_SLIDE_IMAGE_MODEL,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in to generate images",
    };
  }

  // Admin only feature
  if (!session.user.isAdmin) {
    return {
      success: false,
      error: "This feature is only available for admin users",
    };
  }

  try {
    if (imageModel !== DEFAULT_SLIDE_IMAGE_MODEL) {
      return {
        success: false,
        error: `Unsupported image model: ${imageModel}`,
      };
    }

    return await generateImageAction(prompt, DEFAULT_SLIDE_IMAGE_MODEL, {
      source: "presentation",
    });
  } catch (error) {
    console.error("Error generating slide image:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate slide image",
    };
  }
}
