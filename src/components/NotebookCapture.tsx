'use client';

import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { motion } from 'framer-motion';
import { BrainCircuit, Loader2, ScanText, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import FileUploader from '@/components/FileUploader';
import PageCard, { type NotebookPage } from '@/components/PageCard';

interface LocalPreview {
  name: string;
  url: string;
}

type EmbedState = 'waiting' | 'embedding' | 'done' | 'failed';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

interface ChunkDoc {
  _id: Id<'chunks'>;
  text: string;
  embedding?: number[];
}

function PageEmbedder({ pageId }: { pageId: Id<'pages'> }) {
  const chunks = useQuery(api.chunks.chunksByPage, { pageId }) as
    | ChunkDoc[]
    | undefined;
  const setEmbedding = useMutation(api.chunks.setEmbedding);
  const updateStatus = useMutation(api.pages.updateStatus);
  const startedRef = useRef(false);
  const [_state, setState] = useState<EmbedState>('waiting');

  useEffect(() => {
    if (!chunks || startedRef.current) return;

    const missing = chunks.filter((c) => !c.embedding);

    if (missing.length === 0) {
      startedRef.current = true;
      setState('done');
      updateStatus({ id: pageId, status: 'done' }).catch(() => {});
      return;
    }

    startedRef.current = true;
    setState('embedding');

    (async () => {
      try {
        const res = await fetch('/api/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: missing.map((c) => c.text) }),
        });
        if (!res.ok) throw new Error(`Embed request failed (${res.status})`);
        const data = (await res.json()) as { embeddings: number[][] };

        await Promise.allSettled(
          missing.map((c, i) =>
            setEmbedding({
              chunkId: c._id,
              embedding: data.embeddings[i],
            }),
          ),
        );
        await updateStatus({ id: pageId, status: 'done' });
        setState('done');
      } catch {
        setState('failed');
      }
    })();
  }, [chunks, pageId, setEmbedding, updateStatus]);

  return null;
}

export default function NotebookCapture() {
  const [files, setFiles] = useState<File[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<LocalPreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [rebuilding, setRebuilding] = useState(false);
  const [meshReady, setMeshReady] = useState(false);
  const [rebuildError, setRebuildError] = useState<string | null>(null);

  const processFile = useAction(api.ingest.processFile);
  const rebuildConcepts = useAction(api.concepts.rebuildConcepts);

  const pages = useQuery(
    api.pages.listBySession,
    sessionId ? { sessionId } : 'skip',
  ) as NotebookPage[] | undefined;

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (files.length === 0 || submitting) return;

    const sid = crypto.randomUUID();
    const batchFiles = files;

    setSessionId(sid);
    setPreviews(batchFiles.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })));
    setBatchError(null);
    setSubmitting(true);
    setFiles([]);

    const results = await Promise.allSettled(
      batchFiles.map(async (file) => {
        const base64Image = await fileToBase64(file);
        return processFile({
          base64Image,
          fileName: file.name,
          mimeType: file.type,
          sessionId: sid,
        });
      }),
    );

    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      setBatchError(
        `${failures.length} of ${batchFiles.length} page(s) failed to upload. Check the cards below for details.`,
      );
    }
    setSubmitting(false);
  };

  const handleRebuild = async () => {
    if (rebuilding) return;
    setRebuilding(true);
    setRebuildError(null);
    try {
      await rebuildConcepts({});
      setMeshReady(true);
    } catch {
      setRebuildError('Failed to rebuild concept mesh. Try again.');
    } finally {
      setRebuilding(false);
    }
  };

  const pageList = pages ?? [];
  const doneCount = pageList.filter((p) => p.status === 'done').length;
  const taggedPages = pageList.filter((p) => p.status === 'tagged');
  const hasResults = sessionId !== null && pageList.length > 0;
  const showSkeletons = submitting && pageList.length === 0;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Upload Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[#181414] rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-[#5FD6C4] rounded-xl">
            <ScanText className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Capture Notebook Pages
          </h2>
        </div>

        <FileUploader
          files={files}
          onFilesChange={setFiles}
          accept="image/*"
          multiple
          label="Upload notebook page photos"
        />

        <motion.button
          whileHover={{ scale: files.length > 0 && !submitting ? 1.02 : 1 }}
          whileTap={{ scale: files.length > 0 && !submitting ? 0.98 : 1 }}
          type="button"
          onClick={handleSubmit}
          disabled={files.length === 0 || submitting}
          className={`mt-6 w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 ${
            files.length > 0 && !submitting
              ? 'bg-[#5FD6C4] hover:bg-[#4FC2B1] text-black cursor-pointer'
              : 'bg-[#181414] border border-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-base">Digitizing pages…</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span className="text-base">
                Digitize {files.length > 0 ? `${files.length} ` : ''}Page
                {files.length !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </motion.button>

        {batchError && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
          >
            {batchError}
          </motion.p>
        )}
      </motion.div>

      {/* Empty State */}
      {!hasResults && !showSkeletons && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="border-2 border-dashed border-gray-700 rounded-2xl p-12 text-center"
        >
          <BrainCircuit className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            No pages yet
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Upload photos of your handwritten notes. Each page is OCR&apos;d,
            chunked, tagged with concepts, and embedded into your concept mesh.
          </p>
        </motion.div>
      )}

      {/* Processing Skeletons */}
      {showSkeletons && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: [0.3, 0.7, 0.3], y: 0 }}
              transition={{
                opacity: { duration: 1.5, repeat: Infinity, delay: i * 0.2 },
                y: { duration: 0.4 },
              }}
              className="rounded-xl border border-gray-700 bg-[#181414] p-4"
            >
              <div className="flex items-start space-x-3">
                <div className="w-16 h-16 rounded-lg bg-gray-800 flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-gray-800 rounded w-3/4" />
                  <div className="h-5 bg-gray-800 rounded-full w-1/3" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-2 bg-gray-800 rounded w-full" />
                <div className="h-2 bg-gray-800 rounded w-5/6" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Page Cards Grid */}
      {hasResults && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Pages{' '}
              <span className="text-[#5FD6C4]">
                {doneCount}/{pageList.length}
              </span>{' '}
              digitized
            </h3>
            <div className="h-2 w-32 sm:w-48 bg-[#181414] border border-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${pageList.length > 0 ? (doneCount / pageList.length) * 100 : 0}%`,
                }}
                transition={{ duration: 0.5 }}
                className="h-full bg-[#5FD6C4] rounded-full"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageList.map((page, index) => (
              <motion.div
                key={page._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
              >
                <PageCard
                  page={page}
                  previewUrl={previews.find((p) => p.name === page.fileName)?.url}
                />
              </motion.div>
            ))}
          </div>

          {/* Headless embedders for tagged pages */}
          {taggedPages.map((page) => (
            <PageEmbedder key={page._id} pageId={page._id as Id<'pages'>} />
          ))}
        </motion.div>
      )}

      {/* Rebuild Concept Mesh */}
      {doneCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#181414] rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              Concept Mesh
            </h3>
            <p className="text-sm text-gray-400">
              Cluster tagged chunks into concepts and visualize your knowledge
              graph.
            </p>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
            {meshReady && (
              <Link
                href="/mesh"
                className="px-6 py-3 bg-[#5FD6C4] hover:bg-[#4FC2B1] text-black rounded-full font-medium transition-colors text-sm"
              >
                View Mesh →
              </Link>
            )}
            <motion.button
              whileHover={{ scale: rebuilding ? 1 : 1.05 }}
              whileTap={{ scale: rebuilding ? 1 : 0.95 }}
              type="button"
              onClick={handleRebuild}
              disabled={rebuilding}
              className={`px-6 py-3 rounded-full font-medium transition-colors text-sm flex items-center space-x-2 ${
                rebuilding
                  ? 'bg-gray-800 text-gray-400 cursor-wait'
                  : 'bg-white text-black hover:bg-gray-200 cursor-pointer'
              }`}
            >
              {rebuilding && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Rebuild Concept Mesh</span>
            </motion.button>
          </div>
          {rebuildError && (
            <p className="text-sm text-red-300 w-full">{rebuildError}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
