import { describe, expect, it } from "vitest";
import { leftHand, rightHand } from "../data/bandoneonLayout";
import { getButtonDetail } from "./buttonDetail";

function findButton(id: string) {
  return [...leftHand.buttons, ...rightHand.buttons].find((b) => b.id === id)!;
}

describe("getButtonDetail", () => {
  it("reports the current pitch, opening pitch and closing pitch of the same physical button", () => {
    // R06: opening C#4, closing C4 (docs/LAYOUT_REFERENCE.md)
    const button = findButton("R06");
    const opening = getButtonDetail(button, "right", "opening")!;
    expect(opening.current.latin).toBe("Dó♯4");
    expect(opening.opening.latin).toBe("Dó♯4");
    expect(opening.closing.latin).toBe("Dó4");

    const closing = getButtonDetail(button, "right", "closing")!;
    expect(closing.current.latin).toBe("Dó4");
    expect(closing.opening.latin).toBe("Dó♯4");
    expect(closing.closing.latin).toBe("Dó4");
  });

  it("includes the enharmonic equivalent when the current pitch has one", () => {
    const button = findButton("R06");
    const opening = getButtonDetail(button, "right", "opening")!;
    expect(opening.enharmonic?.latin).toBe("Ré♭4");
  });

  it("omits the enharmonic when the current pitch is natural", () => {
    const button = findButton("R06");
    const closing = getButtonDetail(button, "right", "closing")!;
    expect(closing.enharmonic).toBeNull();
  });

  it("opening and closing pitches never depend on the requested direction", () => {
    const button = findButton("L01");
    const fromOpening = getButtonDetail(button, "left", "opening")!;
    const fromClosing = getButtonDetail(button, "left", "closing")!;
    expect(fromOpening.opening.latin).toBe(fromClosing.opening.latin);
    expect(fromOpening.closing.latin).toBe(fromClosing.closing.latin);
  });
});
