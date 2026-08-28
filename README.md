# Bandoneon Lab

Starter web/PWA prototype for a 71-button bisonoric bandoneon study interface.

## Run on Windows
1. Install Node.js LTS.
2. Open this folder in a terminal.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local URL printed by Vite.

## Continue with Claude Code
Open Claude Code in the project root. It will automatically see `CLAUDE.md`.

Recommended first instruction:

> Read CLAUDE.md, docs/PRODUCT_SPEC.md and docs/LAYOUT_REFERENCE.md. Do not alter the pitch layout. Install dependencies, run the build, fix only build/runtime issues, then launch the app and audit the visual keyboard geometry against the layout data. After that, improve the first-screen experience for a large 16:9 monitor while preserving tablet responsiveness.

## Current prototype
- 71-button structured layout
- opening/closing toggle
- Latin note names
- note search with optional octave
- chord parser and theoretically correct spelling
- initial favorite chords
- clickable left/right SVG keyboards
- clickable natural-note treble/bass staff
- static PWA manifest + production service worker

## Important
The layout is a transcription of the supplied reference diagrams and should be human-validated on the user's actual instrument before treating it as permanent truth.
