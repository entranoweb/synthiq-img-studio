'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import ImageViewer from './ImageViewer';
import type { User } from '@/lib/drizzle';

type ImageResult = {
  id: number;
  imageUrl: string;
  prompt?: string;
  userId: string | number;
  metadata: {
    prompt?: string;
    model?: string;
    settings?: {
      width: number;
      height: number;
      steps: number;
      guidance_scale: number;
    };
    fallbackUrl?: string;
    originalUrl?: string;
  };
};

type ImageGridProps = {
  user: User | null;
};

export default function ImageGrid({ user }: ImageGridProps) {
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchImages() {
      if (!user?.id) {
        console.log('No user ID, clearing images');
        setImageResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Fetching images for user:', user.id);
        const response = await fetch('/api/images', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          next: { revalidate: 0 }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', response.status, errorData);
          throw new Error(errorData.error || `Failed to fetch images: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        if (!data.images || !Array.isArray(data.images)) {
          console.error('Invalid images data:', data);
          throw new Error('Invalid images data received');
        }
        
        // Filter out any images with invalid URLs
        const validImages = data.images.filter((img: ImageResult) => {
          const isValid = img && img.imageUrl && typeof img.imageUrl === 'string';
          if (!isValid) {
            console.warn('Found invalid image:', img);
          }
          return isValid;
        });
        
        console.log('Setting valid images:', validImages);
        setImageResults(validImages);
        console.log('Updated image results:', validImages);
      } catch (error) {
        console.error('Error fetching images:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch images');
        setImageResults([]);
        
        // Retry logic for transient errors
        if (retryCount < 3) {
          console.log('Retrying fetch in 2 seconds...');
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    }

    console.log('ImageGrid effect running, user:', user);
    fetchImages();
  }, [user?.id, retryCount]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        {retryCount < 3 && (
          <button 
            onClick={() => setRetryCount(prev => prev + 1)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please log in to view your images</p>
      </div>
    );
  }

  if (imageResults.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No images found. Create some images to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
      {imageResults.map((image, index) => (
        <div
          key={image.id}
          onClick={() => setSelectedImageIndex(index)}
          className="group relative aspect-square rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer bg-white"
        >
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity z-10" />
          <Image
            src={image.imageUrl}
            alt={image.prompt || 'Generated image'}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              console.error('Image load error:', image.imageUrl);
              if (image.metadata?.originalUrl) {
                console.log('Trying original URL:', image.metadata.originalUrl);
                e.currentTarget.src = image.metadata.originalUrl;
              } else if (image.metadata?.fallbackUrl) {
                console.log('Trying fallback URL:', image.metadata.fallbackUrl);
                e.currentTarget.src = image.metadata.fallbackUrl;
              } else {
                console.log('Using placeholder image');
                e.currentTarget.src = '/placeholder.png';
              }
            }}
            unoptimized={true}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-white text-sm font-medium truncate">
              {image.prompt || image.metadata?.prompt || 'No prompt'}
            </p>
          </div>
        </div>
      ))}

      {selectedImageIndex !== null && (
        <ImageViewer
          images={imageResults}
          initialIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
    </div>
  );
}
