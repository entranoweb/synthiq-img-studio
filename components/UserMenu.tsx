'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/drizzle';

type UserMenuProps = {
  user: User | null;
};

export default function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth', { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex gap-4 items-center">
        <Link 
          href="/login"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Log in
        </Link>
        <Link 
          href="/register"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="font-medium">{user.name}</span>
      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
        {user.credits} credits
      </span>
      <button
        onClick={handleLogout}
        className="text-red-600 hover:text-red-800 font-medium"
      >
        Log out
      </button>
    </div>
  );
}
