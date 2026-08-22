'use client';

import { useMutation } from 'convex/react';
import { motion } from 'framer-motion';
import { FileImage, NotebookPen, Trash2 } from 'lucide-react';
import { useState } from 'react';
import RichText from '@/components/RichText';
import { api } from '@/convex/_generated/api';

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
  notes?: string;
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
    chip: 'bg-amber-500/10 border-amber-400/40 text-amber-300',
    label: 'Embedding',
  },
  tagged: {
    chip: 'bg-orange-500/10 border-orange-400/40 text-orange-300',
    label: 'Tagged',
  },
  done: {
    chip: 'bg-[#E9C468]/10 border-[#E9C468]/40 text-[#E9C468]',
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
  const [showNotes, setShowNotes] = useState(false);
  const removePage = useMutation(api.pages.removePage);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const handleRemove = () => {
    if (removing) return;
    if (!window.confirm(`Delete "${page.fileName}" and all its data?`)) return;
    setRemoving(true);
    setRemoveError(null);
    removePage({ id: page._id as never })
      .catch((e) =>
        setRemoveError(e instanceof Error ? e.message : 'Delete failed'),
      )
      .finally(() => setRemoving(false));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-lg border border-white/[0.08] bg-[#0c0f0d] p-4 ${
        page.status === 'error'
          ? 'border-red-500/50'
          : page.status === 'done'
            ? 'border-[#E9C468]/30'
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

        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          aria-label={`Delete ${page.fileName}`}
          className="cursor-pointer rounded-md p-1.5 text-gray-600 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
        >
          <Trash2 className={`h-4 w-4 ${removing ? 'animate-pulse' : ''}`} />
        </button>
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

      {removeError && (
        <p className="mt-2 text-xs text-red-300">{removeError}</p>
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

      {page.status === 'done' && !page.notes && (
        <p className="label-meta mt-3 animate-pulse text-gray-600">
          Writing revision notes…
        </p>
      )}

      {page.notes && (
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className="label-meta flex cursor-pointer items-center gap-1.5 text-gray-400 transition-colors hover:text-[#E9C468]"
          >
            <NotebookPen className="h-3.5 w-3.5" />
            Revision notes {showNotes ? '−' : '+'}
          </button>
          {showNotes && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 font-mono text-xs leading-relaxed text-gray-300 [&_.katex]:text-[0.95rem]"
            >
              <RichText text={page.notes} />
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
