import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { milestones, tasks } from "@/lib/db/schema";
import { z } from "zod/v4";

const milestoneCreateSchema = z.object({
  name: z.string().min(1),
  projectId: z.string().min(1),
  targetDate: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "completed"]).optional(),
});

const milestoneUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  targetDate: z.string().nullable().optional(),
  status: z.enum(["not_started", "in_progress", "completed"]).optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const milestoneList = await db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
    .orderBy(milestones.targetDate);

  const result = await Promise.all(
    milestoneList.map(async (m) => {
      const milestoneTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.milestoneId, m.id));

      const doneTasks = milestoneTasks.filter((t) => t.status === "done");
      return {
        ...m,
        progress:
          milestoneTasks.length > 0
            ? Math.round((doneTasks.length / milestoneTasks.length) * 100)
            : 0,
        taskCount: milestoneTasks.length,
        doneTaskCount: doneTasks.length,
      };
    })
  );

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = milestoneCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const [milestone] = await db
    .insert(milestones)
    .values(parsed.data)
    .returning();

  return NextResponse.json(milestone, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await db.delete(milestones).where(eq(milestones.id, id));

  return NextResponse.json({ success: true });
}
