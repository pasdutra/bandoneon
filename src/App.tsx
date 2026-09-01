import { useEffect, useMemo, useRef, useState } from "react";
import { bandoneonLayout, type BellowsDirection } from "./data/bandoneonLayout";
import { BandoneonMark } from "./components/BandoneonMark";
import { Keyboard } from "./components/Keyboard";
import { Metronome } from "./components/Metronome";
import { ParrillaPositionPanel } from "./components/ParrillaPositionPanel";
import { Staff } from "./components/Staff";
import { UpdateBanner } from "./components/UpdateBanner";
import type { Strings } from "./i18n/strings";
import { parseChord } from "./music/chords";
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

function SearchDrawer({ t }: { t: Strings }) {
  const {
    noteQuery,
    setNoteQuery,
    chordQuery,
    setChordQuery,
    chord,
    note,
    favorites,
    removeFavorite,
    searchNote,
    searchChord,
    chooseFavorite,
  } = useMusicSelection();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  // Once a search actually finds something, get out of the way — the
  // popup's job is picking a note/chord, not displaying it.
  useEffect(() => {
    if (chord) setOpen(false);
  }, [chord]);
  useEffect(() => {
    if (note) setOpen(false);
  }, [note]);

  return (
    <div className="search-drawer-root" ref={containerRef}>
      <button
        type="button"
        className="search-drawer-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span aria-hidden="true">⌕</span>
        {t.searchDrawerLabel}
      </button>

      <div className={`search-drawer ${open ? "open" : ""}`}>
        <div className="search-drawer-head">
          <span>{t.searchDrawerLabel}</span>
          <button type="button" className="search-drawer-close" aria-label={t.closeLabel} onClick={() => setOpen(false)}>×</button>
        </div>

        <div className="search-drawer-body">
          <section className="notes-section">
            <div className="section-heading">
              <div>
                <span>{t.notesHeading}</span>
                <small>{t.notesSubtitle}</small>
              </div>
              <div className="section-rule" />
            </div>

            <div className="search-bar-row">
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
          </section>

          <section className="chords-section">
            <div className="section-heading">
              <div>
                <span>{t.chordsHeading}</span>
                <small>{t.chordsSubtitle}</small>
              </div>
              <div className="section-rule" />
            </div>

            <div className="search-bar-row">
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
            </div>

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
          </section>
        </div>
      </div>
    </div>
  );
}

function SearchResult({
  t,
  handMode,
  activeParrilla,
  omittedDegrees,
  resultCount,
}: {
  t: Strings;
  handMode: HandMode;
  activeParrilla: ParrillaChord | null;
  omittedDegrees: Set<string>;
  resultCount: number | null;
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
                  className={`degree-${tone.degree.replaceAll("♭", "flat")} ${isOmitted ? "muted" : ""}`}
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

      {chord && activeParrilla && handMode !== "right" && (
        <ParrillaPositionPanel parrilla={activeParrilla} t={t} />
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

  // The staff only ever paints the exact documented notes of a chord (never
  // "every octave of that pitch class") — same specific data as the keyboard.
  const staffChordVoicing = useMemo(() => {
    if (!matchedParrilla) return undefined;
    return matchedParrilla.sourceVoicing.map((note) => ({ displayPitch: note.displayPitch, degree: note.degree }));
  }, [matchedParrilla]);

  const staffChordGhost = useMemo(() => {
    if (!matchedParrilla?.derivedGhostFifth) return undefined;
    return { displayPitch: matchedParrilla.derivedGhostFifth.displayPitch };
  }, [matchedParrilla]);

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
      <SearchDrawer t={t} />

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

      <SearchResult
        t={t}
        handMode={handMode}
        activeParrilla={activeParrilla}
        omittedDegrees={omittedDegrees}
        resultCount={resultCount}
      />

      <section className={`instrument-stage ${handMode}`}>
        {handMode !== "right" && (
          <Keyboard
            title={t.handLeft}
            hand="left"
            layout={bandoneonLayout.leftHand}
            direction={direction}
            highlights={chord && !activeParrilla ? [] : highlights}
            highlightButtonIds={activeParrilla ? parrillaToHighlightMap(activeParrilla) : undefined}
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

      <Staff chordVoicing={staffChordVoicing} chordGhost={staffChordGhost} />

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
