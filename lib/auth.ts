import { db, UsersTable } from './drizzle'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import * as jose from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default_secret_please_change'
)

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function createToken(user: { id: number; email: string }) {
  const token = await new jose.SignJWT({ 
    userId: user.id, 
    email: user.email 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
  
  return token
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    return payload as { userId: number; email: string }
  } catch (err) {
    console.error('Token verification failed:', err)
    return null
  }
}

export async function authenticateUser(email: string, password: string) {
  console.log('Authenticating user:', email);
  const hashedPassword = await hashPassword(password)
  
  const [user] = await db
    .select()
    .from(UsersTable)
    .where(eq(UsersTable.email, email));

  if (!user) {
    console.log('User not found');
    return null;
  }
  
  const isValid = user.passwordHash === hashedPassword
  if (!isValid) {
    console.log('Invalid password');
    return null;
  }

  const token = await createToken(user)
  
  // Set cookies in the response
  const cookieStore = await cookies()
  await cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  })
  
  await cookieStore.set('user_email', user.email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  })

  console.log('Authentication successful');
  return { user, token }
}

export async function getCurrentUser() {
  console.log('Getting current user');
  const cookieStore = await cookies()
  const token = await cookieStore.get('auth_token')
  const userEmail = await cookieStore.get('user_email')
  
  console.log('Cookies found:', { token: !!token, userEmail: !!userEmail });
  
  if (!token || !userEmail) {
    console.log('No auth cookies found');
    return null;
  }

  const payload = await verifyToken(token.value)
  if (!payload) {
    console.log('Invalid token');
    return null;
  }

  const [user] = await db
    .select()
    .from(UsersTable)
    .where(eq(UsersTable.email, userEmail.value));

  if (!user) {
    console.log('User not found in database');
    return null;
  }

  console.log('Current user found:', { id: user.id, email: user.email });
  return user;
}
