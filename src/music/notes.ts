export type Letter = "C" | "D" | "E" | "F" | "G" | "A" | "B";

export interface ParsedNote {
  letter: Letter;
  accidental: -2 | -1 | 0 | 1 | 2;
  octave?: number;
  midi?: number;
  pitchClass: number;
  scientific: string;
  latin: string;
  /** American letter name with a proper ♯/♭ glyph (not the ASCII #/b of `scientific`). */
  american: string;
}

const NATURAL_PC: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const LATIN_TO_LETTER: Array<[RegExp, Letter]> = [
  [/^(do|dó)/i, "C"],
  [/^(re|ré)/i, "D"],
  [/^mi/i, "E"],
  [/^(fa|fá)/i, "F"],
  [/^sol/i, "G"],
  [/^(la|lá)/i, "A"],
  [/^si/i, "B"],
];

const LETTER_TO_LATIN: Record<Letter, string> = {
  C: "Dó",
  D: "Ré",
  E: "Mi",
  F: "Fá",
  G: "Sol",
  A: "Lá",
  B: "Si",
};

const ACCIDENTAL_TEXT: Record<number, string> = {
  [-2]: "♭♭",
  [-1]: "♭",
  [0]: "",
  [1]: "♯",
  [2]: "♯♯",
};

function normalizeAccidental(raw = ""): -2 | -1 | 0 | 1 | 2 {
  const s = raw.replaceAll("♯", "#").replaceAll("♭", "b");
  if (s === "##") return 2;
  if (s === "#") return 1;
  if (s === "bb") return -2;
  if (s === "b") return -1;
  return 0;
}

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function buildNote(letter: Letter, accidental: -2 | -1 | 0 | 1 | 2, octave: number | undefined): ParsedNote {
  const pitchClass = (NATURAL_PC[letter] + accidental + 120) % 12;
  const midi = octave === undefined ? undefined : 12 * (octave + 1) + NATURAL_PC[letter] + accidental;
  const accText = ACCIDENTAL_TEXT[accidental];

  return {
    letter,
    accidental,
    octave,
    midi,
    pitchClass,
    scientific: `${letter}${accidental > 0 ? "#".repeat(accidental) : accidental < 0 ? "b".repeat(-accidental) : ""}${octave ?? ""}`,
    latin: `${LETTER_TO_LATIN[letter]}${accText}${octave ?? ""}`,
    american: `${letter}${accText}${octave ?? ""}`,
  };
}

export function parseNote(input: string): ParsedNote | null {
  let value = input.trim();
  if (!value) return null;

  value = value.replaceAll("♯", "#").replaceAll("♭", "b");
  const plain = stripDiacritics(value);

  let letter: Letter | null = null;
  let rest = "";

  const scientific = plain.match(/^([A-Ga-g])([#b]{0,2})(-?\d+)?$/);
  if (scientific) {
    letter = scientific[1].toUpperCase() as Letter;
    rest = `${scientific[2] ?? ""}${scientific[3] ?? ""}`;
  } else {
    for (const [pattern, candidate] of LATIN_TO_LETTER) {
      const match = plain.match(pattern);
      if (match) {
        letter = candidate;
        rest = plain.slice(match[0].length);
        break;
      }
    }
  }

  if (!letter) return null;
  const tail = rest.match(/^([#b]{0,2})(-?\d+)?$/);
  if (!tail) return null;

  const accidental = normalizeAccidental(tail[1]);
  const octave = tail[2] === undefined ? undefined : Number(tail[2]);
  return buildNote(letter, accidental, octave);
}

const SHARP_TO_FLAT_SPELLING: Partial<Record<number, Letter>> = {
  1: "D",
  3: "E",
  6: "G",
  8: "A",
  10: "B",
};

const FLAT_TO_SHARP_SPELLING: Partial<Record<number, Letter>> = {
  1: "C",
  3: "D",
  6: "F",
  8: "G",
  10: "A",
};

/**
 * Returns the standard alternate spelling for a black-key pitch (e.g. C#4 -> Db4).
 * Natural notes and double accidentals have no simple enharmonic counterpart here
 * and return null, since bandoneon buttons never sound those spellings.
 */
export function enharmonicOf(note: ParsedNote): ParsedNote | null {
  if (note.accidental === 1) {
    const letter = SHARP_TO_FLAT_SPELLING[note.pitchClass];
    if (!letter) return null;
    return buildNote(letter, -1, note.octave);
  }
  if (note.accidental === -1) {
    const letter = FLAT_TO_SHARP_SPELLING[note.pitchClass];
    if (!letter) return null;
    return buildNote(letter, 1, note.octave);
  }
  return null;
}

export function pitchToMidi(pitch: string): number {
  const note = parseNote(pitch);
  if (!note || note.midi === undefined) throw new Error(`Invalid pitch: ${pitch}`);
  return note.midi;
}

export function pitchToLatin(pitch: string): string {
  const note = parseNote(pitch);
  return note?.latin ?? pitch;
}

export function pitchToAmerican(pitch: string): string {
  const note = parseNote(pitch);
  return note?.american ?? pitch;
}

export function samePitch(a: string, b: string, octaveSensitive = true) {
  const pa = parseNote(a);
  const pb = parseNote(b);
  if (!pa || !pb) return false;
  if (octaveSensitive && pa.midi !== undefined && pb.midi !== undefined) return pa.midi === pb.midi;
  return pa.pitchClass === pb.pitchClass;
}

export function noteMatchesQuery(pitch: string, query: ParsedNote) {
  const candidate = parseNote(pitch);
  if (!candidate) return false;
  if (query.octave !== undefined) return candidate.midi === query.midi;
  return candidate.pitchClass === query.pitchClass;
}

export const naturalNoteNames = LETTER_TO_LATIN;
export const naturalPitchClass = NATURAL_PC;
