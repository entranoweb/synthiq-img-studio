'use client';

import { motion, AnimatePresence } from 'framer-motion';

type HeroProps = {
  onGetStarted: () => void;
};

export default function Hero({ onGetStarted }: HeroProps) {
  return (
    <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 opacity-90"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.3)_100%)]" />
      </motion.div>

      {/* Animated circles in background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-white/10 blur-xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.5, 1]
          }}
          style={{
            left: '20%',
            top: '30%',
          }}
        />
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-white/10 blur-xl"
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.5, 1]
          }}
          style={{
            right: '25%',
            top: '20%',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="text-white">Synthiq</span>{' '}
            <span className="text-yellow-300">Studio</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <p className="text-xl md:text-2xl text-white mb-8">
            Transform your imagination into stunning visuals with our<br />
            AI-powered image generation
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <button
            onClick={onGetStarted}
            className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:bg-opacity-90 transition-all transform hover:scale-105"
          >
            Start Creating
          </button>
        </motion.div>
      </div>
    </div>
  );
}
