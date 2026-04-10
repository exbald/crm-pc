import { NextResponse } from "next/server";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, issues, projects, milestones, users } from "@/lib/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [myTasks] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.assigneeId, userId), sql`${tasks.status} != 'done'`))
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .orderBy(desc(tasks.priority), asc(tasks.dueDate))
    .limit(5);

  const [myIssues] = await db
    .select()
    .from(issues)
    .where(
      and(
        sql`(${issues.assigneeId} = ${userId} OR ${issues.reporterId} = ${userId})`,
        sql`${issues.status} != 'closed'`
      )
    )
    .leftJoin(users, eq(issues.assigneeId, users.id))
    .leftJoin(projects, eq(issues.projectId, projects.id))
    .orderBy(desc(issues.createdAt))
    .limit(5);

  const projectList = await db
    .select()
    .from(projects)
    .where(eq(projects.status, "active"))
    .leftJoin(users, eq(projects.ownerId, users.id))
    .orderBy(projects.createdAt)
    .limit(6);

  const projectsWithStats = await Promise.all(
    projectList.map(async (p) => {
      const allTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, p.project.id));

      const doneTasks = allTasks.filter((t) => t.status === "done");
      const nextMilestone = (
        await db
          .select()
          .from(milestones)
          .where(
            and(
              eq(milestones.projectId, p.project.id),
              sql`${milestones.status} != 'completed'`
            )
          )
          .orderBy(asc(milestones.targetDate))
          .limit(1)
      )[0] || null;

      return {
        ...p.project,
        owner: p.user,
        taskStats: {
          total: allTasks.length,
          done: doneTasks.length,
        },
        nextMilestone,
      };
    })
  );

  return NextResponse.json({
    myTasks,
    myIssues,
    projects: projectsWithStats,
  });
}
