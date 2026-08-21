# PRD — InkLink
### AI Handwritten Notes Digitizer & Concept Tagger
*Built on the grAIder codebase · Hackathon build*

---

## 1. Problem Statement

Engineering students rely on handwritten derivations and diagrams that remain trapped in physical notebooks — no searchability, no revision indexing, no backups. Existing OCR tools dump raw text but don't *understand* it: notes on the same topic taken weeks apart never connect, and diagrams/corrections get mangled.

## 2. Product Vision

Snap your notebook pages → InkLink digitizes them, tags the concepts, and builds a **connected concept index** that links related material across days. When revising "Laplace Transforms," you see every derivation you ever wrote about it, in chronological order, plus AI-generated revision summaries — each summary linked back to the exact page image it came from.

**One-liner:** *"Your notebook, but searchable, connected, and alive."*

InkLink ships as a **study suite** with two modules sharing one OCR pipeline:
- **Notes** — digitize, tag, and link handwritten notes *(core, this hackathon)*
- **Grader** — the original grAIder AI paper-evaluation tool, kept as a sub-feature *(rebranded, not rebuilt)*

## 3. Target Users

| User | Need |
|---|---|
| Engineering student (primary) | Digitize semester notes, revise by topic not by date |
| Exam crammer | Quick concept summaries with links to full derivations |
| Note-sharers | Clean digital versions of messy handwriting |

## 4. Current State Audit (grAIder v0)

What exists and gets reused:

| Asset | Status | Reuse |
|---|---|---|
| Next.js 15 + TS + Tailwind 4 + Framer Motion scaffold | ✅ solid | Base app |
| Image upload → freeimage.host → Qwen-2-VL OCR (`/api/process-file`) | ✅ works | Core digitization pipeline |
| OpenRouter LLM integration (`/api/evaluate`) | ✅ works | Repurpose for concept extraction |
| PDF processing | ❌ stub ("convert to images") | Must fix |
| Auth / persistence | ❌ none | Needed |
| Structured output | ❌ plain text blobs | Must fix |

**Known issues to fix during build:**
- ⚠️ Hardcoded freeimage.host API key committed in `src/app/api/process-file/route.ts:3` — move to env
- Deprecated models (`qwen-2-vl-7b`, `mixtral-8x7b`) — upgrade to current VLMs
- OCR output is unstructured text — needs JSON schema output

## 5. Feature Set

### P0 — Core (demo-critical)

#### F1. Multi-page Note Ingestion
Upload/camera-capture multiple notebook pages. Each page stored with its **original image** (source of truth) + extracted text.
- Fix PDF path: render pages to images server-side, run VLM per page
- Per-region OCR confidence scores from the VLM

#### F2. Smart Extraction (the OCR-hard-stuff layer)
VLM prompt engineered for real notebooks:
- Preserve math notation (LaTeX), structure, headings
- Detect **diagrams/figures** → don't force to text; crop & store as image segment with caption + description
- Detect **scribbled corrections/strikethroughs** → capture both versions, mark superseded content
- Low-confidence regions flagged visually in review UI (human-in-the-loop fix-up editor)

#### F3. Concept Tagging
LLM pass over extracted text → structured JSON: subject, topics, sub-concepts, difficulty, type (derivation / definition / solved-example / formula).

#### F4. Semantic Linking Engine ⭐ *(key differentiator)*
Chunk each page's text → embeddings → similarity graph.
- Pages from different days covering the same topic auto-cluster into a **Concept Thread**
- Store embeddings in MongoDB Atlas Vector Search (MONGO_URI already in stack)
- Threshold-tuned linking; clusters named by LLM ("Laplace Transform — 6 pages, Feb 3 → Mar 12")

#### F5. Concept Index & Search
- Browse all Concept Threads; thread view = chronological page strip + generated revision summary
- Semantic search bar ("show me everything on Fourier series") → ranked pages with image previews

### P1 — High value, if time permits

#### F6. Revision Summaries
Per-thread AI summary synthesizing all pages, **every claim hyperlinked back to the source page image** (jump-to-original). This is the "linking revision summaries back to original derivations" requirement.

#### F7. Review Editor
Side-by-side image ↔ extracted text; tap a low-confidence highlight to correct inline. Corrections re-trigger tagging/embedding for that page.

#### F8. Export
Thread → Markdown/PDF with embedded page images.

### P1.5 — Grader Module (existing grAIder, kept as sub-feature)

#### F9. AI Paper Evaluation *(grAIder as-is, rebranded)*
The existing paper-checker flow becomes a second tab: upload question paper + answer key + student answer sheets (photos of handwritten exams — same OCR pipeline as Notes) → per-question scores, feedback, and total marks.
- Zero new core tech; shares `/api/process-file` OCR and OpenRouter integration
- **Required cleanup:** structured JSON output instead of plain-text blobs (`src/app/api/evaluate/route.ts`), model upgrade from deprecated `mixtral-8x7b`, render results as score cards
- **Synergy:** graded exam pages can be tagged & linked into the same concept index ("my mistakes on Laplace transforms")

### P2 — Polish / stretch

- Spaced-repetition flashcards generated from concept threads
- Multiple notebooks / subjects sidebar
- Share read-only thread links

## 6. Answering the Challenge Question
*How does the system handle handwriting styles, diagrams, or scribbled corrections that OCR consistently struggles with?*

1. **Image is truth, text is index.** The original page image is always preserved and one tap away. OCR failure degrades search quality, never data loss.
2. **Confidence-aware pipeline.** The VLM returns per-region confidence; below-threshold regions are highlighted for human-in-the-loop correction instead of silently wrong.
3. **Diagrams stay images.** Layout analysis separates figure regions from text; figures are stored as crops with LLM-written descriptions, making them semantically searchable without lossy conversion.
4. **Corrections are versions, not noise.** Strikethroughs/scribbles are detected and captured as versioned content (superseded → current), preserving the student's thought process.
5. **Model ensemble fallback.** Hard pages can be re-run through a second, stronger VLM; results merged with agreement scoring.

## 7. Architecture

```
Browser ── upload pages ──▶ /api/process-file (VLM OCR + layout + confidence)
                              │
                              ▼
                       /api/analyze (concept tags, JSON mode)
                              │
                              ▼
                       /api/embed (chunk → embeddings)
                              │
                              ▼
                    MongoDB Atlas (pages, tags, vectors)
                              │
                              ▼
              /api/link (vector similarity → Concept Threads)
```

Stack: Next.js 15 App Router · OpenRouter (VLM + LLM + embeddings) · MongoDB Atlas Vector Search · Tailwind/Framer Motion.

## 8. Data Model (sketch)

```ts
Page    { _id, notebookId, imageUrl, ocrText, regions[{text, conf, type}], tags[], createdAt }
Chunk   { _id, pageId, text, embedding[1536], concept }
Thread  { _id, name, pageIds[], summary, updatedAt }
```

## 9. Demo Script (3 min)

1. Snap 3 messy pages across "different days" (pre-loaded)
2. Watch digitization live — confidence flags appear, fix one inline
3. Open Concept Index → threads formed automatically across dates
4. Open a thread → revision summary → click citation → jumps to original derivation image
5. Semantic search: "integration by parts examples" → finds the right pages instantly
6. Switch to **Grader** tab → upload a handwritten answer sheet → instant per-question grading *(bonus: "and your mistakes auto-link into the concept index")*

## 10. Non-Goals (this hackathon)

- Native mobile app (responsive web only)
- Real-time collaboration
- Full LaTeX rendering of arbitrary math (display best-effort)
- Non-English handwriting

## 11. Success Metrics

- Page → indexed in < 15 s
- ≥ 80% of planted cross-day duplicates land in the same thread
- Every summary claim traceable to a source page in ≤ 2 clicks
