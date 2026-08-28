import type { BandoneonButton, BellowsDirection, Hand, HandLayout } from "../data/bandoneonLayout";
import type { NotationMode } from "../music/notationFormat";
import { parseNote, type ParsedNote } from "../music/notes";
import type { Strings } from "../i18n/strings";
import type { HighlightTone } from "../state/MusicSelectionContext";

export type { HighlightTone };

interface Props {
  title: string;
  hand: Hand;
  layout: HandLayout;
  direction: BellowsDirection;
  highlights: HighlightTone[];
  /** When set, only these specific buttons light up (a chosen chord fingering) instead of every button sharing a pitch class. */
  highlightButtonIds?: Map<string, HighlightTone>;
  /** Pedagogically-omitted tone (e.g. a dominant7's 5th): drawn very faint, never as "pressed", never counted as active. */
  ghostButtonIds?: Set<string>;
  exactMidi?: number;
  showLabels: boolean;
  notationMode: NotationMode;
  t: Strings;
  onSelectButton: (button: BandoneonButton, hand: Hand) => void;
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

function nameWithoutOctave(full: string, octave: number | undefined): string {
  if (octave === undefined) return full;
  const suffix = String(octave);
  return full.endsWith(suffix) ? full.slice(0, -suffix.length) : full;
}

function noteLabelParts(note: ParsedNote, mode: NotationMode): { note: string; octave: string } {
  const octave = note.octave !== undefined ? String(note.octave) : "";
  const latinName = nameWithoutOctave(note.latin, note.octave);
  const americanName = nameWithoutOctave(note.american, note.octave);
  const name = mode === "latin" ? latinName : mode === "american" ? americanName : `${latinName}/${americanName}`;
  return { note: name, octave };
}

export function Keyboard({
  title,
  hand,
  layout,
  direction,
  highlights,
  highlightButtonIds,
  ghostButtonIds,
  exactMidi,
  showLabels,
  notationMode,
  t,
  onSelectButton,
}: Props) {
  const gradientId = `key-grad-${hand}`;
  const shadowId = `key-shadow-${hand}`;
  const directionLabel = direction === "opening" ? t.openingLower : t.closingLower;

  return (
    <section className="keyboard-panel">
      <div className="keyboard-panel-header">
        <div>
          <div className="panel-label">{title}</div>
          <div className="panel-meta">{t.buttonsCount(layout.buttons.length)}</div>
        </div>
        <div className="panel-direction">
          {direction === "opening" ? `← ${t.opening.toUpperCase()}` : `${t.closing.toUpperCase()} →`}
        </div>
      </div>
      <div className="keyboard-face">
        <svg
          className="keyboard-svg"
          viewBox={`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`}
          role="img"
          aria-label={`${title}, ${directionLabel}`}
        >
          <defs>
            <radialGradient id={gradientId} cx="36%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#454550" />
              <stop offset="65%" stopColor="#302f38" />
              <stop offset="100%" stopColor="#222129" />
            </radialGradient>
            <filter id={shadowId} x="-30%" y="-30%" width="160%" height="170%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.5" />
            </filter>
          </defs>
          {layout.buttons.map((button) => {
            const pitch = button[direction];
            const parsed = parseNote(pitch);
            const isGhost = ghostButtonIds?.has(button.id) ?? false;
            const explicitTone = highlightButtonIds?.get(button.id);
            const tone = explicitTone ?? (parsed ? highlights.find((item) => item.pitchClass === parsed.pitchClass) : undefined);
            const exact = parsed?.midi !== undefined && exactMidi !== undefined && parsed.midi === exactMidi;
            const active = !isGhost && (highlightButtonIds ? Boolean(explicitTone) : exactMidi !== undefined ? exact : Boolean(tone));
            const cls = active ? degreeClass[tone?.degree ?? ""] ?? "tone-note" : "";
            const label = parsed ? noteLabelParts(parsed, notationMode) : { note: pitch, octave: "" };
            return (
              <g
                key={button.id}
                className={`key-button ${active ? "active" : ""} ${isGhost ? "ghost" : ""} ${cls}`}
                role="button"
                tabIndex={0}
                aria-label={`${button.id}: ${parsed ? (notationMode === "american" ? parsed.american : parsed.latin) : pitch}`}
                onClick={() => onSelectButton(button, hand)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") onSelectButton(button, hand);
                }}
              >
                <circle className="key-shadow" cx={button.x} cy={button.y + 2} r="37" />
                <circle className="key-disc" cx={button.x} cy={button.y} r="37" fill={`url(#${gradientId})`} filter={`url(#${shadowId})`} />
                {(showLabels || active || isGhost) && (
                  <text className={`key-note ${label.note.length > 3 ? "compact" : ""}`} x={button.x} y={button.y + 4} textAnchor="middle">
                    {label.note}
                  </text>
                )}
                {(showLabels || active || isGhost) && label.octave && (
                  <text className="key-octave" x={button.x + 25} y={button.y - 18} textAnchor="middle">
                    {label.octave}
                  </text>
                )}
                {active && tone?.degree && (
                  <text className="degree" x={button.x} y={button.y + 24} textAnchor="middle">
                    {tone.degree}
                  </text>
                )}
                {isGhost && (
                  <text className="degree ghost-degree" x={button.x} y={button.y + 24} textAnchor="middle">
                    5
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
