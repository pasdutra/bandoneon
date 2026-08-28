import { describe, expect, it } from "vitest";
import { rightHand, leftHand, type BellowsDirection, type HandLayout } from "../data/bandoneonLayout";
import { parseChord } from "./chords";
import { findChordPositions } from "./chordPositions";
import { parseNote } from "./notes";

const FAVORITES = ["Solm", "Dóm", "Fám", "Fá♯m", "Dó♯m", "Sol♯m", "Lá7", "Dó♯7", "Fá7", "Si♭7", "Mi♭7", "Lá♭7"];
const DIRECTIONS: BellowsDirection[] = ["opening", "closing"];
const HANDS: Array<{ label: string; layout: HandLayout }> = [
  { label: "left", layout: leftHand },
  { label: "right", layout: rightHand },
];

describe("findChordPositions", () => {
  it("marks a chord complete when every tone has at least one matching button", () => {
    const chord = parseChord("Solm")!;
    const result = findChordPositions(chord, rightHand, "opening");
    expect(result.status === "complete" || result.status === "complete-open").toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.suggested).not.toBeNull();
  });

  it("suggested combo assigns one distinct button per chord tone", () => {
    const chord = parseChord("Dó♯7")!;
    const result = findChordPositions(chord, leftHand, "opening");
    expect(result.suggested).not.toBeNull();
    const assignments = result.suggested!.assignments;
    expect(assignments).toHaveLength(chord.tones.length);
    const ids = assignments.map((a) => a.button.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ranks alternatives by non-decreasing geometric spread from the suggestion", () => {
    const chord = parseChord("Lá7")!;
    const result = findChordPositions(chord, rightHand, "opening");
    if (result.suggested && result.alternatives.length > 0) {
      const spans = [result.suggested.spanScore, ...result.alternatives.map((a) => a.spanScore)];
      for (let i = 1; i < spans.length; i++) {
        expect(spans[i]).toBeGreaterThanOrEqual(spans[i - 1]);
      }
    }
  });

  it("when incomplete, every reported missing tone truly has no matching button in that hand/direction", () => {
    for (const name of FAVORITES) {
      const chord = parseChord(name)!;
      for (const { layout } of HANDS) {
        for (const direction of DIRECTIONS) {
          const result = findChordPositions(chord, layout, direction);
          if (result.status === "incomplete") {
            expect(result.suggested).toBeNull();
            expect(result.missing.length).toBeGreaterThan(0);
            for (const tone of result.missing) {
              const hasButton = layout.buttons.some((b) => parseNote(b[direction])?.pitchClass === tone.pitchClass);
              expect(hasButton).toBe(false);
            }
          } else {
            expect(result.missing).toHaveLength(0);
            expect(result.suggested).not.toBeNull();
          }
        }
      }
    }
  });

  it("recomputes independently for opening vs closing on the same hand", () => {
    const chord = parseChord("Fá♯m")!;
    const opening = findChordPositions(chord, leftHand, "opening");
    const closing = findChordPositions(chord, leftHand, "closing");
    // Same layout, different pitch mapping per button — results are computed
    // fresh per direction rather than reused.
    expect(opening).not.toBe(closing);
  });
});
