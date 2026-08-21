# PRD — grAIder (Current State, v0)
### AI Answer-Sheet Checker — as-built documentation
*Repo: FT-snow/hackxxx · Package name: `byte-heckings` · Last audited: 2026-08-21*

> Scope note: this document describes **only what exists in code today**. The future roadmap lives in `PRD.md` (InkLink).

---

## 1. Product Overview

grAIder is a web app that automates exam grading. A teacher uploads three inputs — **question paper**, **answer key**, and **student answers** (photos of handwritten sheets or pasted text) — and an LLM evaluates each answer against the key, returning per-question scores, feedback, strengths, and a total mark.

Handwritten input is supported through an OCR pipeline: photos are transcribed by a vision-language model before grading.

## 2. User Flow

```
Landing (/) ──▶ Paper Checker (/paper-checker)
                    │
                    ▼
        [Step 1: INPUT]  3 tabs — Question Paper | Answer Key | Student Answers
                         per tab: file upload (multi-file) OR paste text
                         uploaded images/PDFs → OCR → text fills the field
                    │
                    ▼
        [Step 2: PROCESSING]  spinner while evaluate API runs
                    │
                    ▼
        [Step 3: RESULTS]  plain-text evaluation rendered by <EvaluationResult/>
```

State machine lives client-side in `src/components/PaperCheckerInterface.tsx` (`currentStep: 'input' | 'processing' | 'results'`), mirrored to the page header via `onStepChange`.

## 3. Feature Inventory

| Feature | Where | Status |
|---|---|---|
| Marketing landing page (hero, features, CTA) | `src/app/page.tsx` | ✅ |
| 3-input grading form w/ tabs | `PaperCheckerInterface.tsx` (681 lines) | ✅ |
| Multi-file upload + drag-drop | `FileUploader.tsx` | ✅ |
| Handwriting OCR (images) | `/api/process-file` | ✅ |
| PDF "processing" | `/api/process-file` | ⚠️ stub — returns advice text, no extraction |
| AI evaluation w/ rubric | `/api/evaluate` | ✅ |
| Results display | `EvaluationResult.tsx` | ✅ renders raw text |
| Auth / accounts | — | ❌ none |
| Persistence / history | — | ❌ none (MONGO_URI defined but unused) |
| Export results | — | ❌ none |
| Batch grading (multiple students) | — | ❌ one submission at a time |

### Grading rubric encoded in the evaluate prompt
- **MCQs:** full marks correct, zero incorrect
- **Short answer:** partial credit per correctly addressed key point
- **Essays:** structure, coherence, argument depth, relevance
- **Difficulty inference:** model estimates marks per question if not specified
- Whole-number scores only; feedback + strengths per answer; total at end
- Strictly limited to provided Q&A — no invented questions

## 4. API Contracts

### `POST /api/process-file`
OCR endpoint. multipart/form-data with `file`.

| Input | Path | Output |
|---|---|---|
| `image/*` | upload to freeimage.host → URL → Qwen2-VL-7B via OpenRouter | `{ text }` transcription |
| `application/pdf` | — | `{ text }` = stub message telling user to convert/paste |
| other | — | `400 { error }` |

### `POST /api/evaluate`
JSON body: `{ questionPaper, answerKey, studentAnswers }` (all required).
Calls Mixtral-8x7B (OpenRouter) with system role "teacher grading an exam".
Returns `{ evaluation }` — **unstructured plain text**, `\n`-separated sections:

```
Question: …
Student's Answer: …
Score: x/y
Feedback: …
…
Total marks: …
```

## 5. Tech Stack

- **Framework:** Next.js 15.3.4 (App Router, Turbopack) · React 19 · TypeScript 5
- **Styling:** Tailwind CSS 4 · custom fonts (Geometrisk, Raleway) · dark theme, `#00ff88` accent, binary-matrix background pattern
- **UI libs:** Headless UI, Heroicons, Lucide, Framer Motion 12, CVA + clsx + tailwind-merge
- **AI:** OpenRouter chat completions — `qwen/qwen-2-vl-7b-instruct` (OCR, temp 0.1), `mistralai/mixtral-8x7b-instruct` (grading, temp 0.3)
- **Image hosting:** freeimage.host API (required because the VLM consumes URLs)
- **Tooling:** Biome (lint/format), Bun lockfile
- **Env vars:** `OPENROUTER_API_KEY` (used) · `MONGO_URI`, `SESSION_SECRET` (declared, unused)

## 6. Known Limitations & Defects

1. 🔴 **Hardcoded third-party API key** — freeimage.host key committed at `src/app/api/process-file/route.ts:3`. Move to env.
2. 🔴 **Unstructured output** — evaluation is a formatted string; UI can't render score cards, totals can't be computed reliably, nothing downstream can consume it. Needs JSON mode / structured output.
3. 🟠 **PDFs unsupported** despite being advertised in the error copy.
4. 🟠 **Deprecated models** — both OpenRouter models are legacy; should move to current VLM/instruct models.
5. 🟠 **No persistence** — refresh loses everything; no grading history.
6. 🟡 **Single-student, single-run** — no batch queue for a class set.
7. 🟡 **No auth** — anyone can hit the APIs and burn the key.
8. 🟡 **Client-side only state** — 681-line component holds all logic; no server actions, no tests.
9. 🟡 **OCR depends on external image host** — extra failure point, latency, and privacy concern (student work uploaded to a public host).

## 7. Success Criteria (v0 as-shipped)

- Photo of handwritten answer sheet → graded feedback in one pass ✅
- Partial credit reasoning per question ✅
- Total score computed ✅
- Zero-cost hosting path (Vercel + OpenRouter only) ✅
