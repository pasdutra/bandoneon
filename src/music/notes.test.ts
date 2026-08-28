import { describe, expect, it } from "vitest";
import { enharmonicOf, noteMatchesQuery, parseNote, samePitch } from "./notes";

describe("parseNote — Latin notation", () => {
  const cases: Array<[string, string, number]> = [
    ["Dó", "C", 0],
    ["Ré", "D", 2],
    ["Mi", "E", 4],
    ["Fá", "F", 5],
    ["Sol", "G", 7],
    ["Lá", "A", 9],
    ["Si", "B", 11],
  ];

  it.each(cases)("parses %s as letter %s with pitch class %i", (input, letter, pitchClass) => {
    const note = parseNote(input);
    expect(note).not.toBeNull();
    expect(note?.letter).toBe(letter);
    expect(note?.pitchClass).toBe(pitchClass);
    expect(note?.octave).toBeUndefined();
  });

  it("accepts Latin spelling without diacritics (do, re, la...)", () => {
    expect(parseNote("do")?.letter).toBe("C");
    expect(parseNote("re")?.letter).toBe("D");
    expect(parseNote("la")?.letter).toBe("A");
  });
});

describe("parseNote — Anglo-Saxon notation", () => {
  const letters = ["C", "D", "E", "F", "G", "A", "B"];
  it.each(letters)("parses bare letter %s", (letter) => {
    const note = parseNote(letter);
    expect(note?.letter).toBe(letter);
    expect(note?.octave).toBeUndefined();
  });
});

describe("parseNote — accidentals", () => {
  it("accepts # and ♯ as sharp in Latin and Anglo forms", () => {
    expect(parseNote("Fá#")?.pitchClass).toBe(6);
    expect(parseNote("Fá♯")?.pitchClass).toBe(6);
    expect(parseNote("F#")?.pitchClass).toBe(6);
  });

  it("accepts b and ♭ as flat in Latin and Anglo forms", () => {
    expect(parseNote("Solb")?.pitchClass).toBe(6);
    expect(parseNote("Sol♭")?.pitchClass).toBe(6);
    expect(parseNote("Gb")?.pitchClass).toBe(6);
  });

  it("preserves the spelling the user typed rather than normalizing sharp/flat", () => {
    expect(parseNote("Fá♯4")?.latin).toBe("Fá♯4");
    expect(parseNote("Sol♭4")?.latin).toBe("Sol♭4");
    expect(parseNote("F#4")?.scientific).toBe("F#4");
    expect(parseNote("Gb4")?.scientific).toBe("Gb4");
  });
});

describe("parseNote — octave", () => {
  it("leaves octave undefined when not specified", () => {
    const note = parseNote("Sol");
    expect(note?.octave).toBeUndefined();
    expect(note?.midi).toBeUndefined();
  });

  it("captures an explicit octave and computes midi", () => {
    const note = parseNote("Sol4");
    expect(note?.octave).toBe(4);
    expect(note?.midi).toBe(67);
  });

  it("Sol and Sol4 are not the same parsed note", () => {
    const bare = parseNote("Sol");
    const withOctave = parseNote("Sol4");
    expect(bare?.octave).not.toBe(withOctave?.octave);
  });
});

describe("enharmonic equivalence", () => {
  it("treats Fá♯ and Solb as the same pitch class ignoring octave", () => {
    expect(samePitch("Fá♯", "Solb", false)).toBe(true);
  });

  it("treats different octaves of the same pitch class as different exact pitches", () => {
    expect(samePitch("Sol3", "Sol4", true)).toBe(false);
    expect(samePitch("Sol3", "Sol4", false)).toBe(true);
  });

  it("noteMatchesQuery ignores octave when the query has none", () => {
    const query = parseNote("Sol")!;
    expect(noteMatchesQuery("G3", query)).toBe(true);
    expect(noteMatchesQuery("G6", query)).toBe(true);
    expect(noteMatchesQuery("A3", query)).toBe(false);
  });

  it("noteMatchesQuery requires exact octave when the query has one", () => {
    const query = parseNote("Sol4")!;
    expect(noteMatchesQuery("G4", query)).toBe(true);
    expect(noteMatchesQuery("G5", query)).toBe(false);
  });
});

describe("enharmonicOf", () => {
  it("spells the sharp/flat counterpart for black-key pitches", () => {
    const cSharp = parseNote("Dó♯4")!;
    const enharmonic = enharmonicOf(cSharp);
    expect(enharmonic?.letter).toBe("D");
    expect(enharmonic?.accidental).toBe(-1);
    expect(enharmonic?.latin).toBe("Ré♭4");
  });

  it("round-trips: the enharmonic of the enharmonic is the original spelling", () => {
    const original = parseNote("Si♭3")!;
    const enharmonic = enharmonicOf(original)!;
    const back = enharmonicOf(enharmonic)!;
    expect(back.letter).toBe(original.letter);
    expect(back.accidental).toBe(original.accidental);
  });

  it("returns null for natural notes without a simple enharmonic spelling", () => {
    expect(enharmonicOf(parseNote("Dó4")!)).toBeNull();
    expect(enharmonicOf(parseNote("Sol")!)).toBeNull();
  });
});
