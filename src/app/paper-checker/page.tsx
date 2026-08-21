'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import PaperCheckerInterface from '@/components/PaperCheckerInterface';

export default function PaperCheckerPage() {
  const [currentStep, setCurrentStep] = useState<
    'input' | 'processing' | 'results'
  >('input');

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <Navbar />
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 z-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ff88' fill-opacity='0.1'%3E%3Ctext x='10' y='30' font-size='8' fill='%2300ff88'%3E01%3C/text%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-20 pb-8 sm:pt-24 sm:pb-8">
          {/* Header */}
          {currentStep === 'input' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center space-x-2 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-full px-4 py-2 mb-6">
                <div className="w-2 h-2 bg-[#00ff88] rounded-full"></div>
                <span className="text-sm text-gray-300">
                  Smart Assessment System
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                <span className="text-white">AI</span>{' '}
                <span
                  className="text-[#00ff88]"
                  style={{ fontFamily: 'Geometrisk, system-ui, sans-serif' }}
                >
                  Answer Sheet
                </span>
                <span className="text-white"> Checker</span>{' '}
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto px-4 sm:px-0">
                Upload your question papers, answer keys, and student responses.
                Our advanced AI will provide detailed evaluations and grading in
                seconds.
              </p>
            </motion.div>
          )}

          {/* Paper Checker Interface */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <PaperCheckerInterface onStepChange={setCurrentStep} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
