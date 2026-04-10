import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contacts, contactsToProjects } from "@/lib/db/schema";
import { z } from "zod/v4";

const contactCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  team: z.string().optional(),
  projectIds: z.array(z.string()).optional(),
});

const contactUpdateSchema = contactCreateSchema.partial();

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const team = searchParams.get("team") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const conditions = [];
  if (search) {
    conditions.push(
      sql`(
        ${contacts.firstName} ILIKE ${`%${search}%`} OR
        ${contacts.lastName} ILIKE ${`%${search}%`} OR
        ${contacts.email} ILIKE ${`%${search}%`}
      )`
    );
  }
  if (role) conditions.push(eq(contacts.role, role));
  if (team) conditions.push(eq(contacts.team, team));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(contacts)
      .where(where)
      .orderBy(contacts.createdAt)
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
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
  const parsed = contactCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { projectIds, ...contactData } = parsed.data;

  const [contact] = await db
    .insert(contacts)
    .values(contactData)
    .returning();

  if (projectIds && projectIds.length > 0) {
    await db.insert(contactsToProjects).values(
      projectIds.map((projectId) => ({
        contactId: contact.id,
        projectId,
      }))
    );
  }

  return NextResponse.json(contact, { status: 201 });
}
