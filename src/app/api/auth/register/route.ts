import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from "zod/v4"

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = registerSchema.parse(body)
    const existing = await db.query.users.findFirst({ where: eq(users.email, data.email) })
    if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    const hash = await bcrypt.hash(data.password, 10)
    await db.insert(users).values({ name: data.name, email: data.email, password: hash, role: 'team_member' })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
