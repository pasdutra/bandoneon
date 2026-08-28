# Bandoneon Lab — instructions for Claude Code

## Product goal
Build a visually excellent, full-screen-first web/PWA study tool that translates between musical notation, note names, chord structure, and the physical buttons of a 71-button bisonoric bandoneon.

The user studies primarily on a large Windows display but must be able to use the same app from any modern browser/tablet. The app is Portuguese-first and uses Latin note names in the UI: Dó, Ré, Mi, Fá, Sol, Lá, Si.

## Non-negotiable data rule
`src/data/bandoneonLayout.ts` is the provisional source of truth reconstructed from four user-provided diagrams stored in `docs/reference-images/`: right/left hand × opening/closing.

- 38 right-hand buttons
- 33 left-hand buttons
- 71 total buttons
- Each physical button has one opening pitch and one closing pitch.
- Do NOT modify the layout data while doing UI refactors.
- If a layout correction is requested, change only the relevant button record and document it.

## Musical correctness rules
1. Internal pitch parsing may use scientific names (C4, F#4, Bb3), but UI labels are Latin.
2. Enharmonic pitches are physically equivalent but spelling must remain theoretically correct in chords.
   - Example: Dó♯7 = Dó♯ · Mi♯ · Sol♯ · Si, not Dó♯ · Fá · Sol♯ · Si.
3. A note search without octave highlights all octave instances of that pitch class.
4. A note search with octave highlights the exact sounding pitch.
5. Opening/closing changes the pitch attached to the same physical SVG button; geometry must not jump.

## V1 scope
Keep V1 intentionally small:
- opening/closing toggle
- both hands / left / right view
- Latin note search
- chord search
- chord-tone highlighting (root, third, fifth, seventh)
- favorite chord shortcuts
- clickable bandoneon buttons
- clickable treble/bass staff for natural notes
- responsive full-screen layout
- PWA/offline shell

Do NOT add yet:
- microphone/audio recognition
- PDF/OMR
- imported scores
- automatic fingering
- backend/accounts
- AI-generated musical answers

## UX direction
The current visual implementation in `src/styles/app.css`, `src/App.tsx`, `src/components/Keyboard.tsx`, and `src/components/Staff.tsx` is the approved v0.2 design direction. Read `docs/DESIGN_SYSTEM.md` before visual refactors. Preserve the continuous instrument stage, bellows motif, ivory keys, chord-degree palette, and score-sheet treatment unless explicitly asked to redesign them.

This is an instrument/study surface, not an admin dashboard.
- Large, calm typography.
- Dark, restrained interface.
- The keyboards are the visual center.
- SVG geometry must remain crisp at 4K and on tablets.
- Essential interactions must work by click/touch; hover is secondary.
- Avoid tiny controls, nested cards, dashboard clutter, gradients for decoration, and generic SaaS styling.

## Architecture
- React + TypeScript + Vite
- SVG for keyboards and staff
- no backend in V1
- no state library until needed
- music logic stays in `src/music/`
- instrument data stays in `src/data/`
- rendering stays in `src/components/`

## Before changing behavior
Run or create checks for:
- total buttons = 71
- right = 38
- left = 33
- right opening covers A3–B6 except A#6 exactly once
- left opening covers C2–A4 except C#2 exactly once
- chord parser spells Dó♯7 correctly
- Solm resolves to Sol · Si♭ · Ré
- Si♭7 resolves to Si♭ · Ré · Fá · Lá♭

## Immediate next tasks
1. Install dependencies and make `npm run build` pass.
2. Verify the keyboard geometry visually against the supplied reference diagrams.
3. Improve responsive layout without touching pitch data.
4. Add tests for note/chord parsing and layout invariants.
5. Only after those pass, refine the staff interaction and accidental selection.
