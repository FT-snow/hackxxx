'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  FileText,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import EvaluationResult from '@/components/EvaluationResult';
import FileUploader from '@/components/FileUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PaperCheckerState {
  questionPaper: string;
  answerKey: string;
  studentAnswers: string;
  questionFiles: File[];
  answerFiles: File[];
  studentFiles: File[];
  isProcessing: boolean;
  evaluationResult: string;
  currentStep: 'input' | 'processing' | 'results';
  uploadingType: 'question' | 'answer' | 'student' | null;
  lastUpdated: 'question' | 'answer' | 'student' | null;
}

interface PaperCheckerInterfaceProps {
  onStepChange?: (step: 'input' | 'processing' | 'results') => void;
}

export default function PaperCheckerInterface({
  onStepChange,
}: PaperCheckerInterfaceProps) {
  const [state, setState] = useState<PaperCheckerState>({
    questionPaper: '',
    answerKey: '',
    studentAnswers: '',
    questionFiles: [],
    answerFiles: [],
    studentFiles: [],
    isProcessing: false,
    evaluationResult: '',
    currentStep: 'input',
    uploadingType: null,
    lastUpdated: null,
  });

  const updateState = (updates: Partial<PaperCheckerState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };
  useEffect(() => {
    if (onStepChange) {
      onStepChange(state.currentStep);
    }
  }, [state.currentStep, onStepChange]);

  const _handleFileChange = (
    files: File[],
    type: 'question' | 'answer' | 'student',
  ) => {
    const updateData: Partial<PaperCheckerState> = {};

    switch (type) {
      case 'question':
        updateData.questionFiles = files;
        break;
      case 'answer':
        updateData.answerFiles = files;
        break;
      case 'student':
        updateData.studentFiles = files;
        break;
    }

    updateState(updateData);

    if (files.length > 0) {
      handleFileUpload(files, type);
    }
  };

  const handleFileUpload = async (
    files: File[],
    type: 'question' | 'answer' | 'student',
  ) => {
    if (files.length === 0) return;

    try {
      updateState({
        isProcessing: true,
        uploadingType: type,
        lastUpdated: null,
      });

      let extractedText = '';
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/process-file', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (result.text) {
          extractedText += `${result.text}\n`;
        }
      }

      const updateData: Partial<PaperCheckerState> = {
        isProcessing: false,
        uploadingType: null,
        lastUpdated: type,
      };

      switch (type) {
        case 'question':
          updateData.questionPaper = state.questionPaper + extractedText;
          break;
        case 'answer':
          updateData.answerKey = state.answerKey + extractedText;
          break;
        case 'student':
          updateData.studentAnswers = state.studentAnswers + extractedText;
          break;
      }

      updateState(updateData);

      setTimeout(() => {
        updateState({ lastUpdated: null });
      }, 2000);
    } catch (error) {
      console.error('Error processing files:', error);
      updateState({
        isProcessing: false,
        uploadingType: null,
      });
    }
  };

  const handleEvaluation = async () => {
    if (!state.questionPaper || !state.answerKey || !state.studentAnswers) {
      alert(
        'Please provide all required inputs: question paper, answer key, and student answers',
      );
      return;
    }

    updateState({ isProcessing: true, currentStep: 'processing' });

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionPaper: state.questionPaper,
          answerKey: state.answerKey,
          studentAnswers: state.studentAnswers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Evaluation failed');
      }

      const result = await response.json();
      updateState({
        evaluationResult: result.evaluation,
        currentStep: 'results',
        isProcessing: false,
      });
    } catch (error) {
      console.error('Error during evaluation:', error);
      alert(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
      updateState({ isProcessing: false, currentStep: 'input' });
    }
  };

  const resetForm = () => {
    setState({
      questionPaper: '',
      answerKey: '',
      studentAnswers: '',
      questionFiles: [],
      answerFiles: [],
      studentFiles: [],
      isProcessing: false,
      evaluationResult: '',
      currentStep: 'input',
      uploadingType: null,
      lastUpdated: null,
    });
  };

  const canEvaluate =
    state.questionPaper && state.answerKey && state.studentAnswers;

  if (state.currentStep === 'processing') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8"
        >
          {/* Animated Logo/Icon */}
          <div className="relative">
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                scale: { duration: 2, repeat: Infinity },
              }}
              className="relative w-24 h-24 mx-auto"
            >
              <div className="relative w-24 h-24 border-4 border-[#16e16e] rounded-full">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-[#16e16e]" />
                </div>
              </div>
            </motion.div>

            {/* Orbiting particles */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * 0.5,
                }}
                className="absolute inset-0"
              >
                <div className="w-2 h-2 bg-[#16e16e] rounded-full absolute -top-1 left-1/2 transform -translate-x-1/2"></div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-3xl font-bold text-[#16e16e]">
              AI Analysis in Progress
            </h2>
            <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
              Our advanced neural networks are processing your documents with
              precision and care
            </p>

            {/* Progress indicators */}
            <div className="flex justify-center space-x-2 pt-4">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-2 h-2 bg-[#16e16e] rounded-full"
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12">
        {/* Main Interface Grid */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6 lg:space-y-8"
          >
            {/* Upload Card */}
            <div className="bg-[#181414] rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700">
              <div className="flex items-center space-x-3 mb-6 sm:mb-8">
                <div className="p-2 bg-[#16e16e] rounded-xl">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Upload Documents
                </h2>
              </div>

              <Tabs defaultValue="question" className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-[#181414] rounded-xl p-1 gap-1 sm:gap-0">
                  <TabsTrigger
                    value="question"
                    className="data-[state=active]:bg-[#16e16e] data-[state=active]:text-black rounded-lg transition-all duration-300 text-xs sm:text-sm py-2 sm:py-1.5"
                  >
                    Question Paper
                  </TabsTrigger>
                  <TabsTrigger
                    value="answer"
                    className="data-[state=active]:bg-[#16e16e] data-[state=active]:text-black rounded-lg transition-all duration-300 text-xs sm:text-sm py-2 sm:py-1.5"
                  >
                    Answer Key
                  </TabsTrigger>
                  <TabsTrigger
                    value="student"
                    className="data-[state=active]:bg-[#16e16e] data-[state=active]:text-black rounded-lg transition-all duration-300 text-xs sm:text-sm py-2 sm:py-1.5"
                  >
                    Student Answers
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="question" className="mt-18">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 pt-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300 font-medium">
                        Question Paper
                      </span>
                      {state.questionPaper && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center space-x-1"
                        >
                          <CheckCircle className="w-5 h-5 text-[#16e16e]" />
                          <span className="text-[#16e16e] text-sm">
                            Uploaded
                          </span>
                        </motion.div>
                      )}
                    </div>
                    <FileUploader
                      files={state.questionFiles}
                      onFilesChange={(files) =>
                        _handleFileChange(files, 'question')
                      }
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      label="Upload Question Paper"
                    />
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-gray-700"></div>
                      <span className="flex-shrink mx-4 text-gray-500 text-sm">
                        OR
                      </span>
                      <div className="flex-grow border-t border-gray-700"></div>
                    </div>
                    <textarea
                      value={state.questionPaper}
                      onChange={(e) =>
                        updateState({ questionPaper: e.target.value })
                      }
                      placeholder="Paste question paper text here"
                      className="w-full bg-[#181414] border border-gray-700 rounded-lg p-4 h-32 focus:ring-2 focus:ring-[#16e16e] focus:border-transparent transition-all duration-300 text-gray-300 resize-none"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="answer" className="mt-18">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 pt-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300 font-medium">
                        Answer Key
                      </span>
                      {state.answerKey && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center space-x-1"
                        >
                          <CheckCircle className="w-5 h-5 text-[#16e16e]" />
                          <span className="text-[#16e16e] text-sm">
                            Uploaded
                          </span>
                        </motion.div>
                      )}
                    </div>
                    <FileUploader
                      files={state.answerFiles}
                      onFilesChange={(files) =>
                        _handleFileChange(files, 'answer')
                      }
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      label="Upload Answer Key"
                    />
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-gray-700"></div>
                      <span className="flex-shrink mx-4 text-gray-500 text-sm">
                        OR
                      </span>
                      <div className="flex-grow border-t border-gray-700"></div>
                    </div>
                    <textarea
                      value={state.answerKey}
                      onChange={(e) =>
                        updateState({ answerKey: e.target.value })
                      }
                      placeholder="Paste answer key text here"
                      className="w-full bg-[#181414] border border-gray-700 rounded-lg p-4 h-32 focus:ring-2 focus:ring-[#16e16e] focus:border-transparent transition-all duration-300 text-gray-300 resize-none"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="student" className="mt-18">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 pt-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300 font-medium">
                        Student Answers
                      </span>
                      {state.studentAnswers && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center space-x-1"
                        >
                          <CheckCircle className="w-5 h-5 text-[#16e16e]" />
                          <span className="text-[#16e16e] text-sm">
                            Uploaded
                          </span>
                        </motion.div>
                      )}
                    </div>
                    <FileUploader
                      files={state.studentFiles}
                      onFilesChange={(files) =>
                        _handleFileChange(files, 'student')
                      }
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      label="Upload Student Answers"
                    />
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-gray-700"></div>
                      <span className="flex-shrink mx-4 text-gray-500 text-sm">
                        OR
                      </span>
                      <div className="flex-grow border-t border-gray-700"></div>
                    </div>
                    <textarea
                      value={state.studentAnswers}
                      onChange={(e) =>
                        updateState({ studentAnswers: e.target.value })
                      }
                      placeholder="Paste student answers text here"
                      className="w-full bg-[#181414] border border-gray-700 rounded-lg p-4 h-32 focus:ring-2 focus:ring-[#16e16e] focus:border-transparent transition-all duration-300 text-gray-300 resize-none"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>

          {/* Status Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6 lg:space-y-8"
          >
            {/* Progress Card */}
            <div className="bg-[#181414] rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700">
              <div className="flex items-center space-x-3 mb-6 sm:mb-8">
                <div className="w-3 h-3 bg-[#16e16e] rounded-full"></div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Progress</h3>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: 'questionPaper',
                    label: 'Question Paper',
                    value: state.questionPaper,
                  },
                  {
                    key: 'answerKey',
                    label: 'Answer Key',
                    value: state.answerKey,
                  },
                  {
                    key: 'studentAnswers',
                    label: 'Student Answers',
                    value: state.studentAnswers,
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`rounded-xl p-4 transition-all duration-300 ${
                      item.value
                        ? 'bg-[#181414] border border-[#16e16e]'
                        : 'bg-[#181414] border border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-medium ${item.value ? 'text-[#16e16e]' : 'text-gray-400'}`}
                      >
                        {item.label}
                      </span>
                      {item.value ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <CheckCircle className="w-5 h-5 text-[#16e16e]" />
                        </motion.div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-600 rounded-full"></div>
                      )}
                    </div>

                    {item.value && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mt-2 h-1 bg-[#16e16e] rounded-full"
                      />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">
                    Overall Progress
                  </span>
                  <span className="text-sm font-medium text-[#16e16e]">
                    {Math.round(
                      ([
                        state.questionPaper,
                        state.answerKey,
                        state.studentAnswers,
                      ].filter(Boolean).length /
                        3) *
                        100,
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 bg-[#181414] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${([state.questionPaper, state.answerKey, state.studentAnswers].filter(Boolean).length / 3) * 100}%`,
                    }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-[#16e16e] rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <motion.button
              whileHover={{
                scale: canEvaluate ? 1.02 : 1,
                y: canEvaluate ? -2 : 0,
              }}
              whileTap={{ scale: canEvaluate ? 0.98 : 1 }}
              type="button"
              onClick={handleEvaluation}
              disabled={!canEvaluate || state.isProcessing}
              className={`w-full py-4 sm:py-6 px-6 sm:px-8 rounded-2xl font-bold text-lg sm:text-xl transition-all duration-300 ${
                canEvaluate && !state.isProcessing
                  ? 'bg-[#16e16e] hover:bg-[#12c65c] text-black'
                  : 'bg-[#181414] text-gray-500 cursor-not-allowed'
              }`}
            >
              {state.isProcessing ? (
                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-400 border-t-transparent rounded-full"
                  />
                  <span className="text-sm sm:text-base">Processing Documents...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-sm sm:text-base">Generate AI Evaluation</span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* Results Section - Appears at the bottom when evaluation is complete */}
        {state.currentStep === 'results' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 lg:mt-16"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2 mb-8 lg:mb-12"
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                Evaluation Complete
              </h2>
              <p className="text-gray-400 text-base sm:text-lg">
                Your analysis is ready for review
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <EvaluationResult result={state.evaluationResult} />
            </motion.div>

            {/* New Evaluation Button - Below Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="mt-8 lg:mt-12 flex justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={resetForm}
                className="px-8 sm:px-10 py-4 sm:py-5 bg-[#16e16e] hover:bg-[#12c65c] text-black rounded-2xl font-bold text-lg sm:text-xl transition-all duration-300"
              >
                <span className="flex items-center space-x-3">
                  <span>New Evaluation</span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
