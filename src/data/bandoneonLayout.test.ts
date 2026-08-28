import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import { bandoneonLayout, leftHand, rightHand } from "./bandoneonLayout";
import { parseNote } from "../music/notes";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function chromaticRange(startLetter: string, startOctave: number, endLetter: string, endOctave: number) {
  const startIndex = NOTE_NAMES.indexOf(startLetter) + startOctave * 12;
  const endIndex = NOTE_NAMES.indexOf(endLetter) + endOctave * 12;
  const names: string[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    const octave = Math.floor(i / 12);
    const letter = NOTE_NAMES[((i % 12) + 12) % 12];
    names.push(`${letter}${octave}`);
  }
  return names;
}

function countByPitch(buttons: Array<{ opening?: string; closing?: string }>, field: "opening" | "closing") {
  const counts = new Map<string, number>();
  for (const button of buttons) {
    const pitch = button[field]!;
    counts.set(pitch, (counts.get(pitch) ?? 0) + 1);
  }
  return counts;
}

describe("71-button layout integrity", () => {
  it("has exactly 71 buttons: 38 right + 33 left", () => {
    expect(rightHand.buttons).toHaveLength(38);
    expect(leftHand.buttons).toHaveLength(33);
    expect(bandoneonLayout.totalButtons).toBe(71);
  });

  it("every button id is unique within its hand", () => {
    expect(new Set(rightHand.buttons.map((b) => b.id)).size).toBe(rightHand.buttons.length);
    expect(new Set(leftHand.buttons.map((b) => b.id)).size).toBe(leftHand.buttons.length);
  });

  it("every button has both an opening and a closing pitch that parse", () => {
    for (const button of [...leftHand.buttons, ...rightHand.buttons]) {
      expect(parseNote(button.opening)).not.toBeNull();
      expect(parseNote(button.closing)).not.toBeNull();
    }
  });

  it("right hand opening covers A3–B6 exactly once each, except A#6 which is absent (CLAUDE.md invariant)", () => {
    const expected = chromaticRange("A", 3, "B", 6);
    const counts = countByPitch(rightHand.buttons, "opening");
    for (const pitch of expected) {
      const count = counts.get(pitch) ?? 0;
      if (pitch === "A#6") {
        expect(count).toBe(0);
      } else {
        expect(count).toBe(1);
      }
    }
    // no button opening falls outside the documented range
    for (const pitch of counts.keys()) {
      expect(expected).toContain(pitch);
    }
  });

  it("left hand opening covers C2–A4 exactly once each, except C#2 which is absent (CLAUDE.md invariant)", () => {
    const expected = chromaticRange("C", 2, "A", 4);
    const counts = countByPitch(leftHand.buttons, "opening");
    for (const pitch of expected) {
      const count = counts.get(pitch) ?? 0;
      if (pitch === "C#2") {
        expect(count).toBe(0);
      } else {
        expect(count).toBe(1);
      }
    }
    for (const pitch of counts.keys()) {
      expect(expected).toContain(pitch);
    }
  });

  it("guards against silent future edits to opening/closing pitches or geometry", () => {
    // This is a content fingerprint of the full 71-button table (id, x, y,
    // opening, closing). If this test ever fails, the layout data changed —
    // that must be an explicit, reviewed decision, never a side effect of a
    // refactor. Do not "fix" this test by regenerating the hash without
    // confirming the underlying data change was intentional.
    const serialized = JSON.stringify({
      left: leftHand.buttons,
      right: rightHand.buttons,
    });
    const hash = createHash("sha256").update(serialized).digest("hex");
    expect(hash).toBe("8159c807fadacec7f537b0ae83060fd7a4b09f84b9ac051ff20ce3ca07665e74");
  });
});
