import type { Strings } from "../i18n/strings";
import { degreeClass } from "../music/degreeClass";
import { formatNoteName, type NotationMode } from "../music/notationFormat";
import { parseNote } from "../music/notes";
import type { PieceVoicing, ResolvedPieceNote } from "../music/pieceVoicings";

interface Props {
  voicing: PieceVoicing;
  notes: ResolvedPieceNote[];
  ghost: ResolvedPieceNote | null;
  direction: "opening" | "closing";
  notationMode: NotationMode;
  t: Strings;
}

export function PieceVoicingPanel({ voicing, notes, ghost, direction, notationMode, t }: Props) {
  const ghostParsed = ghost ? parseNote(ghost.pitch) : null;
  return (
    <div className="chord-position-card apostila-card">
      <div className="cpc-head">
        <span className="cpc-hand">{t.pieceVoicingLabel(voicing.source.piece, voicing.source.page)}</span>
        <span className="cpc-status cpc-status-complete">
          {t.handLeftLower} · {direction === "opening" ? t.openingLower : t.closingLower}
        </span>
      </div>
      <div className="cpc-combo">
        {notes.map((note) => {
          const parsed = parseNote(note.pitch);
          return (
          <span key={note.buttonId} className={`cpc-chip ${degreeClass[note.degree] ?? ""}`}>
            <b>{parsed ? formatNoteName(parsed, notationMode) : note.pitch}</b>
            <small>{note.buttonId}</small>
          </span>
          );
        })}
        {ghost && (
          <span className="cpc-chip cpc-chip-ghost">
            <b>{ghostParsed ? formatNoteName(ghostParsed, notationMode) : ghost.pitch}</b>
            <small>{ghost.buttonId} · 5</small>
          </span>
        )}
      </div>
    </div>
  );
}
