import { credentialsRegisterSchema, hashPassword } from "@/server/password-auth";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RegisterError =
  | "EMAIL_EXISTS"
  | "INVALID_PAYLOAD"
  | "REGISTRATION_FAILED";

function errorResponse(error: RegisterError, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", 400);
  }

  const parsed = credentialsRegisterSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("INVALID_PAYLOAD", 400);
  }

  const { email, name, password } = parsed.data;

  try {
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return errorResponse("EMAIL_EXISTS", 409);
    }

    await db.user.create({
      data: {
        email,
        name,
        password: await hashPassword(password),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse("EMAIL_EXISTS", 409);
    }

    return errorResponse("REGISTRATION_FAILED", 500);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
