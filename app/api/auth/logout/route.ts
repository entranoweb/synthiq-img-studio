import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  console.log('POST /api/auth/logout - Start');
  try {
    const cookieStore = cookies();
    
    // Clear all auth-related cookies
    cookieStore.delete('user_email');
    cookieStore.delete('auth_token');
    cookieStore.delete('session_token');

    console.log('Cleared auth cookies');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
