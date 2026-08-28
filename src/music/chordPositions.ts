import type { BandoneonButton, BellowsDirection, HandLayout } from "../data/bandoneonLayout";
import type { ChordTone, ParsedChord } from "./chords";
import { parseNote } from "./notes";

export type ChordPositionStatus = "complete" | "complete-open" | "incomplete";

export interface ChordButtonAssignment {
  tone: ChordTone;
  button: BandoneonButton;
}

export interface ChordPositionCombo {
  assignments: ChordButtonAssignment[];
  spanScore: number;
}

export interface ChordPositionResult {
  status: ChordPositionStatus;
  missing: ChordTone[];
  suggested: ChordPositionCombo | null;
  alternatives: ChordPositionCombo[];
  openThreshold: number;
}

function distance(a: BandoneonButton, b: BandoneonButton) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function maxPairwiseDistance(buttons: BandoneonButton[]) {
  let max = 0;
  for (let i = 0; i < buttons.length; i++) {
    for (let j = i + 1; j < buttons.length; j++) {
      max = Math.max(max, distance(buttons[i], buttons[j]));
    }
  }
  return max;
}

// Half the typical nearest-neighbor spacing times a comfort factor: a rough,
// hand-relative proxy for "this chord spans an uncomfortable stretch", not a
// claim about actual playability.
const OPEN_THRESHOLD_FACTOR = 3.2;
const MAX_COMBINATIONS = 500;

function medianNearestNeighborDistance(buttons: BandoneonButton[]) {
  const nearest = buttons.map((button, index) => {
    let min = Infinity;
    for (let j = 0; j < buttons.length; j++) {
      if (j === index) continue;
      min = Math.min(min, distance(button, buttons[j]));
    }
    return min;
  });
  const sorted = [...nearest].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function cartesianAssignments(
  candidatesByTone: Array<{ tone: ChordTone; buttons: BandoneonButton[] }>,
): ChordButtonAssignment[][] {
  let combos: ChordButtonAssignment[][] = [[]];
  for (const { tone, buttons } of candidatesByTone) {
    const next: ChordButtonAssignment[][] = [];
    outer: for (const combo of combos) {
      for (const button of buttons) {
        if (combo.some((assignment) => assignment.button.id === button.id)) continue;
        next.push([...combo, { tone, button }]);
        if (next.length >= MAX_COMBINATIONS) break outer;
      }
    }
    combos = next;
    if (combos.length === 0) break;
  }
  return combos;
}

/**
 * Finds where a chord's tones fall on one hand's keyboard in a given bellows
 * direction, and ranks candidate fingerings by geometric compactness.
 * This is a proximity heuristic for study purposes, not a fingering authority.
 */
export function findChordPositions(chord: ParsedChord, layout: HandLayout, direction: BellowsDirection): ChordPositionResult {
  const openThreshold = medianNearestNeighborDistance(layout.buttons) * OPEN_THRESHOLD_FACTOR;

  const candidatesByTone = chord.tones.map((tone) => ({
    tone,
    buttons: layout.buttons.filter((button) => parseNote(button[direction])?.pitchClass === tone.pitchClass),
  }));

  const missing = candidatesByTone.filter((candidate) => candidate.buttons.length === 0).map((candidate) => candidate.tone);
  if (missing.length > 0) {
    return { status: "incomplete", missing, suggested: null, alternatives: [], openThreshold };
  }

  const combos = cartesianAssignments(candidatesByTone)
    .map((assignments) => ({ assignments, spanScore: maxPairwiseDistance(assignments.map((a) => a.button)) }))
    .sort((a, b) => a.spanScore - b.spanScore);

  const suggested = combos[0] ?? null;
  const alternatives = combos.slice(1, 6);
  const status: ChordPositionStatus = suggested && suggested.spanScore > openThreshold ? "complete-open" : "complete";

  return { status, missing: [], suggested, alternatives, openThreshold };
}
