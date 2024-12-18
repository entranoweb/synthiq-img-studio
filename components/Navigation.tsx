'use client';

import Link from 'next/link';
import type { User } from '@/lib/drizzle';
import ExpandingArrow from './expanding-arrow';

type View = 'home' | 'create' | 'gallery';

type NavigationProps = {
  currentView: View;
  onViewChange: (view: View) => void;
  user: User | null;
  onLogout: () => void;
};

export default function Navigation({ currentView, onViewChange, user, onLogout }: NavigationProps) {
  const isActive = (view: View) => {
    return currentView === view ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';
  };

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and navigation */}
          <div className="flex items-center">
            <button 
              onClick={() => onViewChange('home')} 
              className="text-white font-bold text-xl flex items-center group"
            >
              AI Image Studio
              <span className="ml-2">
                <ExpandingArrow className="h-5 w-5" />
              </span>
            </button>
            
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <button
                  onClick={() => onViewChange('home')}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center group ${isActive('home')}`}
                >
                  Home
                  <span className="ml-1 opacity-0 group-hover:opacity-100">
                    <ExpandingArrow className="h-4 w-4" />
                  </span>
                </button>
                {user && (
                  <>
                    <button
                      onClick={() => onViewChange('create')}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center group ${isActive('create')}`}
                    >
                      Create
                      <span className="ml-1 opacity-0 group-hover:opacity-100">
                        <ExpandingArrow className="h-4 w-4" />
                      </span>
                    </button>
                    <button
                      onClick={() => onViewChange('gallery')}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center group ${isActive('gallery')}`}
                    >
                      Gallery
                      <span className="ml-1 opacity-0 group-hover:opacity-100">
                        <ExpandingArrow className="h-4 w-4" />
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right side - User info and auth buttons */}
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">
                    {user.name}
                  </span>
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                    {user.credits} credits
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center group"
                >
                  Logout
                  <span className="ml-1 opacity-0 group-hover:opacity-100">
                    <ExpandingArrow className="h-4 w-4" />
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white text-sm font-medium flex items-center group"
                >
                  Log in
                  <span className="ml-1 opacity-0 group-hover:opacity-100">
                    <ExpandingArrow className="h-4 w-4" />
                  </span>
                </Link>
                <Link
                  href="/register"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center group"
                >
                  Sign up
                  <span className="ml-1 opacity-0 group-hover:opacity-100">
                    <ExpandingArrow className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
