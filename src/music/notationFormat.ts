import type { ChordTone, ParsedChord } from "./chords";
import type { ParsedNote } from "./notes";

export type NotationMode = "latin" | "american" | "both";

export function formatNoteName(note: ParsedNote, mode: NotationMode): string {
  if (mode === "latin") return note.latin;
  if (mode === "american") return note.american;
  return `${note.latin} · ${note.american}`;
}

export function formatToneName(tone: ChordTone, mode: NotationMode): string {
  if (mode === "latin") return tone.latin;
  if (mode === "american") return tone.american;
  return `${tone.latin} · ${tone.american}`;
}

export function formatChordName(chord: ParsedChord, mode: NotationMode): string {
  if (mode === "latin") return chord.displayName;
  if (mode === "american") return chord.displayNameAmerican;
  return `${chord.displayName} · ${chord.displayNameAmerican}`;
}
