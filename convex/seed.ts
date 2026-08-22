
import { action } from './_generated/server';
import { api, internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { requireUser } from './helpers';
import { callOpenRouter, parseJsonLoose } from './openrouter';
import { MODELS, TaggingResult } from '../src/lib/types';

const QM_MASTER = `QUANTUM MECHANICS: foundations of the microscopic world.

WAVE-PARTICLE DUALITY:
Light and matter show both wave-like and particle-like behavior. Photons produce interference, but energy is absorbed in discrete packets. Electrons diffract through crystal lattices, showing that matter also has a wavelength.

PHOTOELECTRIC EFFECT:
Einstein explained that light of frequency f arrives in quanta of energy E = hf. An electron is emitted only if hf exceeds the work function phi. The stopping potential measures the maximum kinetic energy: K_max = hf - phi.

DE BROGLIE HYPOTHESIS:
Any particle of momentum p has wavelength lambda = h/p. This explains standing-wave conditions in microscopic systems and why electrons can produce diffraction patterns.

HEISENBERG UNCERTAINTY PRINCIPLE:
Position and momentum cannot both be known exactly. Delta x Delta p >= hbar/2. This is not due to bad instruments; it is a fundamental limit from the wave nature of matter.

WAVEFUNCTION AND PROBABILITY:
The wavefunction psi contains all measurable information about the system. The quantity |psi|^2 gives the probability density of finding a particle at a position. A valid wavefunction must be finite, single-valued, continuous, and normalizable.

SCHRODINGER EQUATION:
The time-dependent equation is i hbar dpsi/dt = H psi. For stationary states, the time-independent equation is H psi = E psi. Solving it gives allowed energies and corresponding eigenfunctions.

PARTICLE IN A ONE-DIMENSIONAL BOX:
For an infinite well of length L, boundary conditions force standing waves. The allowed energies are E_n = n^2 h^2 / (8mL^2), where n = 1,2,3,... . Energy is quantized and the ground-state energy is non-zero.

TUNNELING:
A quantum particle has a non-zero probability of crossing a classically forbidden barrier if the wavefunction penetrates through it. Tunneling explains alpha decay, scanning tunneling microscopes, and modern semiconductor devices.

QUANTUM NUMBERS AND ORBITALS:
Electrons in atoms are described by quantum numbers n, l, m_l, and m_s. The principal number n sets the shell energy scale. The azimuthal number l determines orbital shape. Magnetic and spin quantum numbers describe orientation and intrinsic angular momentum.

PAULI EXCLUSION PRINCIPLE:
No two electrons in an atom can have the same set of all four quantum numbers. This principle organizes electron filling and explains the structure of the periodic table.

SPIN AND ANGULAR MOMENTUM:
Spin is intrinsic angular momentum with quantized projection. Orbital angular momentum is also quantized. Measurement collapses the state into one of the allowed eigenvalues.

SUPERPOSITION:
A quantum system can exist as a linear combination of states until measurement. If psi = a psi_1 + b psi_2, the probabilities are |a|^2 and |b|^2 after normalization.

ENTANGLEMENT:
Two particles can share a joint state that cannot be factored into separate single-particle states. Measurement on one instantly constrains the correlations of the other, even at large separation.

OPERATORS AND OBSERVABLES:
Physical quantities are represented by operators. Measurement outcomes are eigenvalues of those operators. Commutators determine whether two observables can be simultaneously sharp.

EXPECTATION VALUES:
The expectation value of an observable A is <A> = integral psi* A psi d tau. It represents the average measurement over many identically prepared systems.

MEASUREMENT POSTULATE:
Before measurement, the system evolves deterministically through the Schrodinger equation. Measurement projects the state onto an eigenstate of the observable being measured.

SHORT QUESTIONS:
1. Why does a particle in a box have non-zero ground-state energy?
2. How does the uncertainty principle follow from wave behavior?
3. Why is tunneling impossible in classical mechanics but allowed in quantum mechanics?
4. How do de Broglie waves explain electron diffraction?

FORMULA SUMMARY:
E = hf
K_max = hf - phi
lambda = h/p
Delta x Delta p >= hbar/2
E_n = n^2 h^2/(8mL^2)
`;

const NOTES_PROMPT = `You write compact revision notes for a student from a digitized handwritten notebook page.
Use the transcription and its labeled chunks below.

Output PLAIN TEXT exactly in this structure (omit sections with no content, keep under 180 words):

TL;DR: <one sentence>
KEY POINTS:
- <point>
FORMULAS:
- <name>: $<latex>$
DIAGRAMS:
- <type>: <caption>
RECALL:
Q: <question>
A: <short answer>

No preamble, no markdown headers.`;

const TAG_PROMPT = (
  chunks: string[],
) => `You label chunks from a student's handwritten notes.
For EACH numbered chunk return an object in "chunks" (same order, same count):
{"text": <chunk text verbatim>, "kind": one of question|derivation|definition|example|diagram|general,
"conceptLabel": <short concept name e.g. "Laplace Transform">,
"tags": [<subject-level tags>],
"isRevision": true only if the chunk contains struck-through/corrected work,
"confidence": <0.0-1.0 transcription confidence>}

Chunks:
${chunks.map((c, i) => `${i + 1}. ${c}`).join('\n\n')}

Return ONLY JSON: {"chunks": [...]}`;

function splitChunks(text: string): string[] {
  const parts = text
    .split(/\n(?=\s*(?:\[DIAGRAM|(?:Q(?:uestion)?\.?\s*)?\d{1,2}[.)]\s|[A-Z][A-Za-z ]{3,40}:))/g)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [text];
}

function guessKind(text: string): string {
  if (/^\s*\[DIAGRAM/i.test(text)) return 'diagram';
  if (/^(Q(?:uestion)?\.?\s*)?\d{1,2}[.)]\s/.test(text)) return 'question';
  if (/=\s*\$?\\/.test(text)) return 'derivation';
  if (/^(def|definition)/i.test(text)) return 'definition';
  return 'general';
}

function guessConcept(text: string): string {
  const heading = text.match(/^([A-Z][A-Za-z0-9 -]{3,40}):/m);
  if (heading) return heading[1].trim();
  return 'Quantum Mechanics';
}

export const seedQuantumDemo = action({
  args: {},
  handler: async (ctx): Promise<{ subjectId: Id<'subjects'>; pageId: Id<'pages'>; skipped: boolean }> => {
    const ownerId = await requireUser(ctx);

    const existingPages = await ctx.runQuery(api.pages.listAll, {});
    const subjects = await ctx.runQuery(api.subjects.listMine, {});
    const existingPhysics = subjects.find(
      (s) => s.name.toLowerCase() === 'physics',
    );
    const subjectId: Id<'subjects'> =
      existingPhysics?._id ??
      ((await ctx.runMutation(api.subjects.add, {
        name: 'Physics',
      })) as Id<'subjects'>);

    const existingSeed = existingPages.find(
      (p) => p.fileName === 'quantum-mechanics-master-notes.txt',
    );
    if (existingSeed) {
      return { subjectId, pageId: existingSeed._id, skipped: true };
    }

    const storageId = await ctx.storage.store(
      new Blob([QM_MASTER], { type: 'text/plain' }),
    );
    const pageId = await ctx.runMutation(api.pages.createPage, {
      storageId,
      fileName: 'quantum-mechanics-master-notes.txt',
      mimeType: 'text/plain',
      sessionId: `qm-seed-${Date.now()}`,
      subjectId,
    });

    await ctx.runMutation(api.pages.setOcr, {
      id: pageId,
      ocrText: QM_MASTER,
      ocrConfidence: 1,
    });

    const texts = splitChunks(QM_MASTER);
    let tagged: Array<{
      text: string;
      kind: string;
      conceptLabel?: string;
      tags?: string[];
      isRevision?: boolean;
      confidence?: number;
    }> = [];
    try {
      const raw = await callOpenRouter(
        MODELS.utility,
        [{ role: 'user', content: TAG_PROMPT(texts) }],
        { json: true, temperature: 0.2, maxTokens: 8192 },
      );
      tagged = TaggingResult.parse(parseJsonLoose(raw)).chunks;
    } catch {
      tagged = [];
    }

    const chunks = texts.map((text, i) => ({
      text,
      kind: tagged[i]?.kind ?? guessKind(text),
      conceptLabel: tagged[i]?.conceptLabel ?? guessConcept(text),
      tags: tagged[i]?.tags ?? ['physics', 'quantum mechanics'],
      isRevision: tagged[i]?.isRevision ?? false,
      confidence: tagged[i]?.confidence ?? 1,
    }));

    await ctx.runMutation(internal.chunks.insertChunks, {
      pageId,
      ownerId,
      subjectId,
      chunks,
    });
    await ctx.runMutation(api.pages.updateStatus, {
      id: pageId,
      status: 'tagged',
    });

    const chunkLines = chunks
      .map(
        (c) =>
          `[${c.kind}${c.conceptLabel ? ` · ${c.conceptLabel}` : ''}] ${c.text}`,
      )
      .join('\n\n');
    const notes = await callOpenRouter(
      MODELS.utility,
      [
        {
          role: 'user',
          content: `${NOTES_PROMPT}\n\nTRANSCRIPTION:\n${QM_MASTER.slice(0, 6000)}\n\nCHUNKS:\n${chunkLines.slice(0, 6000)}`,
        },
      ],
      { temperature: 0.3, maxTokens: 1024 },
    );
    await ctx.runMutation(internal.notes.setNotes, { pageId, notes });

    return { subjectId, pageId, skipped: false };
  },
});
