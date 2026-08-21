'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import Squares from '@/components/ui/SquareBg';
import Navbar from '@/components/Navbar';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const stats: Array<{ number: string; label: string }> = [
  ];

  return (
    <div className="h-full bg-transparent text-white overflow-x-hidden overflow-y-hidden">
      <Navbar></Navbar>
      <div className="absolute w-full h-full z-[-10]">
        <Squares
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="#0B4424"
          hoverFillColor="#222"
        />
      </div>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-8 sm:pt-32 sm:pb-16">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 z-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ff88' fill-opacity='0.1'%3E%3Ctext x='10' y='30' font-size='8' fill='%2300ff88'%3E01%3C/text%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 w-full relative z-20">
          <div className="max-w-full lg:max-w-4xl xl:max-w-5xl text-center sm:text-left">
            {/* AI Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-gray-900/50 border border-gray-700 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-8 sm:mb-8"
            >
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#00ff88] rounded-full"></div>
              <span className="text-xs sm:text-sm text-gray-300">
                AI in Education
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-bold leading-[0.9] mb-8 sm:mb-8 break-words"
            >
              <span className="font-raleway-regular">AI: </span>
              <span className="font-raleway-light"> The </span>
              <span
                className="text-[#00ff88]"
                style={{ fontFamily: 'Geometrisk, system-ui, sans-serif' }}
              >
                Future
              </span>
              <span className="font-raleway-light"> of Education</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-base sm:text-lg lg:text-xl text-gray-400 mb-10 sm:mb-10 lg:mb-12 max-w-full lg:max-w-2xl leading-relaxed mx-auto sm:mx-0"
            >
              Revolutionize your learning with AI.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-16 sm:mb-16 lg:mb-20"
            >
              <button
                type="button"
                className="cursor-pointer bg-white text-black px-6 py-3 sm:px-8 sm:py-4 rounded-full font-medium text-base sm:text-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-center sm:justify-start"
                onClick={() => {window.location.href = "/paper-checker"}}
              >
                <span>Start</span>
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-6 sm:gap-8 lg:gap-12 xl:gap-16"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center sm:text-left">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#00ff88] mb-1 sm:mb-2">
                    {stat.number}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
