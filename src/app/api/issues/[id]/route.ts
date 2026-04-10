import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { issues, users, projects } from "@/lib/db/schema";
import { z } from "zod/v4";

const issueUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(["request", "error", "bug", "enhancement"]).optional(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  assigneeId: z.string().nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [issue] = await db
    .select()
    .from(issues)
    .where(eq(issues.id, id))
    .limit(1);

  if (!issue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reporter = (
    await db
      .select()
      .from(users)
      .where(eq(users.id, issue.reporterId))
      .limit(1)
  )[0] || null;

  const assignee = issue.assigneeId
    ? (
        await db
          .select()
          .from(users)
          .where(eq(users.id, issue.assigneeId))
          .limit(1)
      )[0] || null
    : null;

  const project = (
    await db
      .select()
      .from(projects)
      .where(eq(projects.id, issue.projectId))
      .limit(1)
  )[0] || null;

  return NextResponse.json({ ...issue, reporter, assignee, project });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = issueUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "resolved" || parsed.data.status === "closed") {
    updateData.resolvedAt = new Date();
  }

  const [updated] = await db
    .update(issues)
    .set(updateData)
    .where(eq(issues.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.delete(issues).where(eq(issues.id, id));

  return NextResponse.json({ success: true });
}
