import type { BandoneonButton, BellowsDirection, Hand } from "../data/bandoneonLayout";
import { enharmonicOf, parseNote, type ParsedNote } from "./notes";

export interface ButtonDetail {
  buttonId: string;
  hand: Hand;
  direction: BellowsDirection;
  current: ParsedNote;
  enharmonic: ParsedNote | null;
  opening: ParsedNote;
  closing: ParsedNote;
}

export function getButtonDetail(button: BandoneonButton, hand: Hand, direction: BellowsDirection): ButtonDetail | null {
  const current = parseNote(button[direction]);
  const opening = parseNote(button.opening);
  const closing = parseNote(button.closing);
  if (!current || !opening || !closing) return null;

  return {
    buttonId: button.id,
    hand,
    direction,
    current,
    enharmonic: enharmonicOf(current),
    opening,
    closing,
  };
}
