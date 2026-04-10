import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { z } from "zod/v4";

const projectCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["active", "on_hold", "completed", "archived"]).optional(),
  ownerId: z.string().optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
});

const projectUpdateSchema = projectCreateSchema.partial();

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "active";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const conditions = [];
  if (status && status !== "all") {
    conditions.push(eq(projects.status, status as any));
  }
  if (search) {
    conditions.push(
      sql`${projects.name} ILIKE ${`%${search}%`}`
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(projects)
      .where(where)
      .orderBy(projects.createdAt)
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(where),
  ]);

  return NextResponse.json({
    items,
    total: countResult[0].count,
    page,
    limit,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = projectCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const [project] = await db
    .insert(projects)
    .values(parsed.data)
    .returning();

  return NextResponse.json(project, { status: 201 });
}
