import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import {
  AccidentalEnum,
  NoteEnum,
  OpenSheetMusicDisplay,
  Pitch,
  PointF2D,
  type GraphicalMusicSheet,
  type GraphicalNote,
} from "opensheetmusicdisplay";
import type { Strings } from "../i18n/strings";
import { useMusicSelection } from "../state/MusicSelectionContext";

// How close (in OSMD's internal "units", 10px each at zoom 1) a click needs to
// land to a notehead to count as hitting it. Generous enough for a mouse
// click on a small notehead, tight enough not to grab the neighboring note.
const CLICK_TOLERANCE_UNITS = 1.6;

// Same amber used for an active note on the keyboard/interactive staff
// (var(--accent) in app.css), so a clicked note reads as "selected" the same
// way everywhere. Notes render in plain black by default (VexFlow's default).
const SELECTED_NOTE_COLOR = "#f2b134";
const DEFAULT_NOTE_COLOR = "#000000";

const ACCIDENTAL_SUFFIX: Partial<Record<AccidentalEnum, string>> = {
  [AccidentalEnum.DOUBLESHARP]: "##",
  [AccidentalEnum.SHARP]: "#",
  [AccidentalEnum.NONE]: "",
  [AccidentalEnum.NATURAL]: "",
  [AccidentalEnum.FLAT]: "b",
  [AccidentalEnum.DOUBLEFLAT]: "bb",
};

/** Builds a scientific-pitch query string (e.g. "F#4", "Bb3") that `parseNote`/`searchNote`
 *  already understand, straight from an OSMD note's untransposed MusicXML pitch. OSMD's
 *  Pitch.Octave is not the MusicXML/scientific-pitch octave, it's offset from it by
 *  Pitch.OctaveXmlDifference, which this corrects for. */
function pitchQuery(pitch: Pitch): string | null {
  const letter = NoteEnum[pitch.FundamentalNote];
  const suffix = ACCIDENTAL_SUFFIX[pitch.Accidental];
  if (!letter || suffix === undefined) return null;
  return `${letter}${suffix}${pitch.Octave + Pitch.OctaveXmlDifference}`;
}

/**
 * OSMD's own GraphicalMusicSheet.GetNearestNote() (backed by a private,
 * unexposed search-box helper) turned out unreliable for closely spaced
 * notes in testing — clicking directly on a notehead's own position would
 * sometimes resolve to a different, non-adjacent note. Walking MeasureList
 * ourselves and comparing each note's own AbsolutePosition directly against
 * the click point is simple and was verified correct instead.
 */
function nearestNoteAt(graphic: GraphicalMusicSheet, point: PointF2D, toleranceUnits: number): GraphicalNote | null {
  let best: GraphicalNote | null = null;
  let bestDist = Infinity;
  for (const measures of graphic.MeasureList) {
    for (const measure of measures) {
      if (!measure) continue;
      for (const staffEntry of measure.staffEntries) {
        for (const voiceEntry of staffEntry.graphicalVoiceEntries) {
          for (const note of voiceEntry.notes) {
            if (note.sourceNote.isRest()) continue;
            const pos = note.PositionAndShape.AbsolutePosition;
            const dist = Math.hypot(pos.x - point.x, pos.y - point.y);
            if (dist < bestDist) {
              bestDist = dist;
              best = note;
            }
          }
        }
      }
    }
  }
  return bestDist <= toleranceUnits ? best : null;
}

export function MusicScore({ t }: { t: Strings }) {
  const { searchNote } = useMusicSelection();
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const selectedNoteRef = useRef<GraphicalNote | null>(null);
  const [fileName, setFileName] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!containerRef.current) return;
    osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
      backend: "svg",
      autoResize: true,
      drawTitle: true,
    });
    return () => {
      osmdRef.current?.clear();
      osmdRef.current = null;
    };
  }, []);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const osmd = osmdRef.current;
    if (!file || !osmd) return;

    setBusy(true);
    setError("");
    try {
      await osmd.load(file, file.name);
      osmd.render();
      selectedNoteRef.current = null;
      setFileName(file.name);
      setLoaded(true);
    } catch {
      setError(t.musicLoadError);
      setLoaded(false);
    } finally {
      setBusy(false);
    }
  }

  function handleScoreClick(event: MouseEvent<HTMLDivElement>) {
    const osmd = osmdRef.current;
    if (!osmd || !loaded) return;
    const graphic = osmd.GraphicSheet;

    let osmdPoint: PointF2D;
    try {
      osmdPoint = graphic.svgToOsmd(graphic.domToSvg(new PointF2D(event.clientX, event.clientY)));
    } catch {
      return;
    }

    const note = nearestNoteAt(graphic, osmdPoint, CLICK_TOLERANCE_UNITS);
    if (!note) return;

    if (selectedNoteRef.current && selectedNoteRef.current !== note) {
      selectedNoteRef.current.setColor(DEFAULT_NOTE_COLOR, {});
    }
    note.setColor(SELECTED_NOTE_COLOR, {});
    selectedNoteRef.current = note;

    const query = pitchQuery(note.sourceNote.Pitch);
    if (query) searchNote(query);
  }

  return (
    <section className="music-panel">
      <div className="section-heading">
        <div>
          <span>{t.musicHeading}</span>
          <small>{t.musicSubtitle}</small>
        </div>
        <div className="section-rule" />
      </div>

      <div className="music-toolbar">
        <label className={`music-file-btn ${busy ? "disabled" : ""}`}>
          {busy ? t.musicLoading : t.musicLoadLabel}
          <input type="file" accept=".xml,.musicxml,.mxl" onChange={handleFile} disabled={busy} />
        </label>
        {fileName && <span className="music-filename">{fileName}</span>}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="music-sheet">
        {!loaded && <div className="music-empty-state">{t.musicEmptyState}</div>}
        <div ref={containerRef} className="music-osmd-container" onClick={handleScoreClick} />
      </div>
    </section>
  );
}
