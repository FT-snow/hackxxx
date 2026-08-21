# Mimir

Your notes, connected.

Mimir digitizes handwritten engineering notes into a searchable, self-linking concept index. Pages are transcribed with structure-aware OCR, split into classified concept chunks, and interlinked across days by semantic similarity - so a revision summary written in week 6 automatically connects back to the derivation it revised from week 1.

Built for Problem Statement 9 (EDUTECH - AI OCR Handwritten Notes Digitizer and Concept Tagger) at HackX, by Team Vulpix.

## Team Vulpix

- Bikram Singh - Team Leader
- Prakhar Upadhyay

## The Problem

Engineering students rely on handwritten derivations and diagrams that remain trapped in physical notebooks - no digital searchability, no revision indexing, no backups. Existing OCR tools transcribe text but understand nothing about structure, concepts, or the relationships between notes taken on different days.

## How It Works

1. **Capture** - Upload notebook photos or PDFs into subject-scoped sessions.
2. **Transcribe** - A vision model preserves headings, LaTeX math, numbered questions, struck-through corrections, and diagrams.
3. **Chunk and tag** - Each page splits into concept chunks classified as question, derivation, definition, example, or diagram, each labeled with its concept and tagged.
4. **Embed and link** - Chunks are embedded locally (384-dim) and matched via vector search against every prior chunk, linking revisions to originals across days.
5. **Visualize** - The Concept Mesh renders your syllabus as an interactive 3D knowledge graph of clusters and similarity threads.

## Features

### Notebook Capture
- Drag-and-drop images and PDFs, organized by subject
- Realtime pipeline status per page: queued, OCR, embedding, tagged, done
- Structure-preserving transcription: LaTeX math, `[DIAGRAM: type: caption]` records, `[struck]...[/struck]` corrections, `[?]` illegibility flags, per-page confidence scores

### Concept Mesh
- Interactive Three.js graph of concept clusters colored by dominant kind
- Live data from your own notes; demo dataset when empty
- Node inspector showing kind, linked page count, and cluster membership

### grAIder Paper Checker
- Auto mode: generates exam-style quizzes from your own notes, accepts handwritten answer sheets, grades with partial credit against reference notes
- Manual mode: full paper evaluation from question paper, answer key, and student answers
- Question-by-question feedback with scores and constructive comments

### Profile Analytics
- Contribution-style study heatmap over the last 16 weeks
- Per-subject page counts, attempt counts, average score bars, last-attempt recency
- Recent attempt history with score breakdowns

## Handling What OCR Struggles With

- **Handwriting variance** - every page carries a confidence score; low-confidence words are flagged inline rather than silently misread
- **Diagrams** - never forced into prose; extracted as structured records typed as circuit, free-body, graph, block, flowchart, or table, searchable by type
- **Scribbled corrections** - crossed-out text is captured and marked as revision work, which is precisely the signal that drives cross-day revision linking

## Tech Stack

| Layer | Choice |
| --- | --- |
| Runtime and tooling | Bun |
| Framework | Next.js 15 (App Router), TypeScript |
| Styling | Tailwind CSS v4, GSAP ScrollTrigger, Framer Motion |
| Database, vector search, auth | Convex (schema-validated, indexed queries, 384-dim vector index, password auth) |
| OCR | Qwen3 VL 8B via OpenRouter |
| Concept tagging | GPT-OSS-20B via OpenRouter |
| Grading | Gemini 2.5 Flash via OpenRouter |
| Embeddings | Computed locally - no per-page API cost, notes never leave the stack |

## Getting Started

```bash
bun install

# start Convex (provisions a dev deployment)
bunx convex dev

# in a second terminal
bun run dev
```

Open http://localhost:3000.

### Environment Variables

`.env.local`:

```
OPENROUTER_API_KEY=your_openrouter_key
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://<deployment>.convex.site
```

Convex functions read the OpenRouter key from the deployment's own environment:

```bash
bunx convex env set OPENROUTER_API_KEY your_openrouter_key
```

## Project Structure

```
convex/                  schema, queries, mutations, AI actions
  ingest.ts              OCR + chunking + tagging + embedding pipeline
  concepts.ts            concept clustering and mesh payload
  evaluate.ts            quiz generation and grading
  stats.ts               dashboard aggregation
src/
  app/
    page.tsx             landing with scroll-driven ASCII frame sequence
    notebook/            capture interface
    mesh/                3D concept mesh
    paper-checker/       grader UI
    profile/             analytics dashboard
    login/               auth
  components/            UI components
src/lib/                 shared types, schemas, demo data
public/frames/           landing sequence frames
```
