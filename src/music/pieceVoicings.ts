import type { BellowsDirection, HandLayout } from "../data/bandoneonLayout";
import type { ParsedChord } from "./chords";
import { parseNote } from "./notes";

/**
 * Left-hand chord voicings read straight from the written score of a piece in
 * "Mi primer año con el bandoneón" (H. Satorre), p. 41 "Desde el alma" (R. Melo).
 * The score gives the sounding notes; those exact pitches exist on the left
 * hand both opening and closing (on different buttons), so the buttons are
 * resolved per direction from the layout instead of being typed in.
 *
 * Separate from the 37-chord "parrilla" library and from the computed
 * suggestions: it only covers the chords that piece uses, and wins over both
 * for those chords.
 */

export interface PieceVoicingNote {
  pitch: string;
  degree: string;
}

export interface PieceVoicing {
  id: string;
  displayName: string;
  rootPitchClass: number;
  quality: ParsedChord["quality"];
  notes: PieceVoicingNote[];
  /** The 5th a seventh-chord voicing leaves out: shown faint, never as pressed (same pitch the parrilla library uses). */
  ghostFifth?: string;
  source: { book: string; piece: string; page: number };
}

export interface ResolvedPieceNote extends PieceVoicingNote {
  buttonId: string;
}

export interface ResolvedPieceVoicing {
  notes: ResolvedPieceNote[];
  ghost: ResolvedPieceNote | null;
}

const BOOK = "Mi primer año con el bandoneón";
const DESDE_EL_ALMA = { book: BOOK, piece: "Desde el alma", page: 41 };
const VALSE_AMELIE = { book: BOOK, piece: "La valse d'Amélie", page: 42 };

function voicing(
  id: string,
  displayName: string,
  rootPitchClass: number,
  quality: ParsedChord["quality"],
  notes: PieceVoicingNote[],
  ghostFifth?: string,
  source: PieceVoicing["source"] = DESDE_EL_ALMA,
): PieceVoicing {
  return { id, displayName, rootPitchClass, quality, notes, ghostFifth, source };
}

export const PIECE_VOICINGS: PieceVoicing[] = [
  voicing("mi7", "Mi7", 4, "7", [
    { pitch: "E2", degree: "1" },
    { pitch: "G#3", degree: "3" },
    { pitch: "D4", degree: "♭7" },
  ], "B3"),
  voicing("lam", "Lám", 9, "minor", [
    { pitch: "A2", degree: "1" },
    { pitch: "C4", degree: "♭3" },
    { pitch: "E4", degree: "5" },
  ]),
  voicing("la7", "Lá7", 9, "7", [
    { pitch: "A2", degree: "1" },
    { pitch: "G3", degree: "♭7" },
    { pitch: "C#4", degree: "3" },
  ], "E4"),
  voicing("rem", "Rém", 2, "minor", [
    { pitch: "D2", degree: "1" },
    { pitch: "F3", degree: "♭3" },
    { pitch: "A3", degree: "5" },
  ]),
  // Page 42 (La valse d'Amélie) repeats Rém and Lám exactly as above and adds these two.
  voicing("fa", "Fá", 5, "major", [
    { pitch: "F2", degree: "1" },
    { pitch: "A3", degree: "3" },
    { pitch: "C4", degree: "5" },
  ], undefined, VALSE_AMELIE),
  voicing("do", "Dó", 0, "major", [
    { pitch: "C3", degree: "1" },
    { pitch: "G3", degree: "5" },
    { pitch: "E4", degree: "3" },
  ], undefined, VALSE_AMELIE),
];

export function findPieceVoicing(chord: ParsedChord | null): PieceVoicing | undefined {
  if (!chord) return undefined;
  return PIECE_VOICINGS.find((entry) => entry.rootPitchClass === chord.tones[0].pitchClass && entry.quality === chord.quality);
}

function buttonFor(pitch: string, layout: HandLayout, direction: BellowsDirection): string | null {
  const midi = parseNote(pitch)?.midi;
  if (midi === undefined) return null;
  const matches = layout.buttons.filter((button) => parseNote(button[direction])?.midi === midi);
  return matches.length === 1 ? matches[0].id : null;
}

/** The button carrying each pitch in the given direction; null if any written pitch has no single button there. */
export function resolvePieceVoicing(voicingEntry: PieceVoicing, layout: HandLayout, direction: BellowsDirection): ResolvedPieceVoicing | null {
  const notes: ResolvedPieceNote[] = [];
  for (const note of voicingEntry.notes) {
    const buttonId = buttonFor(note.pitch, layout, direction);
    if (!buttonId) return null;
    notes.push({ ...note, buttonId });
  }
  // The faint 5th is only a hint: if it has no single button in this direction it is simply left out.
  const ghostButton = voicingEntry.ghostFifth ? buttonFor(voicingEntry.ghostFifth, layout, direction) : null;
  const ghost = voicingEntry.ghostFifth && ghostButton ? { pitch: voicingEntry.ghostFifth, degree: "5", buttonId: ghostButton } : null;
  return { notes, ghost };
}
