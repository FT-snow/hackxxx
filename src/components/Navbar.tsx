'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/95 backdrop-blur-sm border-b border-[#00ff88]/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-1.5 sm:space-x-2"
          >
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#00ff88] rounded-full"></div>
            <Link
              href="/"
              className="text-lg sm:text-xl font-bold tracking-wide text-white hover:text-[#00ff88] transition-colors"
              style={{
                fontFamily: 'Geometrisk, Inter, system-ui, sans-serif',
              }}
            >
              grader.ai
            </Link>
          </motion.div>

          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <Link
              href="/"
              className="text-white hover:text-[#00ff88] transition-colors text-sm xl:text-base"
            >
              Home
            </Link>
            <Link
              href="https://github.com/FT-snow/grAIder"
              className="text-white hover:text-[#00ff88] transition-colors text-sm xl:text-base"
            >
              Source Code
            </Link>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="cursor-pointer bg-[#00ff88] text-black px-4 py-2 xl:px-6 xl:py-3 rounded-full font-medium hover:bg-[#00e87a] transition-colors text-sm xl:text-base"
              onClick={() => {
                window.location.href = '/paper-checker';
              }}
            >
              Get Started
            </motion.button>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-white p-1"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
          >
            <motion.svg
              animate={{ rotate: isMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  isMenuOpen
                    ? 'M6 18L18 6M6 6l12 12'
                    : 'M4 6h16M4 12h16M4 18h16'
                }
              />
            </motion.svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-black/95 border-t border-[#00ff88]/20 py-4"
          >
            <div className="flex flex-col space-y-3">
              <Link
                href="/"
                className="text-gray-300 hover:text-[#00ff88] transition-colors px-3 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="https://github.com/FT-snow/grAIder"
                className="text-gray-300 hover:text-[#00ff88] transition-colors px-3 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Source Code
              </Link>
              <Link
                href="/paper-checker"
                className="text-gray-300 hover:text-[#00ff88] transition-colors px-3 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Paper Checker
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
