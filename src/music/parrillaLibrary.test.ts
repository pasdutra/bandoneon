import { describe, expect, it } from "vitest";
import { leftHand, rightHand } from "../data/bandoneonLayout";
import { parseNote } from "./notes";
import {
  findParrillaChord,
  isParrillaPhysicallyActive,
  mapGenericQualityToParrilla,
  omittedDegreesOf,
  PARRILLA_LIBRARY,
} from "./parrillaLibrary";

describe("Parrilla library — structural integrity", () => {
  it("has exactly 37 chords", () => {
    expect(PARRILLA_LIBRARY.length).toBe(37);
  });

  it("does not include Lá♭7 / Ab7", () => {
    const names = PARRILLA_LIBRARY.map((c) => c.displayName);
    expect(names).not.toContain("Lá♭7");
    expect(names).not.toContain("Ab7");
    const abPc = parseNote("Lá♭")!.pitchClass;
    expect(PARRILLA_LIBRARY.some((c) => c.rootPitchClass === abPc && c.quality === "dominant7")).toBe(false);
  });

  it("has exactly 10 minor, 11 dominant7, 8 major, 8 half-diminished", () => {
    const counts: Record<string, number> = {};
    for (const c of PARRILLA_LIBRARY) counts[c.quality] = (counts[c.quality] ?? 0) + 1;
    expect(counts.minor).toBe(10);
    expect(counts.dominant7).toBe(11);
    expect(counts.major).toBe(8);
    expect(counts["half-diminished"]).toBe(8);
  });

  it("every buttonId referenced exists in the left-hand layout", () => {
    const leftIds = new Set(leftHand.buttons.map((b) => b.id));
    for (const c of PARRILLA_LIBRARY) {
      for (const note of c.sourceVoicing) expect(leftIds.has(note.buttonId)).toBe(true);
      if (c.derivedGhostFifth) expect(leftIds.has(c.derivedGhostFifth.buttonId)).toBe(true);
    }
  });

  it("every buttonId starts with L — no right-hand (R) ids appear in this library", () => {
    for (const c of PARRILLA_LIBRARY) {
      for (const note of c.sourceVoicing) expect(note.buttonId.startsWith("L")).toBe(true);
      if (c.derivedGhostFifth) expect(c.derivedGhostFifth.buttonId.startsWith("L")).toBe(true);
    }
  });

  it("every entry uses hand=left, bellows=opening", () => {
    for (const c of PARRILLA_LIBRARY) {
      expect(c.hand).toBe("left");
      expect(c.bellows).toBe("opening");
    }
  });

  it("did not alter the 71-button layout data (count spot check)", () => {
    expect(leftHand.buttons).toHaveLength(33);
    expect(rightHand.buttons).toHaveLength(38);
  });
});

describe("Parrilla library — voicing shape per quality", () => {
  it("minor chords voice exactly 1, ♭3, 5", () => {
    for (const c of PARRILLA_LIBRARY.filter((c) => c.quality === "minor")) {
      expect(c.sourceVoicing.map((n) => n.degree).sort()).toEqual(["1", "5", "♭3"].sort());
    }
  });

  it("major chords voice exactly 1, 3, 5", () => {
    for (const c of PARRILLA_LIBRARY.filter((c) => c.quality === "major")) {
      expect(c.sourceVoicing.map((n) => n.degree).sort()).toEqual(["1", "3", "5"].sort());
    }
  });

  it("half-diminished chords voice exactly 1, ♭3, ♭5, ♭7 (nothing omitted)", () => {
    for (const c of PARRILLA_LIBRARY.filter((c) => c.quality === "half-diminished")) {
      expect(c.sourceVoicing.map((n) => n.degree).sort()).toEqual(["1", "♭3", "♭5", "♭7"].sort());
      expect(c.theoreticalNotes.every((n) => !n.omitted)).toBe(true);
    }
  });

  it("dominant7 chords voice exactly 1, 3, ♭7 (the 5th is left out of the voicing)", () => {
    for (const c of PARRILLA_LIBRARY.filter((c) => c.quality === "dominant7")) {
      expect(c.sourceVoicing.map((n) => n.degree).sort()).toEqual(["1", "3", "♭7"].sort());
    }
  });
});

describe("Parrilla library — dominant7 ghost fifth", () => {
  const dominants = PARRILLA_LIBRARY.filter((c) => c.quality === "dominant7");

  it("has exactly 11 dominant7 chords", () => {
    expect(dominants).toHaveLength(11);
  });

  it("all dominant7 chords mark their theoretical 5th as omitted", () => {
    for (const c of dominants) {
      const fifth = c.theoreticalNotes.find((n) => n.degree === "5");
      expect(fifth?.omitted).toBe(true);
    }
  });

  it("all dominant7 chords have exactly one derivedGhostFifth, degree 5, derived true", () => {
    for (const c of dominants) {
      expect(c.derivedGhostFifth).toBeDefined();
      expect(c.derivedGhostFifth?.degree).toBe("5");
      expect(c.derivedGhostFifth?.derived).toBe(true);
    }
  });

  it("the ghost fifth is never part of that chord's own sourceVoicing", () => {
    for (const c of dominants) {
      const ghostId = c.derivedGhostFifth!.buttonId;
      expect(c.sourceVoicing.some((n) => n.buttonId === ghostId)).toBe(false);
    }
  });

  it("the ghost fifth's physical button pitch matches the chord's theoretical fifth (enharmonic pitch class)", () => {
    for (const c of dominants) {
      const button = leftHand.buttons.find((b) => b.id === c.derivedGhostFifth!.buttonId)!;
      const physical = parseNote(button.opening)!;
      const theoreticalFifthPc = (c.rootPitchClass + 7) % 12;
      expect(physical.pitchClass).toBe(theoreticalFifthPc);
    }
  });

  it("Dó7 ghost fifth is L10 Sol4", () => {
    const c = PARRILLA_LIBRARY.find((c) => c.id === "do7")!;
    expect(c.derivedGhostFifth).toEqual({ buttonId: "L10", displayPitch: "Sol4", degree: "5", derived: true });
  });

  it("Si7 ghost fifth is L22 Fá♯4", () => {
    const c = PARRILLA_LIBRARY.find((c) => c.id === "si7")!;
    expect(c.derivedGhostFifth).toEqual({ buttonId: "L22", displayPitch: "Fá♯4", degree: "5", derived: true });
  });

  it("Dó♯7 ghost fifth is L30 Sol♯4", () => {
    const c = PARRILLA_LIBRARY.find((c) => c.id === "dos7")!;
    expect(c.derivedGhostFifth).toEqual({ buttonId: "L30", displayPitch: "Sol♯4", degree: "5", derived: true });
  });
});

describe("Parrilla library — theoretical formation is hand/bellows-independent", () => {
  const dominants = PARRILLA_LIBRARY.filter((c) => c.quality === "dominant7");

  it("all 11 dominant7 chords keep theoreticalNotes in harmonic order 1, 3, 5, ♭7", () => {
    expect(dominants).toHaveLength(11);
    for (const c of dominants) {
      expect(c.theoreticalNotes.map((n) => n.degree)).toEqual(["1", "3", "5", "♭7"]);
    }
  });

  it("the omitted 5th always sits in the third slot (never moved to the end or elsewhere)", () => {
    for (const c of dominants) {
      expect(c.theoreticalNotes[2].degree).toBe("5");
      expect(c.theoreticalNotes[2].omitted).toBe(true);
      expect(c.theoreticalNotes.filter((n) => n.omitted)).toHaveLength(1);
    }
  });

  it("omittedDegreesOf returns exactly {5} for every dominant7 chord", () => {
    for (const c of dominants) {
      expect(omittedDegreesOf(c)).toEqual(new Set(["5"]));
    }
  });

  it("omittedDegreesOf returns an empty set for minor/major/half-diminished chords (nothing omitted)", () => {
    for (const c of PARRILLA_LIBRARY.filter((c) => c.quality !== "dominant7")) {
      expect(omittedDegreesOf(c)).toEqual(new Set());
    }
  });

  it("omittedDegreesOf takes no hand/bellows argument — it cannot vary when those change", () => {
    const c = PARRILLA_LIBRARY.find((c) => c.id === "do7")!;
    const a = omittedDegreesOf(c);
    const b = omittedDegreesOf(c);
    expect(a).toEqual(b);
    expect(a).toEqual(new Set(["5"]));
  });

  it("omittedDegreesOf is null-safe (no matched chord => nothing omitted)", () => {
    expect(omittedDegreesOf(null)).toEqual(new Set());
    expect(omittedDegreesOf(undefined)).toEqual(new Set());
  });

  it("Dó7: Dó · Mi · Sol · Si♭, with Sol/5 muted in the third slot", () => {
    const c = PARRILLA_LIBRARY.find((c) => c.id === "do7")!;
    expect(c.theoreticalNotes.map((n) => n.spelling)).toEqual(["Dó", "Mi", "Sol", "Si♭"]);
    expect(c.theoreticalNotes[2]).toEqual({ spelling: "Sol", degree: "5", omitted: true });
  });

  it("Lá7: Lá · Dó♯ · Mi · Sol, with Mi/5 muted in the third slot", () => {
    const c = PARRILLA_LIBRARY.find((c) => c.id === "la7")!;
    expect(c.theoreticalNotes.map((n) => n.spelling)).toEqual(["Lá", "Dó♯", "Mi", "Sol"]);
    expect(c.theoreticalNotes[2]).toEqual({ spelling: "Mi", degree: "5", omitted: true });
  });

  it("Dó♯7: Dó♯ · Mi♯ · Sol♯ · Si, with Sol♯/5 muted in the third slot", () => {
    const c = PARRILLA_LIBRARY.find((c) => c.id === "dos7")!;
    expect(c.theoreticalNotes.map((n) => n.spelling)).toEqual(["Dó♯", "Mi♯", "Sol♯", "Si"]);
    expect(c.theoreticalNotes[2]).toEqual({ spelling: "Sol♯", degree: "5", omitted: true });
  });

  it("Si♭7: Si♭ · Ré · Fá · Lá♭, with Fá/5 muted in the third slot", () => {
    const c = PARRILLA_LIBRARY.find((c) => c.id === "sib7")!;
    expect(c.theoreticalNotes.map((n) => n.spelling)).toEqual(["Si♭", "Ré", "Fá", "Lá♭"]);
    expect(c.theoreticalNotes[2]).toEqual({ spelling: "Fá", degree: "5", omitted: true });
  });
});

describe("Parrilla library — physical position gating (isParrillaPhysicallyActive)", () => {
  const do7 = PARRILLA_LIBRARY.find((c) => c.id === "do7")!;

  it("is active for left hand + bellows opening (matches every entry's documented hand/bellows)", () => {
    expect(isParrillaPhysicallyActive(do7, "left", "opening")).toBe(true);
  });

  it("is NOT active for the right hand, regardless of bellows direction", () => {
    expect(isParrillaPhysicallyActive(do7, "right", "opening")).toBe(false);
    expect(isParrillaPhysicallyActive(do7, "right", "closing")).toBe(false);
  });

  it("is NOT active on bellows closing, even on the left hand", () => {
    expect(isParrillaPhysicallyActive(do7, "left", "closing")).toBe(false);
  });

  it("is NOT active when there is no matched chord", () => {
    expect(isParrillaPhysicallyActive(null, "left", "opening")).toBe(false);
    expect(isParrillaPhysicallyActive(undefined, "left", "opening")).toBe(false);
  });

  it("switching hand/bellows changes physical activity but never the theoretical omission", () => {
    for (const hand of ["left", "right"] as const) {
      for (const bellows of ["opening", "closing"] as const) {
        // The written formation's omitted degrees must stay {5} no matter
        // which hand/bellows combination is currently on screen.
        expect(omittedDegreesOf(do7)).toEqual(new Set(["5"]));
        void isParrillaPhysicallyActive(do7, hand, bellows);
      }
    }
  });
});

describe("Parrilla library — required spellings", () => {
  function spellingOf(id: string) {
    return PARRILLA_LIBRARY.find((c) => c.id === id)!.theoreticalNotes.map((n) => n.spelling);
  }

  it("Dó♯7 renders Dó♯ · Mi♯ · Sol♯ · Si (never Fá)", () => {
    const spelling = spellingOf("dos7");
    expect(spelling).toEqual(["Dó♯", "Mi♯", "Sol♯", "Si"]);
    expect(spelling).not.toContain("Fá");
  });

  it("Si♭7 renders Si♭ · Ré · Fá · Lá♭", () => {
    expect(spellingOf("sib7")).toEqual(["Si♭", "Ré", "Fá", "Lá♭"]);
  });

  it("Mi♭7 renders Mi♭ · Sol · Si♭ · Ré♭", () => {
    expect(spellingOf("mib7")).toEqual(["Mi♭", "Sol", "Si♭", "Ré♭"]);
  });

  it("Dóø renders Dó · Mi♭ · Sol♭ · Si♭", () => {
    expect(spellingOf("do-hd")).toEqual(["Dó", "Mi♭", "Sol♭", "Si♭"]);
  });
});

describe("Parrilla library — matches the real 71-button layout exactly", () => {
  it("every sourceVoicing pitch matches that button's actual opening pitch class + octave", () => {
    for (const c of PARRILLA_LIBRARY) {
      for (const note of c.sourceVoicing) {
        const button = leftHand.buttons.find((b) => b.id === note.buttonId)!;
        const physical = parseNote(button.opening)!;
        const displayed = parseNote(note.displayPitch)!;
        expect(physical.pitchClass).toBe(displayed.pitchClass);
        expect(physical.octave).toBe(displayed.octave);
      }
    }
  });
});

describe("mapGenericQualityToParrilla / findParrillaChord", () => {
  it("maps generic qualities to parrilla qualities, or null when there's no equivalent", () => {
    expect(mapGenericQualityToParrilla("major")).toBe("major");
    expect(mapGenericQualityToParrilla("minor")).toBe("minor");
    expect(mapGenericQualityToParrilla("7")).toBe("dominant7");
    expect(mapGenericQualityToParrilla("m7b5")).toBe("half-diminished");
    expect(mapGenericQualityToParrilla("maj7")).toBeNull();
    expect(mapGenericQualityToParrilla("m7")).toBeNull();
    expect(mapGenericQualityToParrilla("dim")).toBeNull();
  });

  it("finds a chord by root pitch class + quality", () => {
    const gPc = parseNote("Sol")!.pitchClass;
    expect(findParrillaChord(gPc, "minor")?.displayName).toBe("Solm");
  });

  it("does not find a Lá♭ dominant7 (deliberately excluded)", () => {
    const abPc = parseNote("Lá♭")!.pitchClass;
    expect(findParrillaChord(abPc, "dominant7")).toBeUndefined();
  });
});
