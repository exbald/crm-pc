import { NextResponse } from "next/server";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { issues, users, projects } from "@/lib/db/schema";
import { z } from "zod/v4";

const issueCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().min(1),
  category: z.enum(["request", "error", "bug", "enhancement"]),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  assigneeId: z.string().optional(),
});

const issueUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(["request", "error", "bug", "enhancement"]).optional(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  assigneeId: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";
  const projectId = searchParams.get("projectId") || "";
  const assigneeId = searchParams.get("assigneeId") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const conditions = [];
  if (search) {
    conditions.push(sql`${issues.title} ILIKE ${`%${search}%`}`);
  }
  if (category && category !== "all") conditions.push(eq(issues.category, category as any));
  if (status && status !== "all") conditions.push(eq(issues.status, status as any));
  if (priority && priority !== "all") conditions.push(eq(issues.priority, priority as any));
  if (projectId) conditions.push(eq(issues.projectId, projectId));
  if (assigneeId === "me") conditions.push(eq(issues.assigneeId, session.user.id));
  else if (assigneeId) conditions.push(eq(issues.assigneeId, assigneeId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(issues)
      .where(where)
      .leftJoin(users, eq(issues.assigneeId, users.id))
      .leftJoin(projects, eq(issues.projectId, projects.id))
      .orderBy(desc(issues.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(issues)
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
  const parsed = issueCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const [issue] = await db
    .insert(issues)
    .values({
      ...parsed.data,
      reporterId: session.user.id,
    })
    .returning();

  return NextResponse.json(issue, { status: 201 });
}
