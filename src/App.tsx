import { useEffect, useMemo, useRef, useState } from "react";
import { bandoneonLayout, type BellowsDirection } from "./data/bandoneonLayout";
import { BandoneonMark } from "./components/BandoneonMark";
import { Keyboard } from "./components/Keyboard";
import { Metronome } from "./components/Metronome";
import { ChordPositionPanel } from "./components/ChordPositionPanel";
import { MusicScore } from "./components/MusicScore";
import { ParrillaPositionPanel } from "./components/ParrillaPositionPanel";
import { PieceVoicingPanel } from "./components/PieceVoicingPanel";
import { Segmented } from "./components/Segmented";
import { Staff } from "./components/Staff";
import { UpdateBanner } from "./components/UpdateBanner";
import type { Strings } from "./i18n/strings";
import { findChordPositions, type ChordPositionCombo, type ChordPositionResult } from "./music/chordPositions";
import { parseChord, type ChordQuality } from "./music/chords";
import { degreeClass } from "./music/degreeClass";
import { findPieceVoicing, resolvePieceVoicing, type PieceVoicing, type ResolvedPieceNote } from "./music/pieceVoicings";
import { formatChordName, formatNoteName, formatToneName } from "./music/notationFormat";
import { noteMatchesQuery, parseNote } from "./music/notes";
import {
  findParrillaChord,
  isParrillaPhysicallyActive,
  mapGenericQualityToParrilla,
  omittedDegreesOf,
  type ParrillaChord,
} from "./music/parrillaLibrary";
import { MusicSelectionProvider, useMusicSelection, type HandMode, type HighlightTone } from "./state/MusicSelectionContext";

function allCurrentPitches(direction: BellowsDirection) {
  return [...bandoneonLayout.leftHand.buttons, ...bandoneonLayout.rightHand.buttons].map((button) => button[direction]);
}

function parrillaToHighlightMap(parrilla: ParrillaChord): Map<string, HighlightTone> {
  const map = new Map<string, HighlightTone>();
  for (const note of parrilla.sourceVoicing) {
    map.set(note.buttonId, { pitchClass: parseNote(note.displayPitch)?.pitchClass ?? 0, degree: note.degree });
  }
  return map;
}

function parrillaGhostSet(parrilla: ParrillaChord): Set<string> | undefined {
  return parrilla.derivedGhostFifth ? new Set([parrilla.derivedGhostFifth.buttonId]) : undefined;
}

function pieceToHighlightMap(notes: ResolvedPieceNote[]): Map<string, HighlightTone> {
  const map = new Map<string, HighlightTone>();
  for (const note of notes) {
    map.set(note.buttonId, { pitchClass: parseNote(note.pitch)?.pitchClass ?? 0, degree: note.degree });
  }
  return map;
}

function comboToHighlightMap(combo: ChordPositionCombo | null): Map<string, HighlightTone> {
  const map = new Map<string, HighlightTone>();
  for (const { tone, button } of combo?.assignments ?? []) {
    map.set(button.id, { pitchClass: tone.pitchClass, degree: tone.degree });
  }
  return map;
}

interface HandPositions {
  result: ChordPositionResult;
  otherDirectionHasComplete: boolean;
}

/** A combo the panel reported is only trusted while it still belongs to the current result (chord + direction). */
function validCombo(combo: ChordPositionCombo | null, result: ChordPositionResult | undefined): ChordPositionCombo | null {
  if (!combo || !result) return null;
  return combo === result.suggested || result.alternatives.includes(combo) ? combo : null;
}

function MetronomeLauncher({ t }: { t: ReturnType<typeof useMusicSelection>["t"] }) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div className="metronome-launcher" ref={containerRef}>
      <button
        type="button"
        className={`metronome-launcher-btn ${playing ? "playing" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="metronome-dot" aria-hidden="true" />
        {t.metronomeHeading}
      </button>
      <div className={`metronome-popover ${open ? "open" : ""}`}>
        <div className="metronome-popover-head">
          <span>{t.metronomeHeading}</span>
          <button type="button" className="metronome-popover-close" aria-label={t.closeLabel} onClick={() => setOpen(false)}>×</button>
        </div>
        <Metronome t={t} onPlayingChange={setPlaying} />
      </div>
    </div>
  );
}

const CHORD_ROOTS = ["Dó", "Dó♯", "Ré", "Mi♭", "Mi", "Fá", "Fá♯", "Sol", "Lá♭", "Lá", "Si♭", "Si"];

// suffix is what parseChord reads after the root; label is what the button shows.
const CHORD_TYPES: Array<{ quality: ChordQuality; suffix: string; label: string }> = [
  { quality: "major", suffix: "", label: "" },
  { quality: "minor", suffix: "m", label: "m" },
  { quality: "7", suffix: "7", label: "7" },
  { quality: "m7", suffix: "m7", label: "m7" },
  { quality: "maj7", suffix: "maj7", label: "maj7" },
  { quality: "6", suffix: "6", label: "6" },
  { quality: "m6", suffix: "m6", label: "m6" },
  { quality: "9", suffix: "9", label: "9" },
  { quality: "dim", suffix: "dim", label: "dim" },
  { quality: "dim7", suffix: "dim7", label: "dim7" },
  { quality: "m7b5", suffix: "m7b5", label: "m7♭5" },
  { quality: "aug", suffix: "aug", label: "aug" },
  { quality: "sus2", suffix: "sus2", label: "sus2" },
  { quality: "sus4", suffix: "sus4", label: "sus4" },
];

function SearchPanel({ t }: { t: Strings }) {
  const {
    noteQuery,
    setNoteQuery,
    chordQuery,
    setChordQuery,
    chord,
    favorites,
    removeFavorite,
    searchNote,
    searchChord,
    chooseFavorite,
  } = useMusicSelection();

  // Tom + tipo picked by tapping; they follow whatever chord is active so a
  // typed query or a favorite is reflected in the buttons too.
  const [pickedRoot, setPickedRoot] = useState<string | null>(null);
  const [pickedQuality, setPickedQuality] = useState<ChordQuality>("major");
  const activeRoot = chord ? chord.rootLatin : pickedRoot;
  const activeQuality = chord ? chord.quality : pickedQuality;

  function pickChord(root: string, quality: ChordQuality) {
    const suffix = CHORD_TYPES.find((type) => type.quality === quality)?.suffix ?? "";
    setPickedRoot(root);
    setPickedQuality(quality);
    searchChord(`${root}${suffix}`);
    // On a narrow screen the keyboards sit below this panel: bring them into
    // view so the chord that just lit up is actually seen.
    window.setTimeout(() => {
      const stage = document.querySelector(".stage-card");
      if (stage && stage.getBoundingClientRect().top > window.innerHeight * 0.6) {
        stage.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  }

  return (
    <section className="picker" aria-label={t.searchDrawerLabel}>
      <form className="field" onSubmit={(event) => { event.preventDefault(); searchNote(); }}>
        <label className="field-label" htmlFor="note-query">{t.selectionNote}</label>
        <div className="field-box">
          <input
            id="note-query"
            value={noteQuery}
            onChange={(event) => setNoteQuery(event.target.value)}
            placeholder={t.notePlaceholder}
            autoComplete="off"
          />
          <button className="field-go" type="submit" aria-label={`${t.show}: ${t.noteSearchLabel}`}>→</button>
        </div>
      </form>

      <form className="field" onSubmit={(event) => { event.preventDefault(); searchChord(); }}>
        <label className="field-label" htmlFor="chord-query">{t.selectionChord}</label>
        <div className="field-box">
          <input
            id="chord-query"
            value={chordQuery}
            onChange={(event) => setChordQuery(event.target.value)}
            placeholder={t.chordPlaceholder}
            autoComplete="off"
          />
          <button className="field-go" type="submit" aria-label={`${t.show}: ${t.chordSearchLabel}`}>→</button>
        </div>
      </form>

      <div className="picker-chips">
        <div className="chord-builder">
          <span className="chip-caption" aria-hidden="true">{t.rootShort}</span>
          <div className="chip-group" role="group" aria-label={t.chordRootLabel}>
            {CHORD_ROOTS.map((root) => (
              <button
                key={root}
                type="button"
                className={`chip-btn ${activeRoot === root ? "active" : ""}`}
                aria-pressed={activeRoot === root}
                onClick={() => pickChord(root, activeQuality)}
              >
                {root}
              </button>
            ))}
          </div>
          <span className="chip-caption" aria-hidden="true">{t.typeShort}</span>
          <div className="chip-group" role="group" aria-label={t.chordTypeLabel}>
            {CHORD_TYPES.map((type) => (
              <button
                key={type.quality}
                type="button"
                className={`chip-btn ${activeQuality === type.quality && activeRoot ? "active" : ""}`}
                aria-pressed={activeQuality === type.quality && Boolean(activeRoot)}
                onClick={() => pickChord(activeRoot ?? CHORD_ROOTS[0], type.quality)}
              >
                {type.label || t.chordMajorLabel}
              </button>
            ))}
          </div>
        </div>

        {favorites.length > 0 && (
          <div className="chord-builder">
          <span className="chip-caption" aria-hidden="true">{t.favoritesShort}</span>
          <div className="favorite-row">
            {favorites.map((favorite) => (
              <span
                key={favorite}
                className={`favorite-chip ${chord?.displayName === parseChord(favorite)?.displayName ? "active" : ""}`}
              >
                <button type="button" className="favorite-chip-main" onClick={() => chooseFavorite(favorite)}>
                  {favorite}
                </button>
                <button
                  type="button"
                  className="favorite-chip-remove"
                  aria-label={t.removeFavoriteLabel}
                  onClick={() => removeFavorite(favorite)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Where the active chord sits on each visible hand: the book's voicing when there is one, a computed suggestion otherwise. */
function PositionCards({
  t,
  handMode,
  activeParrilla,
  pieceLeft,
  positions,
  onLeftCombo,
  onRightCombo,
}: {
  t: Strings;
  handMode: HandMode;
  activeParrilla: ParrillaChord | null;
  pieceLeft: { voicing: PieceVoicing; notes: ResolvedPieceNote[]; ghost: ResolvedPieceNote | null } | null;
  positions: { left: HandPositions; right: HandPositions } | null;
  onLeftCombo: (combo: ChordPositionCombo | null) => void;
  onRightCombo: (combo: ChordPositionCombo | null) => void;
}) {
  const { notationMode, direction, chord } = useMusicSelection();

  if (!chord || !positions) return null;

  return (
        <div className="chord-positions">
          {handMode !== "right" &&
            (pieceLeft ? (
              <PieceVoicingPanel voicing={pieceLeft.voicing} notes={pieceLeft.notes} ghost={pieceLeft.ghost} direction={direction} notationMode={notationMode} t={t} />
            ) : activeParrilla ? (
              <ParrillaPositionPanel parrilla={activeParrilla} t={t} />
            ) : (
              <ChordPositionPanel
                handLabel={t.handLeft}
                result={positions.left.result}
                direction={direction}
                otherDirectionHasComplete={positions.left.otherDirectionHasComplete}
                notationMode={notationMode}
                t={t}
                onComboChange={onLeftCombo}
              />
            ))}
          {handMode !== "left" && (
            <ChordPositionPanel
              handLabel={t.handRight}
              result={positions.right.result}
              direction={direction}
              otherDirectionHasComplete={positions.right.otherDirectionHasComplete}
              notationMode={notationMode}
              t={t}
              onComboChange={onRightCombo}
            />
          )}
        </div>
  );
}

/** What is selected right now. Always on screen (with a hint when empty) so the instrument below never jumps. */
function SelectionBar({ t, omittedDegrees, resultCount }: { t: Strings; omittedDegrees: Set<string>; resultCount: number | null }) {
  const { notationMode, direction, chord, note, noteError, chordError, buttonDetail, isFavorite, toggleFavorite } = useMusicSelection();
  const error = chordError || noteError;

  return (
    <section className="selection-bar" aria-live="polite">
      {chord ? (
        <>
          <div className="selection-main">
            <span className="selection-kicker">{t.selectionChord}</span>
            <div className="result-title-row">
              <div className="result-title">{formatChordName(chord, notationMode)}</div>
              <button
                type="button"
                className={`favorite-toggle ${isFavorite(chord.displayName) ? "active" : ""}`}
                onClick={() => toggleFavorite(chord.displayName)}
                aria-label={isFavorite(chord.displayName) ? t.removeFavoriteLabel : t.addFavoriteLabel}
                aria-pressed={isFavorite(chord.displayName)}
              >
                {isFavorite(chord.displayName) ? "★" : "☆"}
              </button>
            </div>
          </div>
          <div className="chord-tones" aria-label={t.chordTonesLabel}>
            {chord.tones.map((tone) => (
              <span
                className={`${degreeClass[tone.degree] ?? ""} ${omittedDegrees.has(tone.degree) ? "muted" : ""}`}
                key={`${tone.degree}-${tone.scientific}`}
              >
                <b>{formatToneName(tone, notationMode)}</b>
                <small>{tone.degree}</small>
              </span>
            ))}
          </div>
        </>
      ) : note ? (
        <>
          <div className="selection-main">
            <span className="selection-kicker">{t.selectionNote}</span>
            <div className="result-title">{formatNoteName(note, notationMode)}</div>
          </div>
          <div className="selection-detail">
            <div className="note-detail">
              {note.octave === undefined ? t.allOctaves(resultCount ?? 0) : t.exactNote(resultCount ?? 0)}
            </div>
            {buttonDetail && (
              <dl className="button-detail">
                <div className="bd-row">
                  <dt className="bd-label">{t.buttonDetailLabel}</dt>
                  <dd className="bd-value">{buttonDetail.hand === "left" ? t.handLeft : t.handRight} · {buttonDetail.buttonId}</dd>
                </div>
                <div className="bd-row">
                  <dt className="bd-label">{t.currentNoteLabel(direction === "opening" ? t.openingLower : t.closingLower)}</dt>
                  <dd className="bd-value">{formatNoteName(buttonDetail.current, notationMode)}</dd>
                </div>
                {buttonDetail.enharmonic && (
                  <div className="bd-row">
                    <dt className="bd-label">{t.enharmonicLabel}</dt>
                    <dd className="bd-value">{formatNoteName(buttonDetail.enharmonic, notationMode)}</dd>
                  </div>
                )}
                <div className="bd-row">
                  <dt className="bd-label">{t.opening}</dt>
                  <dd className="bd-value">{formatNoteName(buttonDetail.opening, notationMode)}</dd>
                </div>
                <div className="bd-row">
                  <dt className="bd-label">{t.closing}</dt>
                  <dd className="bd-value">{formatNoteName(buttonDetail.closing, notationMode)}</dd>
                </div>
              </dl>
            )}
          </div>
        </>
      ) : !error ? (
        <p className="selection-empty">{t.noteEmptyState}</p>
      ) : null}
      {error && <div className="error">{error}</div>}
    </section>
  );
}

function AppShell() {
  const selection = useMusicSelection();
  const {
    language,
    setLanguage,
    notationMode,
    setNotationMode,
    t,
    direction,
    setDirection,
    handMode,
    setHandMode,
    showLabels,
    setShowLabels,
    chord,
    note,
    highlights,
    exactMidi,
    selectButton,
  } = selection;

  const resultCount = useMemo(() => {
    if (!note) return null;
    const current = allCurrentPitches(direction);
    return current.filter((pitch) => noteMatchesQuery(pitch, note)).length;
  }, [note, direction]);

  // matchedParrilla: the chord exists in the documented library at all — this
  // drives the written chord theory (which degree is omitted) and never
  // changes with hand or bellows direction. activeParrilla additionally
  // requires the physical position to apply to what's on screen (left hand,
  // bellows opening) — only that one gates showing sourceVoicing as pressed
  // or derivedGhostFifth as a ghost.
  const matchedParrilla = useMemo(() => {
    if (!chord) return null;
    const quality = mapGenericQualityToParrilla(chord.quality);
    if (!quality) return null;
    return findParrillaChord(chord.tones[0].pitchClass, quality) ?? null;
  }, [chord]);

  // Left-hand voicings read from a piece's score (Desde el alma, p. 41): they
  // exist for both bellows directions and win over the parrilla and the
  // computed suggestion for those chords.
  const pieceLeft = useMemo(() => {
    const voicing = findPieceVoicing(chord);
    const resolved = voicing ? resolvePieceVoicing(voicing, bandoneonLayout.leftHand, direction) : null;
    return voicing && resolved ? { voicing, notes: resolved.notes, ghost: resolved.ghost } : null;
  }, [chord, direction]);

  const activeParrilla = !pieceLeft && isParrillaPhysicallyActive(matchedParrilla, "left", direction) ? matchedParrilla : null;

  const omittedDegrees = useMemo(() => omittedDegreesOf(matchedParrilla), [matchedParrilla]);

  // Computed (non-apostila) positions for every visible hand and direction —
  // a proximity suggestion from the generic engine, never presented as the
  // book's fingering. The documented parrilla still wins on the left hand
  // whenever it physically applies (left hand + opening).
  const positions = useMemo(() => {
    if (!chord) return null;
    const other = direction === "opening" ? "closing" : "opening";
    const forHand = (layout: typeof bandoneonLayout.leftHand): HandPositions => ({
      result: findChordPositions(chord, layout, direction),
      otherDirectionHasComplete: findChordPositions(chord, layout, other).status !== "incomplete",
    });
    return { left: forHand(bandoneonLayout.leftHand), right: forHand(bandoneonLayout.rightHand) };
  }, [chord, direction]);

  const [leftComboRaw, setLeftCombo] = useState<ChordPositionCombo | null>(null);
  const [rightComboRaw, setRightCombo] = useState<ChordPositionCombo | null>(null);
  const leftCombo = validCombo(leftComboRaw, positions?.left.result);
  const rightCombo = validCombo(rightComboRaw, positions?.right.result);

  // The staff only ever paints the exact notes the left keyboard shows (never
  // "every octave of that pitch class"): the documented voicing when it
  // applies, otherwise the computed combination currently chosen, and only
  // when the left hand is hidden does it fall back to the documented theory.
  const computedStaffVoicing = useMemo(() => {
    if (activeParrilla || handMode === "right" || !leftCombo) return undefined;
    return leftCombo.assignments.map(({ tone, button }) => ({ displayPitch: button[direction], degree: tone.degree }));
  }, [activeParrilla, handMode, leftCombo, direction]);

  const pieceStaffVoicing = useMemo(() => {
    if (!pieceLeft || handMode === "right") return undefined;
    return pieceLeft.notes.map((note) => ({ displayPitch: note.pitch, degree: note.degree }));
  }, [pieceLeft, handMode]);

  const staffChordVoicing = useMemo(() => {
    if (pieceStaffVoicing) return pieceStaffVoicing;
    if (computedStaffVoicing) return computedStaffVoicing;
    if (!matchedParrilla) return undefined;
    return matchedParrilla.sourceVoicing.map((note) => ({ displayPitch: note.displayPitch, degree: note.degree }));
  }, [pieceStaffVoicing, computedStaffVoicing, matchedParrilla]);

  const staffChordGhost = useMemo(() => {
    if (pieceStaffVoicing) return pieceLeft?.ghost ? { displayPitch: pieceLeft.ghost.pitch } : undefined;
    if (computedStaffVoicing || !matchedParrilla?.derivedGhostFifth) return undefined;
    return { displayPitch: matchedParrilla.derivedGhostFifth.displayPitch };
  }, [pieceStaffVoicing, pieceLeft, computedStaffVoicing, matchedParrilla]);

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand-lockup">
            <BandoneonMark className="brand-mark" size={36} />
            <div>
              <div className="brand-title">Bandoneon Lab</div>
              <div className="brand-subtitle">{t.brandSubtitle}</div>
            </div>
          </div>

          <div className="settings-bar">
            <Segmented
              size="sm"
              label={t.languageLabel}
              value={language}
              onChange={setLanguage}
              options={[{ value: "pt", label: "PT" }, { value: "es", label: "ES" }]}
            />
            <Segmented
              size="sm"
              label={t.notationLabel}
              value={notationMode}
              onChange={setNotationMode}
              options={[
                { value: "latin", label: t.notationLatin },
                { value: "american", label: t.notationAmerican },
                { value: "both", label: t.notationBoth },
              ]}
            />
            <MetronomeLauncher t={t} />
          </div>
        </div>
      </header>

      <UpdateBanner t={t} />

      <main className="app-shell">
      <SearchPanel t={t} />

      <div className="stage-card console">
      <div className="console-head">
      <SelectionBar t={t} omittedDegrees={omittedDegrees} resultCount={resultCount} />
      <div className="toolbar">
        <div className="toolbar-field">
          <span className="field-label" aria-hidden="true">{t.bellowsPrefix}</span>
          <Segmented
            label={t.directionGroupLabel}
            value={direction}
            onChange={setDirection}
            options={[
              { value: "opening", label: <><span className="seg-icon" aria-hidden="true">◂ ▸</span>{t.opening}</> },
              { value: "closing", label: <><span className="seg-icon" aria-hidden="true">▸ ◂</span>{t.closing}</> },
            ]}
          />
        </div>
        <div className="toolbar-field">
          <span className="field-label" aria-hidden="true">{t.handsShort}</span>
          <Segmented
            label={t.handsVisibleLabel}
            value={handMode}
            onChange={setHandMode}
            options={[
              { value: "left", label: t.handLeftShort },
              { value: "both", label: t.bothShort },
              { value: "right", label: t.handRightShort },
            ]}
          />
        </div>
        <label className="switch-control toolbar-switch">
          <input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} />
          <span className="switch-track"><span /></span>
          <span>{t.noteNamesToggle}</span>
        </label>
      </div>
      </div>

      <section className={`instrument-stage ${handMode} ${chord || note ? "has-selection" : ""}`}>
        {handMode !== "right" && (
          <Keyboard
            title={t.handLeft}
            hand="left"
            layout={bandoneonLayout.leftHand}
            direction={direction}
            highlights={chord && !activeParrilla ? [] : highlights}
            highlightButtonIds={
              pieceLeft
                ? pieceToHighlightMap(pieceLeft.notes)
                : activeParrilla
                  ? parrillaToHighlightMap(activeParrilla)
                  : chord
                    ? comboToHighlightMap(leftCombo)
                    : undefined
            }
            ghostButtonIds={
              pieceLeft ? (pieceLeft.ghost ? new Set([pieceLeft.ghost.buttonId]) : undefined) : activeParrilla ? parrillaGhostSet(activeParrilla) : undefined
            }
            exactMidi={exactMidi}
            showLabels={showLabels}
            notationMode={notationMode}
            t={t}
            onSelectButton={selectButton}
          />
        )}

        {handMode !== "left" && (
          <Keyboard
            title={t.handRight}
            hand="right"
            layout={bandoneonLayout.rightHand}
            direction={direction}
            highlights={chord ? [] : highlights}
            highlightButtonIds={chord ? comboToHighlightMap(rightCombo) : undefined}
            exactMidi={exactMidi}
            showLabels={showLabels}
            notationMode={notationMode}
            t={t}
            onSelectButton={selectButton}
          />
        )}
      </section>

      <div className="under-stage">
        <div className="tone-legend" aria-label={t.chordFunctionsLabel}>
          <span><i className="root" /> {t.degreeRoot}</span>
          <span><i className="third" /> {t.degreeThird}</span>
          <span><i className="fifth" /> {t.degreeFifth}</span>
          <span><i className="seventh" /> {t.degreeSeventh}</span>
        </div>
      </div>
      </div>

      <PositionCards
        t={t}
        handMode={handMode}
        activeParrilla={activeParrilla}
        pieceLeft={pieceLeft}
        positions={positions}
        onLeftCombo={setLeftCombo}
        onRightCombo={setRightCombo}
      />

      <Staff chordVoicing={staffChordVoicing} chordGhost={staffChordGhost} />

      <MusicScore t={t} />

      <footer>
        <span>Bandoneon Lab · {t.credit}</span>
        <span>{t.footerTag(notationMode === "latin" ? t.notationLatin : notationMode === "american" ? t.notationAmerican : t.notationBoth)}</span>
      </footer>
      </main>
    </>
  );
}

export default function App() {
  return (
    <MusicSelectionProvider>
      <AppShell />
    </MusicSelectionProvider>
  );
}
