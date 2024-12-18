'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import ImageGrid from '@/components/ImageGrid';
import Hero from '@/components/Hero';
import Image from 'next/image';
import type { User } from '@/lib/drizzle';

type View = 'home' | 'create' | 'gallery';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Fetch user data on component mount and after image generation
  const fetchUser = async () => {
    try {
      console.log('Fetching user data...');
      const response = await fetch('/api/auth/user', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch user:', response.status);
        setUser(null);
        return;
      }

      const data = await response.json();
      console.log('User data received:', data);
      
      if (data.user) {
        setUser(data.user);
      } else {
        console.error('No user data in response');
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setUser(null);
        setCurrentView('home');
      } else {
        console.error('Logout failed:', response.status);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;

    setGenerating(true);
    setGeneratedImage(null); // Clear previous image
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const result = await response.json();
      console.log('Generation result:', result);
      
      // Set the generated image URL
      setGeneratedImage(result.imageUrl);
      
      // Refresh user data to update credits
      await fetchUser();
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
      setPrompt('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500">
        <Navigation
          currentView={currentView}
          onViewChange={setCurrentView}
          user={user}
          onLogout={handleLogout}
        />
        <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500">
      <Navigation
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          setGeneratedImage(null); // Clear generated image when changing views
        }}
        user={user}
        onLogout={handleLogout}
      />

      <main className="container mx-auto px-4 py-8">
        {currentView === 'home' && (
          <Hero onGetStarted={() => user ? setCurrentView('create') : null} />
        )}

        {currentView === 'create' && user && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
              <h2 className="text-3xl font-bold mb-6 text-gray-800">Create New Image</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="prompt" className="block text-lg font-medium text-gray-700 mb-2">
                    Your Prompt
                  </label>
                  <div className="relative">
                    <textarea
                      id="prompt"
                      rows={4}
                      className="mt-1 block w-full rounded-xl border-2 border-purple-100 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50 transition-all duration-200 text-lg p-4"
                      placeholder="Describe your imagination in detail..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <div className="absolute bottom-3 right-3">
                      <span className="text-sm text-gray-500">
                        {user.credits} credit{user.credits !== 1 ? 's' : ''} remaining
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || generating}
                    className={`px-6 py-3 rounded-xl text-white font-medium text-lg flex items-center space-x-2 transition-all duration-200
                      ${generating || !prompt.trim()
                        ? 'bg-gray-400 cursor-not-allowed opacity-70'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:shadow-lg transform hover:-translate-y-0.5'
                      }`}
                  >
                    {generating ? (
                      <>
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                        <span>Creating Magic...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview of generated image */}
            {generatedImage && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-800">Your Creation</h3>
                <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src={generatedImage}
                    alt="Generated image"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    unoptimized={true}
                  />
                </div>
                <div className="mt-6 flex justify-between items-center">
                  <p className="text-sm text-gray-600 max-w-2xl">
                    {prompt}
                  </p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setCurrentView('gallery')}
                      className="px-4 py-2 bg-white border-2 border-purple-500 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors duration-200"
                    >
                      View in Gallery
                    </button>
                    <button
                      onClick={() => {
                        setPrompt('');
                        setGeneratedImage(null);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      Create Another
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'gallery' && (
          <ImageGrid user={user} key={user?.id} />
        )}
      </main>
    </div>
  );
}
