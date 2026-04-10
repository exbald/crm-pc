import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  projects,
  milestones,
  tasks,
  users,
} from "@/lib/db/schema";
import { z } from "zod/v4";

const projectUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["active", "on_hold", "completed", "archived"]).optional(),
  ownerId: z.string().optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
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

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const milestoneList = await db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, id));

  const taskList = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, id));

  const owner = project.ownerId
    ? (
        await db
          .select()
          .from(users)
          .where(eq(users.id, project.ownerId))
          .limit(1)
      )[0] || null
    : null;

  return NextResponse.json({
    ...project,
    owner,
    milestones: milestoneList.map((m) => {
      const milestoneTasks = taskList.filter((t) => t.milestoneId === m.id);
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
    }),
    taskStats: {
      total: taskList.length,
      done: taskList.filter((t) => t.status === "done").length,
      inProgress: taskList.filter((t) => t.status === "in_progress").length,
      inReview: taskList.filter((t) => t.status === "in_review").length,
      toDo: taskList.filter((t) => t.status === "to_do").length,
      blocked: taskList.filter((t) => t.status === "blocked").length,
    },
  });
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
  const parsed = projectUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(projects)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
