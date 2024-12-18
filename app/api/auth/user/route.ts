import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db, UsersTable } from '@/lib/drizzle'
import { eq } from 'drizzle-orm'

export async function GET() {
  console.log('GET /api/auth/user - Start');
  try {
    const cookieStore = await cookies();
    const userEmailCookie = cookieStore.get('user_email');
    const authToken = cookieStore.get('auth_token');
    
    console.log('Cookies found:', { 
      userEmail: userEmailCookie?.value,
      hasAuthToken: !!authToken
    });

    if (!userEmailCookie?.value || !authToken) {
      console.log('Missing required cookies');
      return NextResponse.json({ user: null }, {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
    }

    const [user] = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.email, userEmailCookie.value));

    console.log('Database query result:', user ? 'User found' : 'No user found');

    if (!user) {
      console.log('No user found in database');
      return NextResponse.json({ user: null }, {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
    }

    // Don't send sensitive information to client
    const { passwordHash, ...safeUser } = user;
    
    console.log('Returning user data:', {
      id: safeUser.id,
      email: safeUser.email,
      credits: safeUser.credits
    });
    
    return NextResponse.json({ user: safeUser }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );
  }
}