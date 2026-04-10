import { NextResponse } from "next/server";
import { eq, and, sql, desc, asc, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, users, projects } from "@/lib/db/schema";
import { z } from "zod/v4";

const taskCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().min(1),
  milestoneId: z.string().optional(),
  status: z.enum(["to_do", "in_progress", "in_review", "done", "blocked"]).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

const taskBulkUpdateSchema = z.object({
  ids: z.array(z.string()),
  status: z.enum(["to_do", "in_progress", "in_review", "done", "blocked"]).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";
  const projectId = searchParams.get("projectId") || "";
  const assigneeId = searchParams.get("assigneeId") || "";
  const view = searchParams.get("view") || "list";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const conditions = [];
  if (search) {
    conditions.push(sql`${tasks.title} ILIKE ${`%${search}%`}`);
  }
  if (status && status !== "all") conditions.push(eq(tasks.status, status as any));
  if (priority && priority !== "all") conditions.push(eq(tasks.priority, priority as any));
  if (projectId) conditions.push(eq(tasks.projectId, projectId));
  if (assigneeId === "me") conditions.push(eq(tasks.assigneeId, session.user.id));
  else if (assigneeId) conditions.push(eq(tasks.assigneeId, assigneeId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  if (view === "board") {
    const allTasks = await db
      .select()
      .from(tasks)
      .where(where)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .orderBy(desc(tasks.priority), asc(tasks.dueDate));

    const columns: Record<string, typeof allTasks> = {
      to_do: [],
      in_progress: [],
      in_review: [],
      done: [],
      blocked: [],
    };

    for (const task of allTasks) {
      if (columns[task.task.status]) {
        columns[task.task.status].push(task);
      }
    }

    return NextResponse.json({ columns });
  }

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(where)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .orderBy(desc(tasks.priority), asc(tasks.dueDate))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
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
  const parsed = taskCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const [task] = await db
    .insert(tasks)
    .values({
      ...parsed.data,
      completedAt: parsed.data.status === "done" ? new Date() : null,
    })
    .returning();

  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = taskBulkUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.status) {
    updateData.status = parsed.data.status;
    if (parsed.data.status === "done") updateData.completedAt = new Date();
    else updateData.completedAt = null;
  }
  if (parsed.data.priority) updateData.priority = parsed.data.priority;

  await db
    .update(tasks)
    .set(updateData)
    .where(inArray(tasks.id, parsed.data.ids));

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids")?.split(",");

  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
  }

  await db.delete(tasks).where(inArray(tasks.id, ids));

  return NextResponse.json({ success: true });
}
