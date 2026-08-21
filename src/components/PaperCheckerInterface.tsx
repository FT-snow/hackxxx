'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, FileText, Sparkles, Zap } from 'lucide-react';
import { useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import EvaluationResult from '@/components/EvaluationResult';
import { api } from '@/convex/_generated/api';
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
  mode: 'auto' | 'manual';
  quiz: Array<{ question: string; expectedAnswer: string; marks: number }> | null;
  generatingQuiz: boolean;
  quizError: string | null;
  answersText: string;
  sheetFiles: File[];
  readingSheet: boolean;
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
    mode: 'auto',
    quiz: null,
    generatingQuiz: false,
    quizError: null,
    answersText: '',
    sheetFiles: [],
    readingSheet: false,
  });

  const chunkTopics = useQuery(api.chunks.allForOwner, {
    ownerId: 'demo-user',
  });
  const topics = [
    ...new Set(
      (chunkTopics ?? [])
        .map((c) => c.conceptLabel)
        .filter((l): l is string => Boolean(l)),
    ),
  ];

  const generateQuiz = async () => {
    if (topics.length === 0 || state.generatingQuiz) return;
    updateState({ generatingQuiz: true, quizError: null });
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      updateState({ quiz: data.questions, generatingQuiz: false });
    } catch (e) {
      updateState({
        quizError: e instanceof Error ? e.message : 'Generation failed',
        generatingQuiz: false,
      });
    }
  };

  const handleSheetChange = async (files: File[]) => {
    updateState({ sheetFiles: files });
    if (files.length === 0) return;
    updateState({ readingSheet: true });
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      const res = await fetch('/api/ingest-sheet', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not read sheet');
      updateState({ answersText: data.text, readingSheet: false });
    } catch (e) {
      console.error(e);
      updateState({ readingSheet: false });
    }
  };

  const handleAutoGrade = async () => {
    if (!state.quiz || !state.answersText.trim()) return;
    updateState({ isProcessing: true, currentStep: 'processing' });
    try {
      const res = await fetch('/api/grade-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: state.quiz,
          answersText: state.answersText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Grading failed');
      updateState({
        evaluationResult: data.evaluation,
        currentStep: 'results',
        isProcessing: false,
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Grading failed');
      updateState({ isProcessing: false, currentStep: 'input' });
    }
  };

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
      mode: state.mode,
      quiz: null,
      generatingQuiz: false,
      quizError: null,
      answersText: '',
      sheetFiles: [],
      readingSheet: false,
    });
  };

  const generatingDisabled =
    state.generatingQuiz || chunkTopics === undefined || topics.length === 0;

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
              <div className="relative w-24 h-24 border-4 border-[#E9C468] rounded-full">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-[#E9C468]" />
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
                <div className="w-2 h-2 bg-[#E9C468] rounded-full absolute -top-1 left-1/2 transform -translate-x-1/2"></div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-3xl font-bold text-[#E9C468]">
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
                  className="w-2 h-2 bg-[#E9C468] rounded-full"
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
        {/* Mode toggle */}
        <div className="mb-8 inline-flex rounded-md border border-white/[0.08] bg-black p-1">
          {(['auto', 'manual'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => updateState({ mode: m })}
              className={`label-meta cursor-pointer rounded-md px-4 py-2 transition-colors ${
                state.mode === m
                  ? 'bg-[#E9C468] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {m === 'auto' ? 'Generate & grade' : 'Full paper'}
            </button>
          ))}
        </div>

        {/* Main Interface Grid */}
        {state.mode === 'auto' && (
          <div className="grid gap-px overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.08] lg:grid-cols-2">
            <div className="bg-black p-7 hover:bg-[#0a0f0c]">
              <span className="label-meta text-[#C8A45C]">03 · Recall</span>
              <h2 className="font-display mt-3 text-xl text-white">
                The surprise test
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Five questions drawn from your own captured notes
                {topics.length > 0 && ` — ${topics.length} topic${topics.length !== 1 ? 's' : ''} detected`}.
                No question paper, no answer key. The well sets the paper.
              </p>
              {state.quiz ? (
                <ol className="mt-6 space-y-5">
                  {state.quiz.map((q, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="label-meta mt-1 flex-shrink-0 text-[#E9C468]">
                        Q{i + 1}
                      </span>
                      <div>
                        <p className="text-sm leading-relaxed text-gray-200">
                          {q.question}
                        </p>
                        <span className="label-meta mt-1 block text-gray-600">
                          {q.marks} marks
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <button
                  type="button"
                  onClick={generateQuiz}
                  disabled={generatingDisabled}
                  className={`label-meta mt-6 inline-block rounded-md px-5 py-2.5 text-xs transition-colors ${
                    generatingDisabled
                      ? 'cursor-not-allowed border border-white/[0.08] bg-[#0c0f0d] text-gray-500'
                      : 'cursor-pointer bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {state.generatingQuiz
                    ? 'Setting the paper…'
                    : topics.length === 0
                      ? 'Capture notebook pages first'
                      : 'Generate from my notes'}
                </button>
              )}
              {state.quizError && (
                <p className="mt-4 text-sm text-red-300">{state.quizError}</p>
              )}
            </div>

            <div className="flex flex-col bg-black p-7 hover:bg-[#0a0f0c]">
              <span className="label-meta text-[#C8A45C]">Answer sheet</span>
              <h2 className="font-display mt-3 text-xl text-white">
                Write it, scan it, done
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Upload photos or a PDF of your handwritten answers. Handwriting
                is read back and graded against the generated paper.
              </p>
              <div className="mt-6 flex-1">
                <FileUploader
                  files={state.sheetFiles}
                  onFilesChange={handleSheetChange}
                  accept=".pdf,application/pdf,image/png,image/jpeg,image/webp,.txt"
                  multiple
                  label="Upload your answer sheet"
                />
              </div>
              {state.readingSheet && (
                <p className="label-meta mt-4 text-gray-400">Reading sheet…</p>
              )}
              {state.answersText && (
                <>
                  <textarea
                    value={state.answersText}
                    onChange={(e) =>
                      updateState({ answersText: e.target.value })
                    }
                    placeholder="Extracted answers — edit if needed"
                    className="mt-4 h-28 w-full resize-none rounded-lg border border-white/[0.08] bg-[#0c0f0d] p-3 text-sm text-gray-300"
                  />
                  <button
                    type="button"
                    onClick={handleAutoGrade}
                    className="label-meta mt-4 w-full rounded-md bg-[#E9C468] py-3.5 text-xs text-black transition-colors hover:bg-[#F0D284]"
                  >
                    Grade my answers →
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div
          className={`grid gap-6 lg:grid-cols-3 lg:gap-8 ${
            state.mode === 'manual' ? '' : 'hidden'
          }`}
        >
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6 lg:space-y-8"
          >
            {/* Upload Card */}
            <div className="bg-[#0c0f0d] rounded-lg p-4 sm:p-6 lg:p-8 border border-white/[0.08]">
              <div className="mb-6 sm:mb-8">
                <span className="label-meta text-[#C8A45C]">03 · Recall</span>
                <h2 className="font-display mt-3 text-xl text-white">
                  Upload documents
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                  Question paper, answer key, student answers — then let the
                  well judge.
                </p>
              </div>

              <Tabs defaultValue="question" className="w-full">
                <TabsList className="grid w-full grid-cols-1 gap-1 rounded-lg border border-white/[0.08] bg-black p-1 sm:grid-cols-3 sm:gap-0">
                  <TabsTrigger
                    value="question"
                    className="data-[state=active]:bg-[#E9C468] data-[state=active]:text-black label-meta rounded-md py-2.5 transition-colors duration-300 data-[state=active]:font-medium"
                  >
                    Question Paper
                  </TabsTrigger>
                  <TabsTrigger
                    value="answer"
                    className="data-[state=active]:bg-[#E9C468] data-[state=active]:text-black label-meta rounded-md py-2.5 transition-colors duration-300 data-[state=active]:font-medium"
                  >
                    Answer Key
                  </TabsTrigger>
                  <TabsTrigger
                    value="student"
                    className="data-[state=active]:bg-[#E9C468] data-[state=active]:text-black label-meta rounded-md py-2.5 transition-colors duration-300 data-[state=active]:font-medium"
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
                          <CheckCircle className="w-5 h-5 text-[#E9C468]" />
                          <span className="text-[#E9C468] text-sm">
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
                      <div className="flex-grow border-t border-white/[0.08]"></div>
                      <span className="flex-shrink mx-4 text-gray-500 text-sm">
                        OR
                      </span>
                      <div className="flex-grow border-t border-white/[0.08]"></div>
                    </div>
                    <textarea
                      value={state.questionPaper}
                      onChange={(e) =>
                        updateState({ questionPaper: e.target.value })
                      }
                      placeholder="Paste question paper text here"
                      className="w-full bg-[#0c0f0d] border border-white/[0.08] rounded-lg p-4 h-32 focus:ring-2 focus:ring-[#E9C468] focus:border-transparent transition-all duration-300 text-gray-300 resize-none"
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
                          <CheckCircle className="w-5 h-5 text-[#E9C468]" />
                          <span className="text-[#E9C468] text-sm">
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
                      <div className="flex-grow border-t border-white/[0.08]"></div>
                      <span className="flex-shrink mx-4 text-gray-500 text-sm">
                        OR
                      </span>
                      <div className="flex-grow border-t border-white/[0.08]"></div>
                    </div>
                    <textarea
                      value={state.answerKey}
                      onChange={(e) =>
                        updateState({ answerKey: e.target.value })
                      }
                      placeholder="Paste answer key text here"
                      className="w-full bg-[#0c0f0d] border border-white/[0.08] rounded-lg p-4 h-32 focus:ring-2 focus:ring-[#E9C468] focus:border-transparent transition-all duration-300 text-gray-300 resize-none"
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
                          <CheckCircle className="w-5 h-5 text-[#E9C468]" />
                          <span className="text-[#E9C468] text-sm">
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
                      <div className="flex-grow border-t border-white/[0.08]"></div>
                      <span className="flex-shrink mx-4 text-gray-500 text-sm">
                        OR
                      </span>
                      <div className="flex-grow border-t border-white/[0.08]"></div>
                    </div>
                    <textarea
                      value={state.studentAnswers}
                      onChange={(e) =>
                        updateState({ studentAnswers: e.target.value })
                      }
                      placeholder="Paste student answers text here"
                      className="w-full bg-[#0c0f0d] border border-white/[0.08] rounded-lg p-4 h-32 focus:ring-2 focus:ring-[#E9C468] focus:border-transparent transition-all duration-300 text-gray-300 resize-none"
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
            <div className="bg-[#0c0f0d] rounded-lg p-4 sm:p-6 lg:p-8 border border-white/[0.08]">
              <div className="flex items-center space-x-3 mb-6 sm:mb-8">
                <span className="label-meta text-[#C8A45C]">Status</span>
                <h3 className="font-display text-lg text-white">Progress</h3>
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
                    className={`rounded-md p-4 transition-all duration-300 ${
                      item.value
                        ? 'bg-black border border-[#E9C468]/40'
                        : 'bg-black border border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-medium ${item.value ? 'text-[#E9C468]' : 'text-gray-400'}`}
                      >
                        {item.label}
                      </span>
                      {item.value ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <CheckCircle className="w-5 h-5 text-[#E9C468]" />
                        </motion.div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-white/[0.14] rounded-full"></div>
                      )}
                    </div>

                    {item.value && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mt-2 h-1 bg-[#E9C468] rounded-full"
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
                  <span className="text-sm font-medium text-[#E9C468]">
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
                <div className="h-2 bg-[#0c0f0d] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${([state.questionPaper, state.answerKey, state.studentAnswers].filter(Boolean).length / 3) * 100}%`,
                    }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-[#E9C468] rounded-full"
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
              className={`label-meta w-full rounded-md px-6 py-4 text-sm transition-colors duration-300 ${
                canEvaluate && !state.isProcessing
                  ? 'bg-[#E9C468] text-black hover:bg-[#F0D284] cursor-pointer'
                  : 'border border-white/[0.08] bg-[#0c0f0d] text-gray-500 cursor-not-allowed'
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
                    className="h-4 w-4 animate-spin"
                  />
                  <span>Evaluating…</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2.5">
                  <Sparkles className="h-4 w-4" />
                  <span>Grade the paper</span>
                  <ArrowRight className="h-4 w-4" />
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
              <h2 className="font-display text-2xl text-white sm:text-3xl lg:text-4xl">
                {state.mode === 'auto' ? 'The verdict' : 'Evaluation complete'}
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
                className="label-meta rounded-md bg-white px-7 py-3.5 text-xs text-black transition-colors hover:bg-gray-200"
              >
                <span className="flex items-center space-x-2.5">
                  <span>New evaluation</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
