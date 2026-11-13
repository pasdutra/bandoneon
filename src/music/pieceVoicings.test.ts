import { describe, expect, it } from "vitest";
import { leftHand } from "../data/bandoneonLayout";
import { parseChord } from "./chords";
import { findPieceVoicing, PIECE_VOICINGS, resolvePieceVoicing } from "./pieceVoicings";

describe("Desde el alma voicings (p. 41)", () => {
  it("every chord resolves to exactly one left-hand button per note, opening and closing", () => {
    for (const entry of PIECE_VOICINGS) {
      for (const direction of ["opening", "closing"] as const) {
        const resolved = resolvePieceVoicing(entry, leftHand, direction);
        expect(resolved, `${entry.displayName} ${direction}`).not.toBeNull();
        expect(new Set(resolved!.notes.map((n) => n.buttonId)).size).toBe(entry.notes.length);
      }
    }
  });

  it("seventh chords keep the omitted 5th as a faint ghost in both directions; others have none", () => {
    const ghost = (name: string, direction: "opening" | "closing") =>
      resolvePieceVoicing(findPieceVoicing(parseChord(name))!, leftHand, direction)!.ghost?.buttonId;
    expect(ghost("Mi7", "opening")).toBe("L12");
    expect(ghost("Lá7", "opening")).toBe("L19");
    expect(ghost("Mi7", "closing")).toBeDefined();
    expect(ghost("Lá7", "closing")).toBeDefined();
    expect(ghost("Lám", "opening")).toBeUndefined();
    expect(ghost("Rém", "closing")).toBeUndefined();
  });

  it("resolves to the buttons that carry the written pitches", () => {
    const ids = (name: string, direction: "opening" | "closing") =>
      resolvePieceVoicing(findPieceVoicing(parseChord(name))!, leftHand, direction)!.notes.map((n) => n.buttonId);
    expect(ids("Mi7", "opening")).toEqual(["L02", "L07", "L17"]);
    expect(ids("Mi7", "closing")).toEqual(["L01", "L26", "L19"]);
    expect(ids("Lám", "opening")).toEqual(["L06", "L14", "L19"]);
    expect(ids("Lám", "closing")).toEqual(["L03", "L16", "L22"]);
    expect(ids("Lá7", "opening")).toEqual(["L06", "L11", "L26"]);
    expect(ids("Lá7", "closing")).toEqual(["L03", "L09", "L17"]);
    expect(ids("Rém", "opening")).toEqual(["L01", "L25", "L09"]);
    expect(ids("Rém", "closing")).toEqual(["L02", "L24", "L12"]);
  });

  it("includes the two chords added by La valse d'Amélie (p. 42)", () => {
    const entry = (name: string) => findPieceVoicing(parseChord(name))!;
    expect(entry("Fá").notes.map((n) => n.pitch)).toEqual(["F2", "A3", "C4"]);
    expect(entry("Dó").notes.map((n) => n.pitch)).toEqual(["C3", "G3", "E4"]);
    expect(entry("Fá").source.page).toBe(42);
    expect(entry("Mi7").source.page).toBe(41);
  });

  it("only matches the four chords of the piece", () => {
    expect(findPieceVoicing(parseChord("Solm"))).toBeUndefined();
    expect(findPieceVoicing(parseChord("Lám7"))).toBeUndefined();
    expect(findPieceVoicing(parseChord("Mi"))).toBeUndefined();
  });
});
