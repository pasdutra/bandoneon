import { useEffect, useMemo, useRef, useState } from "react";
import { bandoneonLayout, type BellowsDirection } from "./data/bandoneonLayout";
import { BandoneonMark } from "./components/BandoneonMark";
import { Keyboard } from "./components/Keyboard";
import { Metronome } from "./components/Metronome";
import { ChordPositionPanel } from "./components/ChordPositionPanel";
import { MusicScore } from "./components/MusicScore";
import { ParrillaPositionPanel } from "./components/ParrillaPositionPanel";
import { Staff } from "./components/Staff";
import { UpdateBanner } from "./components/UpdateBanner";
import type { Strings } from "./i18n/strings";
import { findChordPositions, type ChordPositionCombo, type ChordPositionResult } from "./music/chordPositions";
import { parseChord, type ChordQuality } from "./music/chords";
import { degreeClass } from "./music/degreeClass";
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

function DirectionRail({
  direction,
  setDirection,
  t,
}: {
  direction: BellowsDirection;
  setDirection: (direction: BellowsDirection) => void;
  t: ReturnType<typeof useMusicSelection>["t"];
}) {
  return (
    <div className={`bellows ${direction}`}>
      <div className="bellows-toggle" role="group" aria-label={t.directionGroupLabel}>
        <button className={direction === "opening" ? "active" : ""} onClick={() => setDirection("opening")} aria-label={t.opening}>
          <span className="direction-arrows">◀ ▶</span>
        </button>
        <button className={direction === "closing" ? "active" : ""} onClick={() => setDirection("closing")} aria-label={t.closing}>
          <span className="direction-arrows">▶ ◀</span>
        </button>
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
      const stage = document.querySelector(".instrument-stage");
      if (stage && stage.getBoundingClientRect().top > window.innerHeight * 0.6) {
        stage.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  }

  return (
    <section className="search-panel" aria-label={t.searchDrawerLabel}>
      <div className="search-panel-col">
        <div className="panel-title">
          <span>{t.notesHeading}</span>
          <small>{t.notesSubtitle}</small>
        </div>
        <form className="search-form" onSubmit={(event) => { event.preventDefault(); searchNote(); }}>
          <div className="search-field">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              value={noteQuery}
              onChange={(event) => setNoteQuery(event.target.value)}
              placeholder={t.notePlaceholder}
              aria-label={t.noteSearchLabel}
            />
          </div>
          <button className="primary" type="submit">{t.show}</button>
        </form>
      </div>

      <div className="search-panel-col">
        <div className="panel-title">
          <span>{t.chordsHeading}</span>
          <small>{t.chordsSubtitle}</small>
        </div>
        <form className="search-form" onSubmit={(event) => { event.preventDefault(); searchChord(); }}>
          <div className="search-field">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              value={chordQuery}
              onChange={(event) => setChordQuery(event.target.value)}
              placeholder={t.chordPlaceholder}
              aria-label={t.chordSearchLabel}
            />
          </div>
          <button className="primary" type="submit">{t.show}</button>
        </form>

        <div className="chord-builder">
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
        )}
      </div>
    </section>
  );
}

function SearchResult({
  t,
  handMode,
  activeParrilla,
  omittedDegrees,
  resultCount,
  positions,
  onLeftCombo,
  onRightCombo,
}: {
  t: Strings;
  handMode: HandMode;
  activeParrilla: ParrillaChord | null;
  omittedDegrees: Set<string>;
  resultCount: number | null;
  positions: { left: HandPositions; right: HandPositions } | null;
  onLeftCombo: (combo: ChordPositionCombo | null) => void;
  onRightCombo: (combo: ChordPositionCombo | null) => void;
}) {
  const {
    notationMode,
    direction,
    chord,
    note,
    noteError,
    chordError,
    buttonDetail,
    isFavorite,
    toggleFavorite,
  } = useMusicSelection();

  const hasNoteResult = Boolean(note || noteError);
  const hasChordResult = Boolean(chord || chordError);
  if (!hasNoteResult && !hasChordResult && !buttonDetail) return null;

  return (
    <div className="search-result">
      {noteError ? (
        <div className="error">{noteError}</div>
      ) : note ? (
        <div className="study-heading" aria-live="polite">
          <div className="result-title">{formatNoteName(note, notationMode)}</div>
          <div className="note-detail">
            {note.octave === undefined ? t.allOctaves(resultCount ?? 0) : t.exactNote(resultCount ?? 0)}
          </div>
        </div>
      ) : null}

      {buttonDetail && (
        <section className="button-detail" aria-live="polite">
          <div className="bd-row">
            <span className="bd-label">{t.buttonDetailLabel}</span>
            <span className="bd-value">{buttonDetail.hand === "left" ? t.handLeft : t.handRight} · {buttonDetail.buttonId}</span>
          </div>
          <div className="bd-row">
            <span className="bd-label">{t.currentNoteLabel(direction === "opening" ? t.openingLower : t.closingLower)}</span>
            <span className="bd-value">{formatNoteName(buttonDetail.current, notationMode)}</span>
          </div>
          {buttonDetail.enharmonic && (
            <div className="bd-row">
              <span className="bd-label">{t.enharmonicLabel}</span>
              <span className="bd-value">{formatNoteName(buttonDetail.enharmonic, notationMode)}</span>
            </div>
          )}
          <div className="bd-row">
            <span className="bd-label">{t.opening}</span>
            <span className="bd-value">{formatNoteName(buttonDetail.opening, notationMode)}</span>
          </div>
          <div className="bd-row">
            <span className="bd-label">{t.closing}</span>
            <span className="bd-value">{formatNoteName(buttonDetail.closing, notationMode)}</span>
          </div>
        </section>
      )}

      {chordError ? (
        <div className="error">{chordError}</div>
      ) : chord ? (
        <div className="study-heading" aria-live="polite">
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
          <div className="chord-tones" aria-label={t.chordTonesLabel}>
            {chord.tones.map((tone) => {
              const isOmitted = omittedDegrees.has(tone.degree);
              return (
                <span
                  className={`${degreeClass[tone.degree] ?? ""} ${isOmitted ? "muted" : ""}`}
                  key={`${tone.degree}-${tone.scientific}`}
                >
                  <b>{formatToneName(tone, notationMode)}</b>
                  <small>{tone.degree}</small>
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      {chord && positions && (
        <div className="chord-positions">
          {handMode !== "right" &&
            (activeParrilla ? (
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
      )}
    </div>
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

  const activeParrilla = isParrillaPhysicallyActive(matchedParrilla, "left", direction) ? matchedParrilla : null;

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

  const staffChordVoicing = useMemo(() => {
    if (computedStaffVoicing) return computedStaffVoicing;
    if (!matchedParrilla) return undefined;
    return matchedParrilla.sourceVoicing.map((note) => ({ displayPitch: note.displayPitch, degree: note.degree }));
  }, [computedStaffVoicing, matchedParrilla]);

  const staffChordGhost = useMemo(() => {
    if (computedStaffVoicing || !matchedParrilla?.derivedGhostFifth) return undefined;
    return { displayPitch: matchedParrilla.derivedGhostFifth.displayPitch };
  }, [computedStaffVoicing, matchedParrilla]);

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand-lockup">
            <BandoneonMark className="brand-mark" size={40} />
            <div>
              <div className="brand-title">Bandoneon Lab</div>
              <div className="brand-subtitle">{t.brandSubtitle}</div>
              <div className="brand-credit">{t.credit}</div>
            </div>
          </div>

          <div className="settings-bar">
            <div className="settings-group" role="group" aria-label={t.languageLabel}>
              <button className={language === "pt" ? "seg active" : "seg"} onClick={() => setLanguage("pt")}>PT</button>
              <button className={language === "es" ? "seg active" : "seg"} onClick={() => setLanguage("es")}>ES</button>
            </div>
            <div className="settings-group" role="group" aria-label={t.notationLabel}>
              <button className={notationMode === "latin" ? "seg active" : "seg"} onClick={() => setNotationMode("latin")}>{t.notationLatin}</button>
              <button className={notationMode === "american" ? "seg active" : "seg"} onClick={() => setNotationMode("american")}>{t.notationAmerican}</button>
              <button className={notationMode === "both" ? "seg active" : "seg"} onClick={() => setNotationMode("both")}>{t.notationBoth}</button>
            </div>
            <MetronomeLauncher t={t} />
          </div>
        </div>
      </header>

      <UpdateBanner t={t} />

      <main className="app-shell">
      <SearchPanel t={t} />

      <div className="stage-controls">
        <label className="switch-control">
          <input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} />
          <span className="switch-track"><span /></span>
          <span>{t.namesToggle}</span>
        </label>
        <select value={handMode} onChange={(event) => setHandMode(event.target.value as typeof handMode)} aria-label={t.handsVisibleLabel}>
          <option value="both">{t.bothHands}</option>
          <option value="right">{t.handRight}</option>
          <option value="left">{t.handLeft}</option>
        </select>
      </div>

      <section className={`instrument-stage ${handMode}`}>
        {handMode !== "right" && (
          <Keyboard
            title={t.handLeft}
            hand="left"
            layout={bandoneonLayout.leftHand}
            direction={direction}
            highlights={chord && !activeParrilla ? [] : highlights}
            highlightButtonIds={activeParrilla ? parrillaToHighlightMap(activeParrilla) : chord ? comboToHighlightMap(leftCombo) : undefined}
            ghostButtonIds={activeParrilla ? parrillaGhostSet(activeParrilla) : undefined}
            exactMidi={exactMidi}
            showLabels={showLabels}
            notationMode={notationMode}
            t={t}
            onSelectButton={selectButton}
          />
        )}

        <DirectionRail direction={direction} setDirection={setDirection} t={t} />

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

      <section className="under-stage">
        <div className="tone-legend" aria-label={t.chordFunctionsLabel}>
          <span><i className="root" /> {t.degreeRoot}</span>
          <span><i className="third" /> {t.degreeThird}</span>
          <span><i className="fifth" /> {t.degreeFifth}</span>
          <span><i className="seventh" /> {t.degreeSeventh}</span>
        </div>
        <div className="direction-caption">
          {t.bellowsPrefix} <strong>{direction === "opening" ? t.openingLower : t.closingLower}</strong>
        </div>
      </section>

      <SearchResult
        t={t}
        handMode={handMode}
        activeParrilla={activeParrilla}
        omittedDegrees={omittedDegrees}
        resultCount={resultCount}
        positions={positions}
        onLeftCombo={setLeftCombo}
        onRightCombo={setRightCombo}
      />

      <Staff chordVoicing={staffChordVoicing} chordGhost={staffChordGhost} />

      <MusicScore t={t} />

      <footer>
        <span>Bandoneon Lab</span>
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
