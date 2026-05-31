import { env } from "@/env";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
import "server-only";

type R2Config = {
  accountId: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  keyPrefix: string;
};

let r2Client: S3Client | null = null;

function normalizeKeySegment(segment: string) {
  return segment.replace(/^\/+|\/+$/g, "");
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^A-Za-z0-9._-]/g, "-");
}

export function getR2Config(): R2Config | null {
  const accountId = env.R2_ACCOUNT_ID?.trim();
  const configuredEndpoint = env.R2_ENDPOINT?.trim();
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = env.R2_BUCKET?.trim();

  if (!accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  const endpoint =
    configuredEndpoint ??
    (accountId
      ? `https://${accountId}.r2.cloudflarestorage.com`
      : undefined);

  if (!endpoint || !accountId) {
    return null;
  }

  return {
    accountId,
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucket,
    keyPrefix: normalizeKeySegment(env.R2_KEY_PREFIX?.trim() ?? ""),
  };
}

export function getR2Client() {
  const config = getR2Config();

  if (!config) {
    throw new Error(
      "Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET.",
    );
  }

  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  return r2Client;
}

export function createR2ObjectKey(fileName: string) {
  const config = getR2Config();
  const safeFileName = sanitizeFileName(fileName);

  if (!config?.keyPrefix) {
    return safeFileName;
  }

  return `${config.keyPrefix}/${safeFileName}`;
}

export function createR2ObjectUrl(key: string) {
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `/api/r2/${encodedKey}`;
}

export async function uploadBufferToR2({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Uint8Array;
  contentType: string;
}) {
  const config = getR2Config();

  if (!config) {
    throw new Error(
      "Cloudflare R2 is not configured. Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.",
    );
  }

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return createR2ObjectUrl(key);
}

export async function getObjectFromR2(
  key: string,
): Promise<GetObjectCommandOutput> {
  const config = getR2Config();

  if (!config) {
    throw new Error("Cloudflare R2 is not configured.");
  }

  return getR2Client().send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );
}
