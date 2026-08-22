'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import PaperCheckerInterface from '@/components/PaperCheckerInterface';
import AuthGate from '@/components/AuthGate';

export default function PaperCheckerPage() {
  const [currentStep, setCurrentStep] = useState<
    'input' | 'processing' | 'results'
  >('input');

  return (
    <AuthGate>
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <Navbar />
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 z-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23E9C468' fill-opacity='0.1'%3E%3Ctext x='10' y='30' font-size='8' fill='%23E9C468'%3E01%3C/text%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-20 min-h-screen">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-28">
          {/* Header */}
          {currentStep === 'input' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-10 max-w-2xl"
            >
              <div className="mb-5 inline-flex items-center gap-2.5 rounded-md border border-white/[0.08] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E9C468]" />
                <span className="label-meta text-gray-400">
                  AI paper evaluation
                </span>
              </div>

              <h1 className="font-display mb-4 text-4xl leading-tight sm:text-5xl">
                Answer-sheet <span className="text-gray-400">checker</span>
              </h1>

              <p className="text-base leading-relaxed text-gray-500">
                Upload the question paper, answer key, and student responses.
                Every answer scored against your key, with feedback.
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
    </AuthGate>
  );
}
