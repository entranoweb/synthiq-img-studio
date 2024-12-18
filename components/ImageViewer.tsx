'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

type ImageViewerProps = {
  images: Array<{
    id: number;
    imageUrl: string;
    prompt?: string;
    metadata?: {
      prompt?: string;
      model?: string;
      settings?: {
        width: number;
        height: number;
        steps: number;
        guidance_scale: number;
      };
    };
  }>;
  initialIndex: number;
  onClose: () => void;
};

export default function ImageViewer({ images, initialIndex, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentImage = images[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${currentImage.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="absolute top-4 right-16 text-white hover:text-gray-300 z-10 p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>

        {/* Navigation buttons */}
        <button
          onClick={handlePrevious}
          className="absolute left-4 text-white hover:text-gray-300 z-10 p-2"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 text-white hover:text-gray-300 z-10 p-2"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Image container */}
        <div className="relative w-full h-full max-w-5xl max-h-[80vh] m-8">
          <div className="relative w-full h-full">
            <Image
              src={currentImage.imageUrl}
              alt={currentImage.prompt || 'Generated image'}
              fill
              className="object-contain"
              sizes="(max-width: 1920px) 100vw, 1920px"
              unoptimized={true}
            />
          </div>

          {/* Image info */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
            <p className="text-lg font-medium mb-2">
              {currentImage.prompt || currentImage.metadata?.prompt || 'No prompt available'}
            </p>
            {currentImage.metadata?.model && (
              <p className="text-sm text-gray-300">Model: {currentImage.metadata.model}</p>
            )}
            <p className="text-sm text-gray-300">
              Image {currentIndex + 1} of {images.length}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
