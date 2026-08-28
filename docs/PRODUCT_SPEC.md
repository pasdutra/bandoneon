# Bandoneon Lab — Product Specification v0.1

## Core problem
The user has difficulty rapidly locating notes and building chords on a bisonoric bandoneon. The app should make the physical mapping visually obvious during practice on a large screen, while remaining usable anywhere through the web.

## Core mental model
**PARTITURA ⇄ NOTA ⇄ TECLADO ⇄ ACORDE**

The user should be able to enter from any of these directions:
- click a button → see its note
- click a staff note → see the corresponding button(s)
- search a note → highlight matching button(s)
- search a chord → highlight all chord tones

## Primary screen
1. Header + opening/closing control
2. Search mode: Acorde / Nota
3. Large result name and chord spelling
4. Left and right keyboard SVGs
5. Favorite chord shortcuts
6. Large interactive treble staff
7. Large interactive bass staff

## UI notation
Latin notation is canonical for display:
- C = Dó
- D = Ré
- E = Mi
- F = Fá
- G = Sol
- A = Lá
- B = Si

Accept both Latin and Anglo-American notation in search where practical.

## Note behavior
- `Sol` → all G pitch classes in the current bellows direction
- `Sol4` → exact G4 only
- `Si♭` and `Lá♯` → same physical pitch-class matches
- exact octave identity uses sounding pitch, not string equality

## Chord behavior
Initial qualities:
- major
- minor
- dominant 7
- minor 7
- major 7
- diminished triad

Chord spelling must preserve diatonic function. Example:
- Dó♯7 → Dó♯, Mi♯, Sol♯, Si
- Solm → Sol, Si♭, Ré

## Initial favorite chords
Solm, Dóm, Fám, Fá♯m, Dó♯m, Sol♯m, Lá7, Dó♯7, Fá7, Si♭7, Mi♭7, Lá♭7.

## PWA strategy
V1 is a static client-side app. No account or backend. The production service worker caches visited same-origin assets and the app shell for offline reuse after the first successful load.

## Deferred
- editable favorites persistence/sync
- accidentals directly on staff
- imported MusicXML
- OMR/PDF
- fingering optimization
- audio recognition
