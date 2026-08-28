import { describe, expect, it } from "vitest";
import { parseChord } from "./chords";
import { formatChordName, formatToneName } from "./notationFormat";
import { parseNote } from "./notes";

describe("american note spelling", () => {
  it("uses proper ♯/♭ glyphs, not ASCII", () => {
    expect(parseNote("Fá♯4")?.american).toBe("F♯4");
    expect(parseNote("Sol♭4")?.american).toBe("G♭4");
    expect(parseNote("Dó")?.american).toBe("C");
  });
});

describe("formatNoteName / formatChordName / formatToneName", () => {
  it("latin mode matches the existing Latin display", () => {
    const chord = parseChord("Solm")!;
    expect(formatChordName(chord, "latin")).toBe("Solm");
    expect(formatToneName(chord.tones[1], "latin")).toBe("Si♭");
  });

  it("american mode uses letter names", () => {
    const chord = parseChord("Solm")!;
    expect(formatChordName(chord, "american")).toBe("Gm");
    expect(formatToneName(chord.tones[1], "american")).toBe("B♭");
  });

  it("both mode combines latin and american separated by a middle dot", () => {
    const chord = parseChord("Solm")!;
    expect(formatChordName(chord, "both")).toBe("Solm · Gm");
  });
});
