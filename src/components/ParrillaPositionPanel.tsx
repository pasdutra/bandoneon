import type { Strings } from "../i18n/strings";
import type { ParrillaChord } from "../music/parrillaLibrary";

interface Props {
  parrilla: ParrillaChord;
  t: Strings;
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

export function ParrillaPositionPanel({ parrilla, t }: Props) {
  return (
    <div className="chord-position-card apostila-card">
      <div className="cpc-head">
        <span className="cpc-hand">{t.apostilaPositionLabel}</span>
        <span className="cpc-status cpc-status-complete">{t.handLeftLower} · {t.openingLower}</span>
      </div>

      <div className="cpc-combo">
        {parrilla.sourceVoicing.map((note) => (
          <span key={note.buttonId} className={`cpc-chip degree-${note.degree.replaceAll("♭", "flat")} ${degreeClass[note.degree] ?? ""}`}>
            <b>{note.displayPitch}</b>
            <small>{note.buttonId}</small>
          </span>
        ))}
        {parrilla.derivedGhostFifth && (
          <span className="cpc-chip cpc-chip-ghost">
            <b>{parrilla.derivedGhostFifth.displayPitch}</b>
            <small>{parrilla.derivedGhostFifth.buttonId} · {parrilla.derivedGhostFifth.degree}</small>
          </span>
        )}
      </div>
    </div>
  );
}
