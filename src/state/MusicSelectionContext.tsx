import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { BandoneonButton, BellowsDirection, Hand } from "../data/bandoneonLayout";
import { STRINGS, type Language, type Strings } from "../i18n/strings";
import { getButtonDetail, type ButtonDetail } from "../music/buttonDetail";
import { parseChord, type ParsedChord } from "../music/chords";
import type { NotationMode } from "../music/notationFormat";
import { parseNote, pitchToLatin, type ParsedNote } from "../music/notes";
import { findParrillaChord, mapGenericQualityToParrilla } from "../music/parrillaLibrary";

export type HandMode = "both" | "left" | "right";
export type { Language, NotationMode };

export interface HighlightTone {
  pitchClass: number;
  degree?: string;
}

const FAVORITES_STORAGE_KEY = "bandoneon-lab:favorite-chords";

/**
 * No preset default favorites: the old hardcoded 12-chord seed list
 * (which included Lá♭7) has been retired along with the rest of the old
 * chord-preset system. Favorites now start empty and are purely
 * user-curated via the ☆ toggle. Anything already saved in a browser's
 * localStorage from before is left untouched here (never cleared) since
 * there is no way to tell, from this code alone, which of those entries
 * were genuinely chosen by that user versus leftover defaults.
 */
function loadFavorites(): string[] {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) return parsed;
  } catch {
    // corrupt or unavailable storage — start empty
  }
  return [];
}

/**
 * Single shared musical selection: the Notas search, the Acordes search, the
 * keyboards, and the staff all read/write through this instead of
 * prop-drilling from App. Note and chord search are independent — each has
 * its own query/error — so both sections stay visible and usable at once
 * instead of toggling a shared mode. `highlights`/`exactMidi` are derived
 * once here so every consumer (keyboard, staff) lights up the same tones the
 * same way. Clicking a button re-derives its note/detail from the live
 * direction so toggling Abrindo/Fechando never leaves a stale selection.
 */
interface MusicSelectionState {
  language: Language;
  notationMode: NotationMode;
  t: Strings;
  direction: BellowsDirection;
  handMode: HandMode;
  showLabels: boolean;
  noteQuery: string;
  chordQuery: string;
  chord: ParsedChord | null;
  note: ParsedNote | null;
  noteError: string;
  chordError: string;
  buttonDetail: ButtonDetail | null;
  highlights: HighlightTone[];
  exactMidi?: number;
  favorites: string[];
  isFavorite: (name: string) => boolean;
  toggleFavorite: (name: string) => void;
  removeFavorite: (name: string) => void;
  setLanguage: (language: Language) => void;
  setNotationMode: (mode: NotationMode) => void;
  setDirection: (direction: BellowsDirection) => void;
  setHandMode: (handMode: HandMode) => void;
  setShowLabels: (value: boolean) => void;
  setNoteQuery: (value: string) => void;
  setChordQuery: (value: string) => void;
  searchNote: (value?: string) => void;
  searchChord: (value?: string) => void;
  chooseFavorite: (value: string) => void;
  selectButton: (button: BandoneonButton, hand: Hand) => void;
}

const MusicSelectionContext = createContext<MusicSelectionState | null>(null);

export function MusicSelectionProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("pt");
  const [notationMode, setNotationMode] = useState<NotationMode>("latin");
  const [direction, setDirection] = useState<BellowsDirection>("opening");
  const [handMode, setHandMode] = useState<HandMode>("both");
  const [showLabels, setShowLabels] = useState(true);
  const [noteQuery, setNoteQuery] = useState("");
  const [chordQuery, setChordQuery] = useState("");
  const [chord, setChord] = useState<ParsedChord | null>(null);
  const [searchedNote, setSearchedNote] = useState<ParsedNote | null>(null);
  const [noteError, setNoteError] = useState("");
  const [chordError, setChordError] = useState("");
  const [selectedButton, setSelectedButton] = useState<{ button: BandoneonButton; hand: Hand } | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // ignore write failures (private browsing, storage full, etc.)
    }
  }, [favorites]);

  function isFavorite(name: string) {
    return favorites.includes(name);
  }

  function toggleFavorite(name: string) {
    setFavorites((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]));
  }

  function removeFavorite(name: string) {
    setFavorites((prev) => prev.filter((item) => item !== name));
  }

  function searchNote(value = noteQuery) {
    setNoteError("");
    setSelectedButton(null);
    const parsed = parseNote(value);
    if (!parsed) {
      setNoteError("Não reconheci essa nota. Tente Sol, Si♭, Fá♯4 ou Dó5.");
      return;
    }
    setSearchedNote(parsed);
    setChord(null);
    setNoteQuery(value);
  }

  // For now the app only shows chords from the documented parrilla library —
  // the generic engine still computes the theory (verified to match all 37
  // entries), but a query that doesn't correspond to one of those 37 chords
  // is rejected rather than offered as a freeform "build any chord" result.
  function searchChord(value = chordQuery) {
    setChordError("");
    const parsed = parseChord(value);
    const parrillaQuality = parsed ? mapGenericQualityToParrilla(parsed.quality) : null;
    const inLibrary = parsed && parrillaQuality ? findParrillaChord(parsed.tones[0].pitchClass, parrillaQuality) : undefined;
    if (!parsed || !inLibrary) {
      setChordError(t.chordNotFound);
      return;
    }
    setChord(parsed);
    setSearchedNote(null);
    setSelectedButton(null);
    setChordQuery(value);
  }

  function chooseFavorite(value: string) {
    setChordQuery(value);
    searchChord(value);
  }

  function selectButton(button: BandoneonButton, hand: Hand) {
    setNoteError("");
    setChord(null);
    setNoteQuery(pitchToLatin(button[direction]));
    setSelectedButton({ button, hand });
  }

  const buttonDetail = useMemo(
    () => (selectedButton ? getButtonDetail(selectedButton.button, selectedButton.hand, direction) : null),
    [selectedButton, direction],
  );

  const note = useMemo(() => {
    if (selectedButton) return parseNote(selectedButton.button[direction]);
    return searchedNote;
  }, [selectedButton, direction, searchedNote]);

  const highlights = useMemo<HighlightTone[]>(() => {
    if (chord) return chord.tones.map((tone) => ({ pitchClass: tone.pitchClass, degree: tone.degree }));
    if (note) return [{ pitchClass: note.pitchClass }];
    return [];
  }, [chord, note]);

  const exactMidi = note?.octave !== undefined ? note.midi : undefined;

  const t = STRINGS[language];

  const value = useMemo<MusicSelectionState>(
    () => ({
      language,
      notationMode,
      t,
      direction,
      handMode,
      showLabels,
      noteQuery,
      chordQuery,
      chord,
      note,
      noteError,
      chordError,
      buttonDetail,
      highlights,
      exactMidi,
      favorites,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      setLanguage,
      setNotationMode,
      setDirection,
      setHandMode,
      setShowLabels,
      setNoteQuery,
      setChordQuery,
      searchNote,
      searchChord,
      chooseFavorite,
      selectButton,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      language,
      notationMode,
      direction,
      handMode,
      showLabels,
      noteQuery,
      chordQuery,
      chord,
      note,
      noteError,
      chordError,
      buttonDetail,
      highlights,
      exactMidi,
      favorites,
    ],
  );

  return <MusicSelectionContext.Provider value={value}>{children}</MusicSelectionContext.Provider>;
}

export function useMusicSelection() {
  const ctx = useContext(MusicSelectionContext);
  if (!ctx) throw new Error("useMusicSelection must be used within MusicSelectionProvider");
  return ctx;
}
