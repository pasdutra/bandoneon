import { formatNoteName, type NotationMode } from "../music/notationFormat";
import { parseNote, pitchToLatin, type ParsedNote } from "../music/notes";
import { useMusicSelection, type HighlightTone } from "../state/MusicSelectionContext";

type Clef = "treble" | "bass";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const NATURAL_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function diatonicIndex(letter: string, octave: number) {
  return octave * 7 + LETTERS.indexOf(letter as (typeof LETTERS)[number]);
}

function naturalRange(startOctave: number, startLetter: string, endOctave: number, endLetter: string) {
  const start = diatonicIndex(startLetter, startOctave);
  const end = diatonicIndex(endLetter, endOctave);
  const notes: string[] = [];
  for (let i = start; i <= end; i++) {
    const octave = Math.floor(i / 7);
    const letter = LETTERS[((i % 7) + 7) % 7];
    notes.push(`${letter}${octave}`);
  }
  return notes;
}

function midiOfNatural(pitch: string) {
  const match = pitch.match(/^([A-G])(\d+)$/)!;
  return 12 * (Number(match[2]) + 1) + NATURAL_PC[match[1]];
}

function pitchClassOfNatural(pitch: string) {
  const match = pitch.match(/^([A-G])(\d+)$/)!;
  return NATURAL_PC[match[1]];
}

function pitchY(pitch: string, clef: Clef) {
  const match = pitch.match(/^([A-G])(\d+)$/)!;
  const idx = diatonicIndex(match[1], Number(match[2]));
  const bottom = clef === "treble" ? diatonicIndex("E", 4) : diatonicIndex("G", 2);
  return 82 - (idx - bottom) * 6;
}

function ledgerYs(y: number) {
  const ys: number[] = [];
  if (y < 34) {
    for (let lineY = 22; lineY >= y - 1; lineY -= 12) ys.push(lineY);
  }
  if (y > 82) {
    for (let lineY = 94; lineY <= y + 1; lineY += 12) ys.push(lineY);
  }
  return ys;
}

const degreeClass: Record<string, string> = {
  "1": "tone-root",
  "3": "tone-third",
  "♭3": "tone-third",
  "5": "tone-fifth",
  "♭5": "tone-fifth",
  "7": "tone-seventh",
  "♭7": "tone-seventh",
};

export interface StaffChordVoicingNote {
  displayPitch: string;
  degree: string;
}

export interface StaffChordGhostNote {
  displayPitch: string;
}

/**
 * When a documented chord voicing is active, only its exact (pitch class +
 * octave) notes light up — never every octave of a matching pitch class.
 * That specific-notes list is the same one already used to light up the
 * left-hand keyboard (sourceVoicing), so the staff and the keyboard always
 * agree on exactly which notes belong to the chord. Accidental tones (e.g.
 * Si♭) never match a natural pitch class here — they're rendered separately
 * as synthetic in-between notes, see `accidentalNotesOf` below.
 */
function matchedTone(
  pitch: string,
  highlights: HighlightTone[],
  exactMidi?: number,
  chordVoicing?: StaffChordVoicingNote[],
): HighlightTone | undefined {
  const pitchClass = pitchClassOfNatural(pitch);
  if (chordVoicing) {
    const octave = Number(pitch.match(/^([A-G])(\d+)$/)![2]);
    const found = chordVoicing.find((note) => {
      const parsed = parseNote(note.displayPitch);
      return parsed?.pitchClass === pitchClass && parsed.octave === octave;
    });
    return found ? { pitchClass, degree: found.degree } : undefined;
  }
  if (exactMidi !== undefined) {
    return midiOfNatural(pitch) === exactMidi ? { pitchClass } : undefined;
  }
  return highlights.find((tone) => tone.pitchClass === pitchClass);
}

function isGhostPitch(pitch: string, ghost?: StaffChordGhostNote): boolean {
  if (!ghost) return false;
  const parsed = parseNote(ghost.displayPitch);
  if (!parsed || parsed.accidental !== 0) return false;
  const octave = Number(pitch.match(/^([A-G])(\d+)$/)![2]);
  return parsed.pitchClass === pitchClassOfNatural(pitch) && parsed.octave === octave;
}

interface AccidentalNote {
  key: string;
  x: number;
  y: number;
  degree: string;
  ghost: boolean;
  parsed: ParsedNote;
}

/**
 * A chord tone with an accidental (Si♭, Fá♯...) has no natural staff line of
 * its own. Rather than silently drop it, this app draws it as a temporary
 * note positioned between the two natural neighbors it falls between (e.g.
 * Si♭ between Lá and Si) — not standard notation, but it means every
 * documented chord tone is actually visible on the staff.
 */
function accidentalNotesOf(
  notes: string[],
  noteYs: number[],
  chordVoicing: StaffChordVoicingNote[] | undefined,
  chordGhost: StaffChordGhostNote | undefined,
): AccidentalNote[] {
  const entries: Array<{ displayPitch: string; degree: string; ghost: boolean }> = [
    ...(chordVoicing ?? []).map((note) => ({ displayPitch: note.displayPitch, degree: note.degree, ghost: false })),
    ...(chordGhost ? [{ displayPitch: chordGhost.displayPitch, degree: "5", ghost: true }] : []),
  ];

  const xAt = (index: number) => 80 + index * 38;
  const indexOfNatural = (letter: string, octave: number) => notes.indexOf(`${letter}${octave}`);

  const result: AccidentalNote[] = [];
  for (const entry of entries) {
    const parsed = parseNote(entry.displayPitch);
    if (!parsed || (parsed.accidental !== 1 && parsed.accidental !== -1) || parsed.octave === undefined) continue;

    const letterIdx = LETTERS.indexOf(parsed.letter);
    let lowerLetter: string, lowerOctave: number, upperLetter: string, upperOctave: number;
    if (parsed.accidental === -1) {
      lowerLetter = LETTERS[(letterIdx - 1 + 7) % 7];
      lowerOctave = parsed.letter === "C" ? parsed.octave - 1 : parsed.octave;
      upperLetter = parsed.letter;
      upperOctave = parsed.octave;
    } else {
      lowerLetter = parsed.letter;
      lowerOctave = parsed.octave;
      upperLetter = LETTERS[(letterIdx + 1) % 7];
      upperOctave = parsed.letter === "B" ? parsed.octave + 1 : parsed.octave;
    }

    const lowerIndex = indexOfNatural(lowerLetter, lowerOctave);
    const upperIndex = indexOfNatural(upperLetter, upperOctave);
    if (lowerIndex === -1 || upperIndex === -1) continue;

    result.push({
      key: `${entry.displayPitch}-${entry.ghost ? "ghost" : "voicing"}`,
      x: (xAt(lowerIndex) + xAt(upperIndex)) / 2,
      y: (noteYs[lowerIndex] + noteYs[upperIndex]) / 2,
      degree: entry.degree,
      ghost: entry.ghost,
      parsed,
    });
  }
  return result;
}

function StaffLine({
  clef,
  clefLabel,
  notes,
  highlights,
  exactMidi,
  chordVoicing,
  chordGhost,
  notationMode,
  onSelectPitch,
}: {
  clef: Clef;
  clefLabel: string;
  notes: string[];
  highlights: HighlightTone[];
  exactMidi?: number;
  chordVoicing?: StaffChordVoicingNote[];
  chordGhost?: StaffChordGhostNote;
  notationMode: NotationMode;
  onSelectPitch: (pitch: string) => void;
}) {
  const width = Math.max(760, notes.length * 38 + 100);
  const noteYs = notes.map((pitch) => pitchY(pitch, clef));
  // The staff lines (34–82) must always be visible even if every note sits
  // right on them; the note range can push well beyond that for a hand
  // whose written range spans several ledger lines (e.g. treble up to B6).
  const topBound = Math.min(34, ...noteYs) - 26;
  const bottomBound = Math.max(82, ...noteYs) + 34;
  const height = bottomBound - topBound;

  return (
    <div className="staff-scroll">
      <svg
        className="staff-svg"
        viewBox={`0 ${topBound} ${width} ${height}`}
        style={{ width: `${width}px`, height: `${height}px` }}
        role="img"
        aria-label={clefLabel}
      >
        {[0, 1, 2, 3, 4].map((line) => (
          <line key={line} x1="66" x2={width - 24} y1={34 + line * 12} y2={34 + line * 12} className="staff-line" />
        ))}
        <text x="8" y="80" className="clef-symbol">{clef === "treble" ? "𝄞" : "𝄢"}</text>
        {notes.map((pitch, index) => {
          const x = 80 + index * 38;
          const y = noteYs[index];
          const tone = matchedTone(pitch, highlights, exactMidi, chordVoicing);
          const active = Boolean(tone);
          const ghost = !active && isGhostPitch(pitch, chordGhost);
          const cls = active ? degreeClass[tone?.degree ?? ""] ?? "" : "";
          const parsed = parseNote(pitch)!;
          return (
            <g
              key={pitch}
              className={`staff-note ${active ? "active" : ""} ${ghost ? "ghost" : ""} ${cls}`}
              role="button"
              tabIndex={0}
              aria-label={pitchToLatin(pitch)}
              onClick={() => onSelectPitch(pitch)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelectPitch(pitch); }}
            >
              {ledgerYs(y).map((ledgerY) => (
                <line key={ledgerY} x1={x - 12} x2={x + 12} y1={ledgerY} y2={ledgerY} className="ledger" />
              ))}
              <g transform={`rotate(-18 ${x} ${y})`}>
                <ellipse cx={x} cy={y} rx="8" ry="6.2" />
              </g>
              <text className="staff-note-label" x={x} y={y + 22} textAnchor="middle">{formatNoteName(parsed, notationMode)}</text>
            </g>
          );
        })}
        {accidentalNotesOf(notes, noteYs, chordVoicing, chordGhost).map((note) => (
          <g
            key={note.key}
            className={`staff-note accidental ${note.ghost ? "ghost" : "active"} ${note.ghost ? "" : degreeClass[note.degree] ?? ""}`}
            role="button"
            tabIndex={0}
            aria-label={note.parsed.latin}
            onClick={() => onSelectPitch(note.parsed.scientific)}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelectPitch(note.parsed.scientific); }}
          >
            {ledgerYs(note.y).map((ledgerY) => (
              <line key={ledgerY} x1={note.x - 12} x2={note.x + 12} y1={ledgerY} y2={ledgerY} className="ledger" />
            ))}
            <g transform={`rotate(-18 ${note.x} ${note.y})`}>
              <ellipse cx={note.x} cy={note.y} rx="8" ry="6.2" />
            </g>
            <text className="staff-note-label" x={note.x} y={note.y + 22} textAnchor="middle">
              {formatNoteName(note.parsed, notationMode)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function Staff({
  chordVoicing,
  chordGhost,
}: {
  chordVoicing?: StaffChordVoicingNote[];
  chordGhost?: StaffChordGhostNote;
}) {
  const { highlights, exactMidi, notationMode, t, searchNote } = useMusicSelection();
  // Each clef covers that hand's full compass on the instrument (right: A3–B6,
  // left: C2–A4), so every existing note is visible on at least one staff —
  // they deliberately overlap in the middle register rather than handing off
  // cleanly at middle C.
  const treble = naturalRange(3, "A", 6, "B");
  const bass = naturalRange(2, "C", 4, "A");

  function selectStaffPitch(pitch: string) {
    searchNote(pitchToLatin(pitch));
  }

  // Every documented chord voicing is a left-hand, bellows-opening position
  // that reads on the bass clef — coloring it on the treble clef too would
  // just be the pitch class repeating in a register that has nothing to do
  // with the chord, so a chord only ever paints the bass ("clave de fá") staff.
  const hasChordVoicing = Boolean(chordVoicing);

  return (
    <section className="staff-panel">
      <div className="section-heading staff-heading">
        <div>
          <span>{t.staffHeading}</span>
          <small>{t.staffSubtitle}</small>
        </div>
        <div className="section-rule" />
      </div>

      <div className="score-sheet">
        <div className="score-watermark">{t.staffWatermark}</div>
        <div className="staff-group">
          <div className="staff-title"><span>𝄞</span> {t.trebleClef}</div>
          <StaffLine
            clef="treble"
            clefLabel={t.trebleClef}
            notes={treble}
            highlights={hasChordVoicing ? [] : highlights}
            exactMidi={exactMidi}
            notationMode={notationMode}
            onSelectPitch={selectStaffPitch}
          />
        </div>
        <div className="score-divider" />
        <div className="staff-group">
          <div className="staff-title"><span>𝄢</span> {t.bassClef}</div>
          <StaffLine
            clef="bass"
            clefLabel={t.bassClef}
            notes={bass}
            highlights={highlights}
            exactMidi={exactMidi}
            chordVoicing={chordVoicing}
            chordGhost={chordGhost}
            notationMode={notationMode}
            onSelectPitch={selectStaffPitch}
          />
        </div>
        <div className="score-footnote">{t.staffFootnote}</div>
      </div>
    </section>
  );
}
