import { useEffect, useState } from "react";
import type { BellowsDirection } from "../data/bandoneonLayout";
import type { Strings } from "../i18n/strings";
import type { ChordPositionCombo, ChordPositionResult } from "../music/chordPositions";
import { formatToneName, type NotationMode } from "../music/notationFormat";

interface Props {
  handLabel: string;
  result: ChordPositionResult;
  direction: BellowsDirection;
  otherDirectionHasComplete: boolean;
  notationMode: NotationMode;
  t: Strings;
  onComboChange: (combo: ChordPositionCombo | null) => void;
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

function comboAt(result: ChordPositionResult, index: number): ChordPositionCombo | null {
  if (!result.suggested) return null;
  if (index === 0) return result.suggested;
  return result.alternatives[index - 1] ?? result.suggested;
}

export function ChordPositionPanel({ handLabel, result, direction, otherDirectionHasComplete, notationMode, t, onComboChange }: Props) {
  const [comboIndex, setComboIndex] = useState(0);
  const [showAlternatives, setShowAlternatives] = useState(false);

  useEffect(() => {
    setComboIndex(0);
    setShowAlternatives(false);
  }, [result]);

  useEffect(() => {
    onComboChange(comboAt(result, comboIndex));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, comboIndex]);

  const active = comboAt(result, comboIndex);
  const statusClass = result.status === "complete-open" ? "open" : result.status;
  const statusLabel =
    result.status === "complete" ? t.statusComplete : result.status === "complete-open" ? t.statusOpen : t.statusIncomplete;

  return (
    <div className="chord-position-card">
      <div className="cpc-head">
        <span className="cpc-hand">{handLabel}</span>
        <span className={`cpc-status cpc-status-${statusClass}`}>{statusLabel}</span>
      </div>

      {result.status === "incomplete" ? (
        <div className="cpc-missing">
          <span>{t.missing(result.missing.map((tone) => formatToneName(tone, notationMode)).join(", "))}</span>
          {otherDirectionHasComplete && (
            <div className="cpc-hint">{t.hintOtherDirection(direction === "opening" ? t.closingLower : t.openingLower)}</div>
          )}
        </div>
      ) : active ? (
        <>
          <div className="cpc-suggestion-label">
            {t.suggestedPosition} <em>{t.suggestedDisclaimer}</em>
          </div>
          <div className="cpc-combo">
            {active.assignments.map((assignment) => (
              <span
                key={assignment.button.id}
                className={`cpc-chip degree-${assignment.tone.degree.replaceAll("♭", "flat")} ${degreeClass[assignment.tone.degree] ?? ""}`}
              >
                <b>{formatToneName(assignment.tone, notationMode)}</b>
                <small>{assignment.button.id}</small>
              </span>
            ))}
          </div>
          {result.alternatives.length > 0 && (
            <div className="cpc-alternatives">
              <button type="button" className="cpc-toggle" onClick={() => setShowAlternatives((v) => !v)}>
                {showAlternatives ? t.hideAlternatives : t.showAlternatives}
              </button>
              {showAlternatives && (
                <div className="cpc-alt-list">
                  <button
                    type="button"
                    className={comboIndex === 0 ? "active" : ""}
                    onClick={() => setComboIndex(0)}
                  >
                    {t.suggestion}
                  </button>
                  {result.alternatives.map((_, index) => (
                    <button
                      type="button"
                      key={index}
                      className={comboIndex === index + 1 ? "active" : ""}
                      onClick={() => setComboIndex(index + 1)}
                    >
                      {t.alternative(index + 1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
