import { naturalPitchClass, parseNote, type Letter } from "./notes";

export type ChordQuality = "major" | "minor" | "7" | "m7" | "maj7" | "dim" | "m7b5";

export interface ChordTone {
  degree: string;
  pitchClass: number;
  scientific: string;
  latin: string;
  american: string;
}

export interface ParsedChord {
  root: string;
  rootLatin: string;
  rootAmerican: string;
  quality: ChordQuality;
  displayName: string;
  displayNameAmerican: string;
  tones: ChordTone[];
}

const LETTERS: Letter[] = ["C", "D", "E", "F", "G", "A", "B"];
const LATIN: Record<Letter, string> = { C: "Dó", D: "Ré", E: "Mi", F: "Fá", G: "Sol", A: "Lá", B: "Si" };

const QUALITIES: Record<ChordQuality, Array<{ degree: string; diatonic: number; semitones: number }>> = {
  major: [
    { degree: "1", diatonic: 1, semitones: 0 },
    { degree: "3", diatonic: 3, semitones: 4 },
    { degree: "5", diatonic: 5, semitones: 7 },
  ],
  minor: [
    { degree: "1", diatonic: 1, semitones: 0 },
    { degree: "♭3", diatonic: 3, semitones: 3 },
    { degree: "5", diatonic: 5, semitones: 7 },
  ],
  "7": [
    { degree: "1", diatonic: 1, semitones: 0 },
    { degree: "3", diatonic: 3, semitones: 4 },
    { degree: "5", diatonic: 5, semitones: 7 },
    { degree: "♭7", diatonic: 7, semitones: 10 },
  ],
  m7: [
    { degree: "1", diatonic: 1, semitones: 0 },
    { degree: "♭3", diatonic: 3, semitones: 3 },
    { degree: "5", diatonic: 5, semitones: 7 },
    { degree: "♭7", diatonic: 7, semitones: 10 },
  ],
  maj7: [
    { degree: "1", diatonic: 1, semitones: 0 },
    { degree: "3", diatonic: 3, semitones: 4 },
    { degree: "5", diatonic: 5, semitones: 7 },
    { degree: "7", diatonic: 7, semitones: 11 },
  ],
  dim: [
    { degree: "1", diatonic: 1, semitones: 0 },
    { degree: "♭3", diatonic: 3, semitones: 3 },
    { degree: "♭5", diatonic: 5, semitones: 6 },
  ],
  m7b5: [
    { degree: "1", diatonic: 1, semitones: 0 },
    { degree: "♭3", diatonic: 3, semitones: 3 },
    { degree: "♭5", diatonic: 5, semitones: 6 },
    { degree: "♭7", diatonic: 7, semitones: 10 },
  ],
};

function accidentalText(delta: number) {
  if (delta === 0) return "";
  if (delta === 1) return "♯";
  if (delta === 2) return "♯♯";
  if (delta === -1) return "♭";
  if (delta === -2) return "♭♭";
  return delta > 0 ? "♯".repeat(delta) : "♭".repeat(-delta);
}

function scientificAccidental(delta: number) {
  return delta > 0 ? "#".repeat(delta) : delta < 0 ? "b".repeat(-delta) : "";
}

function signedPitchDifference(target: number, natural: number) {
  let diff = (target - natural + 12) % 12;
  if (diff > 6) diff -= 12;
  return diff;
}

function parseQuality(raw: string): ChordQuality | null {
  const q = raw
    .trim()
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("♭", "b")
    .replaceAll("♯", "#")
    .replaceAll("(", "")
    .replaceAll(")", "");
  if (q === "" || q === "maior" || q === "maj") return "major";
  if (q === "m" || q === "min" || q === "menor") return "minor";
  if (q === "7") return "7";
  if (q === "m7" || q === "min7" || q === "menor7") return "m7";
  if (q === "maj7" || q === "maior7" || q === "7m") return "maj7";
  if (q === "dim" || q === "°" || q === "diminuto") return "dim";
  if (q === "m7b5" || q === "min7b5" || q === "menor7b5" || q === "m7-5" || q === "ø" || q === "ø7") return "m7b5";
  return null;
}

function splitChordInput(input: string): { rootText: string; qualityText: string } | null {
  const text = input.trim();
  if (!text) return null;
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const rootMatch = normalized.match(/^(do|re|mi|fa|sol|la|si|[A-Ga-g])([#♯b♭]?)(.*)$/i);
  if (!rootMatch) return null;
  return { rootText: `${rootMatch[1]}${rootMatch[2] ?? ""}`, qualityText: rootMatch[3] ?? "" };
}

export function parseChord(input: string): ParsedChord | null {
  const split = splitChordInput(input);
  if (!split) return null;
  const root = parseNote(split.rootText);
  const quality = parseQuality(split.qualityText);
  if (!root || quality === null) return null;

  const rootIndex = LETTERS.indexOf(root.letter);
  const rootPc = root.pitchClass;
  const tones = QUALITIES[quality].map(({ degree, diatonic, semitones }) => {
    const targetPc = (rootPc + semitones) % 12;
    const letter = LETTERS[(rootIndex + diatonic - 1) % 7];
    const naturalPc = naturalPitchClass[letter];
    const accidental = signedPitchDifference(targetPc, naturalPc);
    return {
      degree,
      pitchClass: targetPc,
      scientific: `${letter}${scientificAccidental(accidental)}`,
      latin: `${LATIN[letter]}${accidentalText(accidental)}`,
      american: `${letter}${accidentalText(accidental)}`,
    };
  });

  const suffix: Record<ChordQuality, string> = {
    major: "",
    minor: "m",
    "7": "7",
    m7: "m7",
    maj7: "maj7",
    dim: "°",
    m7b5: "m7♭5",
  };

  return {
    root: root.scientific,
    rootLatin: root.latin,
    rootAmerican: root.american,
    quality,
    displayName: `${root.latin}${suffix[quality]}`,
    displayNameAmerican: `${root.american}${suffix[quality]}`,
    tones,
  };
}
