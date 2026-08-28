export type Hand = "left" | "right";
export type BellowsDirection = "opening" | "closing";

export interface BandoneonButton {
  id: string;
  x: number;
  y: number;
  opening: string;
  closing: string;
}

export interface HandLayout {
  viewBox: { width: number; height: number };
  buttons: BandoneonButton[];
}

export const rightHand: HandLayout = {
  viewBox: { width: 1185, height: 626 },
  buttons: [
    { id: "R01", x: 60, y: 456, opening: "A3", closing: "A3" },
    { id: "R02", x: 118, y: 355, opening: "B3", closing: "B3" },
    { id: "R03", x: 136, y: 542, opening: "A#3", closing: "A#3" },
    { id: "R04", x: 194, y: 246, opening: "C4", closing: "D4" },
    { id: "R05", x: 201, y: 427, opening: "F4", closing: "F4" },
    { id: "R06", x: 260, y: 157, opening: "C#4", closing: "C4" },
    { id: "R07", x: 264, y: 326, opening: "E4", closing: "F#4" },
    { id: "R08", x: 276, y: 509, opening: "D#4", closing: "D#4" },
    { id: "R09", x: 332, y: 66, opening: "B6", closing: "A6" },
    { id: "R10", x: 336, y: 228, opening: "D4", closing: "C#4" },
    { id: "R11", x: 341, y: 409, opening: "A#4", closing: "E4" },
    { id: "R12", x: 410, y: 144, opening: "A6", closing: "G6" },
    { id: "R13", x: 419, y: 487, opening: "F5", closing: "F5" },
    { id: "R14", x: 422, y: 313, opening: "C#5", closing: "F#5" },
    { id: "R15", x: 488, y: 397, opening: "G#4", closing: "A4" },
    { id: "R16", x: 491, y: 214, opening: "G4", closing: "G#4" },
    { id: "R17", x: 497, y: 62, opening: "G#6", closing: "G#6" },
    { id: "R18", x: 560, y: 478, opening: "D#5", closing: "E5" },
    { id: "R19", x: 572, y: 304, opening: "F#4", closing: "G4" },
    { id: "R20", x: 573, y: 144, opening: "F#6", closing: "A#5" },
    { id: "R21", x: 628, y: 392, opening: "B4", closing: "C#5" },
    { id: "R22", x: 658, y: 221, opening: "A#5", closing: "A#4" },
    { id: "R23", x: 680, y: 60, opening: "G6", closing: "F#6" },
    { id: "R24", x: 708, y: 481, opening: "F#5", closing: "G#5" },
    { id: "R25", x: 723, y: 313, opening: "A4", closing: "B4" },
    { id: "R26", x: 760, y: 144, opening: "E6", closing: "C6" },
    { id: "R27", x: 789, y: 398, opening: "D5", closing: "E5" },
    { id: "R28", x: 815, y: 236, opening: "C6", closing: "C5" },
    { id: "R29", x: 850, y: 496, opening: "A5", closing: "F6" },
    { id: "R30", x: 851, y: 73, opening: "F6", closing: "B5" },
    { id: "R31", x: 884, y: 328, opening: "C5", closing: "D5" },
    { id: "R32", x: 903, y: 164, opening: "D#6", closing: "D#6" },
    { id: "R33", x: 933, y: 424, opening: "G#5", closing: "A5" },
    { id: "R34", x: 971, y: 260, opening: "D6", closing: "D6" },
    { id: "R35", x: 992, y: 518, opening: "C#6", closing: "E6" },
    { id: "R36", x: 1026, y: 359, opening: "E5", closing: "G5" },
    { id: "R37", x: 1088, y: 460, opening: "B5", closing: "C#6" },
    { id: "R38", x: 1125, y: 566, opening: "G5", closing: "D#5" },
  ],
};

export const leftHand: HandLayout = {
  viewBox: { width: 1162, height: 598 },
  buttons: [
    { id: "L01", x: 60, y: 538, opening: "D2", closing: "E2" },
    { id: "L02", x: 103, y: 208, opening: "E2", closing: "D2" },
    { id: "L03", x: 112, y: 409, opening: "E3", closing: "A2" },
    { id: "L04", x: 178, y: 301, opening: "D3", closing: "G2" },
    { id: "L05", x: 206, y: 497, opening: "B2", closing: "E3" },
    { id: "L06", x: 240, y: 186, opening: "A2", closing: "D3" },
    { id: "L07", x: 261, y: 380, opening: "G#3", closing: "E3" },
    { id: "L08", x: 308, y: 85, opening: "G#2", closing: "G#2" },
    { id: "L09", x: 324, y: 271, opening: "A3", closing: "G3" },
    { id: "L10", x: 355, y: 468, opening: "G4", closing: "F#4" },
    { id: "L11", x: 392, y: 158, opening: "G3", closing: "A#3" },
    { id: "L12", x: 421, y: 360, opening: "B3", closing: "A3" },
    { id: "L13", x: 459, y: 61, opening: "A#2", closing: "A#2" },
    { id: "L14", x: 488, y: 258, opening: "C4", closing: "B3" },
    { id: "L15", x: 505, y: 438, opening: "A4", closing: "G#4" },
    { id: "L16", x: 556, y: 145, opening: "D#3", closing: "C4" },
    { id: "L17", x: 571, y: 341, opening: "D4", closing: "C#4" },
    { id: "L18", x: 631, y: 60, opening: "C#3", closing: "D#3" },
    { id: "L19", x: 646, y: 238, opening: "E4", closing: "D4" },
    { id: "L20", x: 655, y: 436, opening: "D#4", closing: "B4" },
    { id: "L21", x: 721, y: 140, opening: "F4", closing: "C#3" },
    { id: "L22", x: 726, y: 342, opening: "F#4", closing: "E4" },
    { id: "L23", x: 800, y: 242, opening: "C3", closing: "F4" },
    { id: "L24", x: 811, y: 446, opening: "F#3", closing: "F3" },
    { id: "L25", x: 812, y: 61, opening: "F3", closing: "D#4" },
    { id: "L26", x: 882, y: 353, opening: "C#4", closing: "G#3" },
    { id: "L27", x: 890, y: 160, opening: "A#3", closing: "C3" },
    { id: "L28", x: 955, y: 458, opening: "D#2", closing: "C#2" },
    { id: "L29", x: 961, y: 254, opening: "G2", closing: "F#3" },
    { id: "L30", x: 969, y: 76, opening: "G#4", closing: "G4" },
    { id: "L31", x: 1032, y: 362, opening: "F#2", closing: "B2" },
    { id: "L32", x: 1040, y: 173, opening: "F2", closing: "F#2" },
    { id: "L33", x: 1102, y: 476, opening: "C2", closing: "F2" },
  ],
};

export const bandoneonLayout = {
  id: "aa-71-reference",
  name: "Bandoneon 71-key reference layout",
  source: "User-provided opening/closing diagrams",
  totalButtons: leftHand.buttons.length + rightHand.buttons.length,
  leftHand,
  rightHand,
} as const;
