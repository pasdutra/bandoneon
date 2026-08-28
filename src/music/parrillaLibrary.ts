import { parseNote } from "./notes";

/**
 * Canonical, hand-documented chord voicings ("parrillas") for the left hand,
 * bellows opening — transcribed from Hugo Satorre's "Mi primer año con el
 * bandoneón" (section "Acordes parrilla").
 *
 * This is deliberately NOT the generic chord-theory engine (see chords.ts).
 * The generic engine can compute a fingering for any chord by geometric
 * proximity; this library instead records the exact buttons a specific
 * method book documents for these 37 chords. The two are related but must
 * never be conflated: this library's positions are pedagogical fact, not a
 * "best guess" — never re-derive or "correct" them algorithmically.
 */

export type ParrillaQuality = "major" | "minor" | "dominant7" | "half-diminished";

export interface ParrillaTheoreticalNote {
  /** Note name only (no octave) — chord theory is octave-independent. */
  spelling: string;
  degree: string;
  /** True for the one tone the documented voicing leaves out (dominant7's 5th). */
  omitted?: boolean;
}

export interface ParrillaVoicingNote {
  buttonId: string;
  displayPitch: string;
  degree: string;
}

export interface ParrillaGhostFifth {
  buttonId: string;
  displayPitch: string;
  degree: "5";
  derived: true;
}

export interface ParrillaSource {
  author: "Hugo Satorre";
  book: "Mi primer año con el bandoneón";
  section: "Acordes parrilla";
}

export interface ParrillaChord {
  id: string;
  displayName: string;
  quality: ParrillaQuality;
  rootPitchClass: number;
  theoreticalNotes: ParrillaTheoreticalNote[];
  sourceVoicing: ParrillaVoicingNote[];
  derivedGhostFifth?: ParrillaGhostFifth;
  hand: "left";
  bellows: "opening";
  source: ParrillaSource;
}

function rootPitchClass(spelling: string): number {
  const parsed = parseNote(spelling);
  if (!parsed) throw new Error(`Invalid parrilla root spelling: ${spelling}`);
  return parsed.pitchClass;
}

const SOURCE: ParrillaSource = {
  author: "Hugo Satorre",
  book: "Mi primer año con el bandoneón",
  section: "Acordes parrilla",
};

function chord(
  id: string,
  displayName: string,
  quality: ParrillaQuality,
  root: string,
  theoreticalNotes: ParrillaTheoreticalNote[],
  sourceVoicing: ParrillaVoicingNote[],
  derivedGhostFifth?: ParrillaGhostFifth,
): ParrillaChord {
  return {
    id,
    displayName,
    quality,
    rootPitchClass: rootPitchClass(root),
    theoreticalNotes,
    sourceVoicing,
    derivedGhostFifth,
    hand: "left",
    bellows: "opening",
    source: SOURCE,
  };
}

export const PARRILLA_LIBRARY: ParrillaChord[] = [
  // ---------------------------------------------------------------
  // MENORES (10)
  // ---------------------------------------------------------------
  chord("la-m", "Lám", "minor", "Lá",
    [{ spelling: "Lá", degree: "1" }, { spelling: "Dó", degree: "♭3" }, { spelling: "Mi", degree: "5" }],
    [{ buttonId: "L06", displayPitch: "Lá2", degree: "1" }, { buttonId: "L14", displayPitch: "Dó4", degree: "♭3" }, { buttonId: "L19", displayPitch: "Mi4", degree: "5" }]),

  chord("mi-m", "Mim", "minor", "Mi",
    [{ spelling: "Mi", degree: "1" }, { spelling: "Sol", degree: "♭3" }, { spelling: "Si", degree: "5" }],
    [{ buttonId: "L02", displayPitch: "Mi2", degree: "1" }, { buttonId: "L11", displayPitch: "Sol3", degree: "♭3" }, { buttonId: "L12", displayPitch: "Si3", degree: "5" }]),

  chord("re-m", "Rém", "minor", "Ré",
    [{ spelling: "Ré", degree: "1" }, { spelling: "Fá", degree: "♭3" }, { spelling: "Lá", degree: "5" }],
    [{ buttonId: "L01", displayPitch: "Ré2", degree: "1" }, { buttonId: "L21", displayPitch: "Fá4", degree: "♭3" }, { buttonId: "L09", displayPitch: "Lá3", degree: "5" }]),

  chord("sol-m", "Solm", "minor", "Sol",
    [{ spelling: "Sol", degree: "1" }, { spelling: "Si♭", degree: "♭3" }, { spelling: "Ré", degree: "5" }],
    [{ buttonId: "L29", displayPitch: "Sol2", degree: "1" }, { buttonId: "L27", displayPitch: "Si♭3", degree: "♭3" }, { buttonId: "L17", displayPitch: "Ré4", degree: "5" }]),

  chord("do-m", "Dóm", "minor", "Dó",
    [{ spelling: "Dó", degree: "1" }, { spelling: "Mi♭", degree: "♭3" }, { spelling: "Sol", degree: "5" }],
    [{ buttonId: "L23", displayPitch: "Dó3", degree: "1" }, { buttonId: "L20", displayPitch: "Mi♭4", degree: "♭3" }, { buttonId: "L11", displayPitch: "Sol3", degree: "5" }]),

  chord("fa-m", "Fám", "minor", "Fá",
    [{ spelling: "Fá", degree: "1" }, { spelling: "Lá♭", degree: "♭3" }, { spelling: "Dó", degree: "5" }],
    [{ buttonId: "L32", displayPitch: "Fá2", degree: "1" }, { buttonId: "L07", displayPitch: "Lá♭3", degree: "♭3" }, { buttonId: "L14", displayPitch: "Dó4", degree: "5" }]),

  chord("si-m", "Sim", "minor", "Si",
    [{ spelling: "Si", degree: "1" }, { spelling: "Ré", degree: "♭3" }, { spelling: "Fá♯", degree: "5" }],
    [{ buttonId: "L05", displayPitch: "Si2", degree: "1" }, { buttonId: "L17", displayPitch: "Ré4", degree: "♭3" }, { buttonId: "L24", displayPitch: "Fá♯3", degree: "5" }]),

  chord("fas-m", "Fá♯m", "minor", "Fá♯",
    [{ spelling: "Fá♯", degree: "1" }, { spelling: "Lá", degree: "♭3" }, { spelling: "Dó♯", degree: "5" }],
    [{ buttonId: "L31", displayPitch: "Fá♯2", degree: "1" }, { buttonId: "L09", displayPitch: "Lá3", degree: "♭3" }, { buttonId: "L26", displayPitch: "Dó♯4", degree: "5" }]),

  chord("dos-m", "Dó♯m", "minor", "Dó♯",
    [{ spelling: "Dó♯", degree: "1" }, { spelling: "Mi", degree: "♭3" }, { spelling: "Sol♯", degree: "5" }],
    [{ buttonId: "L18", displayPitch: "Dó♯3", degree: "1" }, { buttonId: "L19", displayPitch: "Mi4", degree: "♭3" }, { buttonId: "L07", displayPitch: "Sol♯3", degree: "5" }]),

  chord("sols-m", "Sol♯m", "minor", "Sol♯",
    [{ spelling: "Sol♯", degree: "1" }, { spelling: "Si", degree: "♭3" }, { spelling: "Ré♯", degree: "5" }],
    [{ buttonId: "L08", displayPitch: "Sol♯2", degree: "1" }, { buttonId: "L12", displayPitch: "Si3", degree: "♭3" }, { buttonId: "L20", displayPitch: "Ré♯4", degree: "5" }]),

  // ---------------------------------------------------------------
  // DOMINANTES (11) — all voice 1+3+♭7, omitting the 5th
  // ---------------------------------------------------------------
  chord("la7", "Lá7", "dominant7", "Lá",
    [{ spelling: "Lá", degree: "1" }, { spelling: "Dó♯", degree: "3" }, { spelling: "Mi", degree: "5", omitted: true }, { spelling: "Sol", degree: "♭7" }],
    [{ buttonId: "L06", displayPitch: "Lá2", degree: "1" }, { buttonId: "L26", displayPitch: "Dó♯4", degree: "3" }, { buttonId: "L11", displayPitch: "Sol3", degree: "♭7" }],
    { buttonId: "L19", displayPitch: "Mi4", degree: "5", derived: true }),

  chord("re7", "Ré7", "dominant7", "Ré",
    [{ spelling: "Ré", degree: "1" }, { spelling: "Fá♯", degree: "3" }, { spelling: "Lá", degree: "5", omitted: true }, { spelling: "Dó", degree: "♭7" }],
    [{ buttonId: "L01", displayPitch: "Ré2", degree: "1" }, { buttonId: "L24", displayPitch: "Fá♯3", degree: "3" }, { buttonId: "L14", displayPitch: "Dó4", degree: "♭7" }],
    { buttonId: "L09", displayPitch: "Lá3", degree: "5", derived: true }),

  chord("sol7", "Sol7", "dominant7", "Sol",
    [{ spelling: "Sol", degree: "1" }, { spelling: "Si", degree: "3" }, { spelling: "Ré", degree: "5", omitted: true }, { spelling: "Fá", degree: "♭7" }],
    [{ buttonId: "L29", displayPitch: "Sol2", degree: "1" }, { buttonId: "L12", displayPitch: "Si3", degree: "3" }, { buttonId: "L21", displayPitch: "Fá4", degree: "♭7" }],
    { buttonId: "L17", displayPitch: "Ré4", degree: "5", derived: true }),

  chord("do7", "Dó7", "dominant7", "Dó",
    [{ spelling: "Dó", degree: "1" }, { spelling: "Mi", degree: "3" }, { spelling: "Sol", degree: "5", omitted: true }, { spelling: "Si♭", degree: "♭7" }],
    [{ buttonId: "L23", displayPitch: "Dó3", degree: "1" }, { buttonId: "L19", displayPitch: "Mi4", degree: "3" }, { buttonId: "L27", displayPitch: "Si♭3", degree: "♭7" }],
    { buttonId: "L10", displayPitch: "Sol4", degree: "5", derived: true }),

  chord("mi7", "Mi7", "dominant7", "Mi",
    [{ spelling: "Mi", degree: "1" }, { spelling: "Sol♯", degree: "3" }, { spelling: "Si", degree: "5", omitted: true }, { spelling: "Ré", degree: "♭7" }],
    [{ buttonId: "L02", displayPitch: "Mi2", degree: "1" }, { buttonId: "L07", displayPitch: "Sol♯3", degree: "3" }, { buttonId: "L17", displayPitch: "Ré4", degree: "♭7" }],
    { buttonId: "L12", displayPitch: "Si3", degree: "5", derived: true }),

  chord("si7", "Si7", "dominant7", "Si",
    [{ spelling: "Si", degree: "1" }, { spelling: "Ré♯", degree: "3" }, { spelling: "Fá♯", degree: "5", omitted: true }, { spelling: "Lá", degree: "♭7" }],
    [{ buttonId: "L05", displayPitch: "Si2", degree: "1" }, { buttonId: "L20", displayPitch: "Ré♯4", degree: "3" }, { buttonId: "L09", displayPitch: "Lá3", degree: "♭7" }],
    { buttonId: "L22", displayPitch: "Fá♯4", degree: "5", derived: true }),

  chord("fas7", "Fá♯7", "dominant7", "Fá♯",
    [{ spelling: "Fá♯", degree: "1" }, { spelling: "Lá♯", degree: "3" }, { spelling: "Dó♯", degree: "5", omitted: true }, { spelling: "Mi", degree: "♭7" }],
    [{ buttonId: "L31", displayPitch: "Fá♯2", degree: "1" }, { buttonId: "L27", displayPitch: "Lá♯3", degree: "3" }, { buttonId: "L19", displayPitch: "Mi4", degree: "♭7" }],
    { buttonId: "L26", displayPitch: "Dó♯4", degree: "5", derived: true }),

  chord("dos7", "Dó♯7", "dominant7", "Dó♯",
    [{ spelling: "Dó♯", degree: "1" }, { spelling: "Mi♯", degree: "3" }, { spelling: "Sol♯", degree: "5", omitted: true }, { spelling: "Si", degree: "♭7" }],
    // L21's physical pitch is F4; in this chord it is spelled Mi♯4 — the
    // major third of Dó♯ — never Fá4. The underlying button/pitch is unchanged.
    [{ buttonId: "L18", displayPitch: "Dó♯3", degree: "1" }, { buttonId: "L21", displayPitch: "Mi♯4", degree: "3" }, { buttonId: "L12", displayPitch: "Si3", degree: "♭7" }],
    { buttonId: "L30", displayPitch: "Sol♯4", degree: "5", derived: true }),

  chord("fa7", "Fá7", "dominant7", "Fá",
    [{ spelling: "Fá", degree: "1" }, { spelling: "Lá", degree: "3" }, { spelling: "Dó", degree: "5", omitted: true }, { spelling: "Mi♭", degree: "♭7" }],
    [{ buttonId: "L32", displayPitch: "Fá2", degree: "1" }, { buttonId: "L09", displayPitch: "Lá3", degree: "3" }, { buttonId: "L20", displayPitch: "Mi♭4", degree: "♭7" }],
    { buttonId: "L14", displayPitch: "Dó4", degree: "5", derived: true }),

  chord("sib7", "Si♭7", "dominant7", "Si♭",
    [{ spelling: "Si♭", degree: "1" }, { spelling: "Ré", degree: "3" }, { spelling: "Fá", degree: "5", omitted: true }, { spelling: "Lá♭", degree: "♭7" }],
    [{ buttonId: "L13", displayPitch: "Si♭2", degree: "1" }, { buttonId: "L17", displayPitch: "Ré4", degree: "3" }, { buttonId: "L07", displayPitch: "Lá♭3", degree: "♭7" }],
    { buttonId: "L21", displayPitch: "Fá4", degree: "5", derived: true }),

  chord("mib7", "Mi♭7", "dominant7", "Mi♭",
    [{ spelling: "Mi♭", degree: "1" }, { spelling: "Sol", degree: "3" }, { spelling: "Si♭", degree: "5", omitted: true }, { spelling: "Ré♭", degree: "♭7" }],
    [{ buttonId: "L28", displayPitch: "Mi♭2", degree: "1" }, { buttonId: "L11", displayPitch: "Sol3", degree: "3" }, { buttonId: "L26", displayPitch: "Ré♭4", degree: "♭7" }],
    { buttonId: "L27", displayPitch: "Si♭3", degree: "5", derived: true }),

  // Lá♭7 / Ab7 deliberately excluded — do not add.

  // ---------------------------------------------------------------
  // MAIORES (8)
  // ---------------------------------------------------------------
  chord("mib", "Mi♭", "major", "Mi♭",
    [{ spelling: "Mi♭", degree: "1" }, { spelling: "Sol", degree: "3" }, { spelling: "Si♭", degree: "5" }],
    [{ buttonId: "L28", displayPitch: "Mi♭2", degree: "1" }, { buttonId: "L11", displayPitch: "Sol3", degree: "3" }, { buttonId: "L27", displayPitch: "Si♭3", degree: "5" }]),

  chord("sib", "Si♭", "major", "Si♭",
    [{ spelling: "Si♭", degree: "1" }, { spelling: "Ré", degree: "3" }, { spelling: "Fá", degree: "5" }],
    [{ buttonId: "L13", displayPitch: "Si♭2", degree: "1" }, { buttonId: "L17", displayPitch: "Ré4", degree: "3" }, { buttonId: "L21", displayPitch: "Fá4", degree: "5" }]),

  chord("fa", "Fá", "major", "Fá",
    [{ spelling: "Fá", degree: "1" }, { spelling: "Lá", degree: "3" }, { spelling: "Dó", degree: "5" }],
    [{ buttonId: "L32", displayPitch: "Fá2", degree: "1" }, { buttonId: "L09", displayPitch: "Lá3", degree: "3" }, { buttonId: "L14", displayPitch: "Dó4", degree: "5" }]),

  chord("do", "Dó", "major", "Dó",
    [{ spelling: "Dó", degree: "1" }, { spelling: "Mi", degree: "3" }, { spelling: "Sol", degree: "5" }],
    [{ buttonId: "L23", displayPitch: "Dó3", degree: "1" }, { buttonId: "L19", displayPitch: "Mi4", degree: "3" }, { buttonId: "L11", displayPitch: "Sol3", degree: "5" }]),

  chord("sol", "Sol", "major", "Sol",
    [{ spelling: "Sol", degree: "1" }, { spelling: "Si", degree: "3" }, { spelling: "Ré", degree: "5" }],
    [{ buttonId: "L29", displayPitch: "Sol2", degree: "1" }, { buttonId: "L12", displayPitch: "Si3", degree: "3" }, { buttonId: "L17", displayPitch: "Ré4", degree: "5" }]),

  chord("re", "Ré", "major", "Ré",
    [{ spelling: "Ré", degree: "1" }, { spelling: "Fá♯", degree: "3" }, { spelling: "Lá", degree: "5" }],
    [{ buttonId: "L01", displayPitch: "Ré2", degree: "1" }, { buttonId: "L24", displayPitch: "Fá♯3", degree: "3" }, { buttonId: "L09", displayPitch: "Lá3", degree: "5" }]),

  chord("la", "Lá", "major", "Lá",
    [{ spelling: "Lá", degree: "1" }, { spelling: "Dó♯", degree: "3" }, { spelling: "Mi", degree: "5" }],
    [{ buttonId: "L06", displayPitch: "Lá2", degree: "1" }, { buttonId: "L26", displayPitch: "Dó♯4", degree: "3" }, { buttonId: "L19", displayPitch: "Mi4", degree: "5" }]),

  chord("mi", "Mi", "major", "Mi",
    [{ spelling: "Mi", degree: "1" }, { spelling: "Sol♯", degree: "3" }, { spelling: "Si", degree: "5" }],
    [{ buttonId: "L02", displayPitch: "Mi2", degree: "1" }, { buttonId: "L07", displayPitch: "Sol♯3", degree: "3" }, { buttonId: "L12", displayPitch: "Si3", degree: "5" }]),

  // ---------------------------------------------------------------
  // MEIO-DIMINUTOS (8) — full 1+♭3+♭5+♭7, nothing omitted
  // ---------------------------------------------------------------
  chord("si-hd", "Siø", "half-diminished", "Si",
    [{ spelling: "Si", degree: "1" }, { spelling: "Ré", degree: "♭3" }, { spelling: "Fá", degree: "♭5" }, { spelling: "Lá", degree: "♭7" }],
    [{ buttonId: "L05", displayPitch: "Si2", degree: "1" }, { buttonId: "L17", displayPitch: "Ré4", degree: "♭3" }, { buttonId: "L21", displayPitch: "Fá4", degree: "♭5" }, { buttonId: "L09", displayPitch: "Lá3", degree: "♭7" }]),

  chord("mi-hd", "Miø", "half-diminished", "Mi",
    [{ spelling: "Mi", degree: "1" }, { spelling: "Sol", degree: "♭3" }, { spelling: "Si♭", degree: "♭5" }, { spelling: "Ré", degree: "♭7" }],
    [{ buttonId: "L02", displayPitch: "Mi2", degree: "1" }, { buttonId: "L11", displayPitch: "Sol3", degree: "♭3" }, { buttonId: "L27", displayPitch: "Si♭3", degree: "♭5" }, { buttonId: "L17", displayPitch: "Ré4", degree: "♭7" }]),

  chord("la-hd", "Láø", "half-diminished", "Lá",
    [{ spelling: "Lá", degree: "1" }, { spelling: "Dó", degree: "♭3" }, { spelling: "Mi♭", degree: "♭5" }, { spelling: "Sol", degree: "♭7" }],
    [{ buttonId: "L06", displayPitch: "Lá2", degree: "1" }, { buttonId: "L14", displayPitch: "Dó4", degree: "♭3" }, { buttonId: "L20", displayPitch: "Mi♭4", degree: "♭5" }, { buttonId: "L11", displayPitch: "Sol3", degree: "♭7" }]),

  chord("re-hd", "Réø", "half-diminished", "Ré",
    [{ spelling: "Ré", degree: "1" }, { spelling: "Fá", degree: "♭3" }, { spelling: "Lá♭", degree: "♭5" }, { spelling: "Dó", degree: "♭7" }],
    [{ buttonId: "L01", displayPitch: "Ré2", degree: "1" }, { buttonId: "L21", displayPitch: "Fá4", degree: "♭3" }, { buttonId: "L07", displayPitch: "Lá♭3", degree: "♭5" }, { buttonId: "L14", displayPitch: "Dó4", degree: "♭7" }]),

  chord("sol-hd", "Solø", "half-diminished", "Sol",
    [{ spelling: "Sol", degree: "1" }, { spelling: "Si♭", degree: "♭3" }, { spelling: "Ré♭", degree: "♭5" }, { spelling: "Fá", degree: "♭7" }],
    [{ buttonId: "L29", displayPitch: "Sol2", degree: "1" }, { buttonId: "L27", displayPitch: "Si♭3", degree: "♭3" }, { buttonId: "L26", displayPitch: "Ré♭4", degree: "♭5" }, { buttonId: "L21", displayPitch: "Fá4", degree: "♭7" }]),

  chord("do-hd", "Dóø", "half-diminished", "Dó",
    [{ spelling: "Dó", degree: "1" }, { spelling: "Mi♭", degree: "♭3" }, { spelling: "Sol♭", degree: "♭5" }, { spelling: "Si♭", degree: "♭7" }],
    [{ buttonId: "L23", displayPitch: "Dó3", degree: "1" }, { buttonId: "L20", displayPitch: "Mi♭4", degree: "♭3" }, { buttonId: "L22", displayPitch: "Sol♭4", degree: "♭5" }, { buttonId: "L27", displayPitch: "Si♭3", degree: "♭7" }]),

  chord("fas-hd", "Fá♯ø", "half-diminished", "Fá♯",
    [{ spelling: "Fá♯", degree: "1" }, { spelling: "Lá", degree: "♭3" }, { spelling: "Dó", degree: "♭5" }, { spelling: "Mi", degree: "♭7" }],
    [{ buttonId: "L31", displayPitch: "Fá♯2", degree: "1" }, { buttonId: "L09", displayPitch: "Lá3", degree: "♭3" }, { buttonId: "L14", displayPitch: "Dó4", degree: "♭5" }, { buttonId: "L19", displayPitch: "Mi4", degree: "♭7" }]),

  chord("dos-hd", "Dó♯ø", "half-diminished", "Dó♯",
    [{ spelling: "Dó♯", degree: "1" }, { spelling: "Mi", degree: "♭3" }, { spelling: "Sol", degree: "♭5" }, { spelling: "Si", degree: "♭7" }],
    [{ buttonId: "L18", displayPitch: "Dó♯3", degree: "1" }, { buttonId: "L19", displayPitch: "Mi4", degree: "♭3" }, { buttonId: "L11", displayPitch: "Sol3", degree: "♭5" }, { buttonId: "L12", displayPitch: "Si3", degree: "♭7" }]),
];

export function mapGenericQualityToParrilla(quality: string): ParrillaQuality | null {
  if (quality === "major") return "major";
  if (quality === "minor") return "minor";
  if (quality === "7") return "dominant7";
  if (quality === "m7b5") return "half-diminished";
  return null;
}

export function findParrillaChord(rootPc: number, quality: ParrillaQuality): ParrillaChord | undefined {
  return PARRILLA_LIBRARY.find((entry) => entry.rootPitchClass === rootPc && entry.quality === quality);
}

/**
 * Degrees the documented voicing leaves out (e.g. dominant7's 5th) — pure
 * chord theory, independent of which hand/bellows direction is currently
 * displayed. A tone stays muted in the written formation even when the
 * physical parrilla position (sourceVoicing/derivedGhostFifth) isn't shown
 * because the user is on the other hand or bellows direction.
 */
export function omittedDegreesOf(chord: ParrillaChord | null | undefined): Set<string> {
  if (!chord) return new Set();
  return new Set(chord.theoreticalNotes.filter((note) => note.omitted).map((note) => note.degree));
}

/**
 * Whether this chord's documented physical position (sourceVoicing / ghost
 * fifth) applies to the hand + bellows direction currently on screen. Every
 * entry in the library is hand="left"/bellows="opening", so this is only
 * ever true there — but it's expressed as a comparison (not a hardcoded
 * "left"/"opening" check at the call site) so the intent stays explicit.
 */
export function isParrillaPhysicallyActive(
  chord: ParrillaChord | null | undefined,
  hand: "left" | "right",
  bellows: "opening" | "closing",
): chord is ParrillaChord {
  return !!chord && hand === chord.hand && bellows === chord.bellows;
}
