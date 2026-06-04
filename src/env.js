import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    TAVILY_API_KEY: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    OPENAI_API_KEY: z.string().optional(),
    OPENAI_BASE_URL: z.string().url().optional(),
    GPT_IMAGE2_API_KEY: z.string().optional(),
    GPT_IMAGE2_BASE_URL: z.string().url().optional(),
    GPT_IMAGE2_MODEL: z.string().optional(),
    GPT_IMAGE2_TIMEOUT_MS: z.string().optional(),
    GPT_IMAGE2_MAX_RETRIES: z.string().optional(),
    GPT_IMAGE2_CONCURRENCY: z.string().optional(),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ENDPOINT: z.string().url().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    R2_KEY_PREFIX: z.string().optional(),
    TOGETHER_AI_API_KEY: z.string().optional(),
    PINECONE_API_KEY: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    UNSPLASH_ACCESS_KEY: z.string().optional(),
    NEXTAUTH_URL: z.preprocess(
      (str) => process.env.VERCEL_URL ?? str,
      process.env.VERCEL ? z.string() : z.string().url(),
    ),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    GPT_IMAGE2_API_KEY: process.env.GPT_IMAGE2_API_KEY,
    GPT_IMAGE2_BASE_URL: process.env.GPT_IMAGE2_BASE_URL,
    GPT_IMAGE2_MODEL: process.env.GPT_IMAGE2_MODEL,
    GPT_IMAGE2_TIMEOUT_MS: process.env.GPT_IMAGE2_TIMEOUT_MS,
    GPT_IMAGE2_MAX_RETRIES: process.env.GPT_IMAGE2_MAX_RETRIES,
    GPT_IMAGE2_CONCURRENCY: process.env.GPT_IMAGE2_CONCURRENCY,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_KEY_PREFIX: process.env.R2_KEY_PREFIX,
    TOGETHER_AI_API_KEY: process.env.TOGETHER_AI_API_KEY,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
