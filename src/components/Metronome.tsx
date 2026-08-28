import { useEffect, useRef, useState } from "react";
import type { Strings } from "../i18n/strings";

const MIN_BPM = 40;
const MAX_BPM = 208;
const SCHEDULE_AHEAD_TIME = 0.1;
const LOOKAHEAD_MS = 25;
const CLICK_DURATION = 0.05;

interface ScheduledBeat {
  beatIndex: number;
  time: number;
}

export function Metronome({ t, onPlayingChange }: { t: Strings; onPlayingChange?: (playing: boolean) => void }) {
  const [bpm, setBpm] = useState(100);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState<3 | 4>(4);
  const [accentFirst, setAccentFirst] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const nextBeatIndexRef = useRef(0);
  const timerIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const scheduledBeatsRef = useRef<ScheduledBeat[]>([]);

  // Kept in refs so the running scheduler always reads the latest values
  // without needing to restart on every knob change.
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const accentFirstRef = useRef(accentFirst);
  bpmRef.current = bpm;
  beatsPerMeasureRef.current = beatsPerMeasure;
  accentFirstRef.current = accentFirst;

  function scheduleClick(beatIndex: number, time: number) {
    const ctx = audioCtxRef.current!;
    const isAccent = accentFirstRef.current && beatIndex === 0;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = isAccent ? 1500 : 900;
    gain.gain.setValueAtTime(isAccent ? 0.5 : 0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + CLICK_DURATION);
    osc.start(time);
    osc.stop(time + CLICK_DURATION);
    scheduledBeatsRef.current.push({ beatIndex, time });
  }

  function scheduler() {
    const ctx = audioCtxRef.current!;
    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_TIME) {
      scheduleClick(nextBeatIndexRef.current, nextNoteTimeRef.current);
      nextNoteTimeRef.current += 60.0 / bpmRef.current;
      nextBeatIndexRef.current = (nextBeatIndexRef.current + 1) % beatsPerMeasureRef.current;
    }
    timerIdRef.current = window.setTimeout(scheduler, LOOKAHEAD_MS);
  }

  function visualLoop() {
    const ctx = audioCtxRef.current;
    if (ctx) {
      const now = ctx.currentTime;
      while (scheduledBeatsRef.current.length && scheduledBeatsRef.current[0].time <= now) {
        const next = scheduledBeatsRef.current.shift()!;
        setCurrentBeat(next.beatIndex);
      }
    }
    rafIdRef.current = requestAnimationFrame(visualLoop);
  }

  function start() {
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;
    void ctx.resume();
    nextBeatIndexRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    scheduledBeatsRef.current = [];
    setCurrentBeat(null);
    setIsPlaying(true);
    onPlayingChange?.(true);
    scheduler();
    rafIdRef.current = requestAnimationFrame(visualLoop);
  }

  function stop() {
    if (timerIdRef.current !== null) window.clearTimeout(timerIdRef.current);
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    timerIdRef.current = null;
    rafIdRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    scheduledBeatsRef.current = [];
    setIsPlaying(false);
    onPlayingChange?.(false);
    setCurrentBeat(null);
  }

  useEffect(() => stop, []);

  function toggle() {
    if (isPlaying) stop();
    else start();
  }

  return (
      <div className="metronome-controls">
        <div className="metronome-bpm">
          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(event) => setBpm(Number(event.target.value))}
            aria-label={t.bpmLabel}
          />
          <div className="metronome-bpm-value">
            <b>{bpm}</b> <small>{t.bpmLabel}</small>
          </div>
        </div>

        <div className="metronome-row">
          <div className="metronome-field">
            <small>{t.beatsPerMeasureLabel}</small>
            <div className="settings-group" role="group" aria-label={t.beatsPerMeasureLabel}>
              <button className={beatsPerMeasure === 3 ? "seg active" : "seg"} onClick={() => setBeatsPerMeasure(3)}>3</button>
              <button className={beatsPerMeasure === 4 ? "seg active" : "seg"} onClick={() => setBeatsPerMeasure(4)}>4</button>
            </div>
          </div>

          <label className="switch-control metronome-accent">
            <input type="checkbox" checked={accentFirst} onChange={(event) => setAccentFirst(event.target.checked)} />
            <span className="switch-track"><span /></span>
            <span>{t.accentFirstBeatLabel}</span>
          </label>

          <button type="button" className="primary metronome-toggle" onClick={toggle}>
            {isPlaying ? `■ ${t.metronomeStop}` : `▶ ${t.metronomeStart}`}
          </button>
        </div>

        <div className="beat-dots" aria-hidden="true">
          {Array.from({ length: beatsPerMeasure }, (_, index) => (
            <span
              key={index}
              className={`beat-dot ${accentFirst && index === 0 ? "accent" : ""} ${currentBeat === index ? "active" : ""}`}
            />
          ))}
        </div>
      </div>
  );
}
