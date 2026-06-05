"use server";

import { type ImageSource } from "@/app/_actions/apps/image-studio/shared";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export type Image = Awaited<ReturnType<typeof getUserImages>>[number];

export async function getUserImages({
  page = 1,
  limit = 20,
  source = "image_studio",
}: {
  page?: number;
  limit?: number;
  source?: ImageSource;
} = {}) {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return db.generatedImage.findMany({
    where: { userId: session.user.id, source },
    orderBy: { createdAt: "desc" },
    skip: Math.max(page - 1, 0) * limit,
    take: limit,
  });
}

export async function fetchGeneratedImages() {
  return getUserImages({ page: 1, limit: 50, source: "image_studio" });
}
