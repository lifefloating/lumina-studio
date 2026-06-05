// Shared types and constants for the Image Studio image-generation flow.
// Kept in a plain module (NOT "use server") so both the server action and the
// client component can import the value constants and type aliases — a
// "use server" file may only export async functions.

export type ImageSource = "image_studio" | "presentation";

// 4K sizes require relay/upstream support; the UI labels them accordingly and
// the request simply forwards the size — an unsupported size surfaces as an API
// error that we relay back to the caller.
export type GptImageSize =
  | "1024x1024"
  | "1536x1024"
  | "1024x1536"
  | "2048x2048"
  | "3072x2048"
  | "2048x3072";
export type GptImageQuality = "low" | "medium" | "high" | "auto";
export type GptImageOutputFormat = "png" | "jpeg" | "webp";

// Max number of reference images accepted by the edit endpoint.
export const MAX_REFERENCE_IMAGES = 3;

export type ReferenceImage = {
  /** Raw bytes of the image, base64-encoded (no data: prefix). */
  data: string;
  contentType: string;
  name: string;
};

export type GenerateImageOptions = {
  size?: GptImageSize;
  quality?: GptImageQuality;
  outputFormat?: GptImageOutputFormat;
  referenceImages?: ReferenceImage[];
  source?: ImageSource;
};
