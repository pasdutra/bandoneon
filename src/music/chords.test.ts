import { describe, expect, it } from "vitest";
import { parseChord } from "./chords";

function tonesOf(input: string) {
  const chord = parseChord(input);
  expect(chord).not.toBeNull();
  return chord!.tones.map((tone) => tone.latin);
}

describe("chord formation — required acceptance cases", () => {
  it("Solm resolves to Sol, Si♭, Ré", () => {
    expect(tonesOf("Solm")).toEqual(["Sol", "Si♭", "Ré"]);
  });

  it("Fá♯m resolves to Fá♯, Lá, Dó♯", () => {
    expect(tonesOf("Fá♯m")).toEqual(["Fá♯", "Lá", "Dó♯"]);
  });

  it("Si♭7 resolves to Si♭, Ré, Fá, Lá♭", () => {
    expect(tonesOf("Si♭7")).toEqual(["Si♭", "Ré", "Fá", "Lá♭"]);
  });

  it("Mi♭maj7 resolves to Mi♭, Sol, Si♭, Ré", () => {
    expect(tonesOf("Mi♭maj7")).toEqual(["Mi♭", "Sol", "Si♭", "Ré"]);
  });

  it("Dó♯7 resolves to Dó♯, Mi♯, Sol♯, Si (not Fá)", () => {
    const tones = tonesOf("Dó♯7");
    expect(tones).toEqual(["Dó♯", "Mi♯", "Sol♯", "Si"]);
    expect(tones).not.toContain("Fá");
  });

  it("Lá♭7 resolves to Lá♭, Dó, Mi♭, Sol♭", () => {
    expect(tonesOf("Lá♭7")).toEqual(["Lá♭", "Dó", "Mi♭", "Sol♭"]);
  });

  it("Sim7♭5 resolves to Si, Ré, Fá, Lá", () => {
    expect(tonesOf("Sim7♭5")).toEqual(["Si", "Ré", "Fá", "Lá"]);
  });
});

describe("chord formation — basic qualities", () => {
  it("Dó major is Dó, Mi, Sol", () => {
    expect(tonesOf("Dó")).toEqual(["Dó", "Mi", "Sol"]);
  });

  it("Dóm (minor) is Dó, Mi♭, Sol", () => {
    expect(tonesOf("Dóm")).toEqual(["Dó", "Mi♭", "Sol"]);
  });

  it("Dó7 (dominant) is Dó, Mi, Sol, Si♭", () => {
    expect(tonesOf("Dó7")).toEqual(["Dó", "Mi", "Sol", "Si♭"]);
  });

  it("Dóm7 is Dó, Mi♭, Sol, Si♭", () => {
    expect(tonesOf("Dóm7")).toEqual(["Dó", "Mi♭", "Sol", "Si♭"]);
  });

  it("Dómaj7 is Dó, Mi, Sol, Si", () => {
    expect(tonesOf("Dómaj7")).toEqual(["Dó", "Mi", "Sol", "Si"]);
  });

  it("Dódim is Dó, Mi♭, Sol♭", () => {
    expect(tonesOf("Dódim")).toEqual(["Dó", "Mi♭", "Sol♭"]);
  });
});

describe("chord parser — input flexibility", () => {
  it("accepts Anglo-American root names", () => {
    expect(tonesOf("Gm")).toEqual(tonesOf("Solm"));
    expect(tonesOf("C#7")).toEqual(tonesOf("Dó♯7"));
  });

  it("rejects unrecognized quality text", () => {
    expect(parseChord("Sol9")).toBeNull();
  });

  it("rejects empty input", () => {
    expect(parseChord("")).toBeNull();
  });
});
