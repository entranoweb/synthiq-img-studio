import { NextResponse } from 'next/server'
import { db, UsersTable } from '@/lib/drizzle'
import { hashPassword } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    // Create new user with initial credits
    const [newUser] = await db.insert(UsersTable).values({
      email,
      name,
      passwordHash: hashedPassword,
      credits: 10, // Initial credits for new users
      createdAt: new Date(),
    }).returning()

    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        credits: newUser.credits
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
