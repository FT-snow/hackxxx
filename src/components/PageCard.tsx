'use client';

import { motion } from 'framer-motion';
import { FileImage } from 'lucide-react';

export type PageStatus =
  | 'queued'
  | 'ocr'
  | 'embedding'
  | 'tagged'
  | 'done'
  | 'error';

export interface NotebookPage {
  _id: string;
  fileName: string;
  mimeType: string;
  status: PageStatus;
  ocrText?: string;
  error?: string;
}

const STATUS_STYLES: Record<PageStatus, { chip: string; label: string }> = {
  queued: {
    chip: 'bg-gray-500/10 border-gray-500/40 text-gray-300',
    label: 'Queued',
  },
  ocr: {
    chip: 'bg-yellow-500/10 border-yellow-400/40 text-yellow-300 animate-pulse',
    label: 'OCR',
  },
  embedding: {
    chip: 'bg-blue-500/10 border-blue-400/40 text-blue-300',
    label: 'Embedding',
  },
  tagged: {
    chip: 'bg-purple-500/10 border-purple-400/40 text-purple-300',
    label: 'Tagged',
  },
  done: {
    chip: 'bg-[#5FD6C4]/10 border-[#5FD6C4]/40 text-[#5FD6C4]',
    label: 'Done',
  },
  error: {
    chip: 'bg-red-500/10 border-red-400/40 text-red-300',
    label: 'Error',
  },
};

interface PageCardProps {
  page: NotebookPage;
  previewUrl?: string;
}

export default function PageCard({ page, previewUrl }: PageCardProps) {
  const status = STATUS_STYLES[page.status] ?? STATUS_STYLES.queued;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-lg border border-white/[0.08] bg-[#0c0f0d] p-4 ${
        page.status === 'error'
          ? 'border-red-500/50'
          : page.status === 'done'
            ? 'border-[#5FD6C4]/30'
            : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/60 border border-gray-700 flex-shrink-0 flex items-center justify-center">
          {previewUrl ? (
            // biome-ignore lint/performance/noImgElement: local blob object URL thumbnail
            <img
              src={previewUrl}
              alt={page.fileName}
              className="w-full h-full object-cover"
            />
          ) : (
            <FileImage className="w-6 h-6 text-gray-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-200 truncate">
            {page.fileName}
          </p>
          <span
            className={`label-meta inline-flex items-center mt-2 rounded px-2 py-1 border ${status.chip}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      {page.status === 'error' && page.error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-2 break-words"
        >
          {page.error}
        </motion.p>
      )}

      {page.status === 'done' && page.ocrText && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-xs text-gray-400 line-clamp-3 leading-relaxed"
        >
          {page.ocrText.slice(0, 180)}
          {page.ocrText.length > 180 ? '…' : ''}
        </motion.p>
      )}
    </motion.div>
  );
}
