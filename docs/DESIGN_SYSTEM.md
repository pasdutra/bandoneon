# Bandoneon Lab — Visual Design System v0.2

## Concept
The interface should feel like a contemporary study instrument: part bandoneon, part music stand, part precision tool. It must not resemble a SaaS dashboard.

Keywords: **charcoal, ivory, aged brass, instrument wood, sheet music, quiet precision**.

## Composition
Desktop / large-screen priority:
1. compact wordmark + bellows direction control
2. centered command/search deck
3. selected note/chord as the only large typographic moment
4. one continuous instrument stage containing left hand + bellows + right hand
5. small chord-function legend
6. chord shortcut rail
7. large ivory score sheet with treble and bass staves

The keyboard stage should visually dominate. Avoid breaking each hand into generic cards.

## Palette
- background: `#0e0e0d`
- elevated dark: `#171715`
- instrument face: `#2b2924 → #171613`
- ivory key: `#e9e0d2`
- sheet music: `#eee7dc`
- warm brass: `#b69559`
- muted text: `#948d84`

Chord degree colors:
- fundamental: warm brass `#c79a51`
- third: muted sage `#8ea08d`
- fifth: slate blue `#8294a8`
- seventh: dusty mauve `#a9858d`

Colors communicate musical function only; they are not generic decoration.

## Typography
- UI: Inter / Segoe UI / system sans
- selected musical object and section titles: Georgia / Times New Roman fallback serif
- labels: uppercase with generous tracking
- avoid large marketing copy; this is a tool, not a landing page

## Instrument stage
- Both hands live inside one continuous dark instrument surface.
- A stylized bellows column sits between the hands on desktop.
- Button discs are warm ivory with subtle depth, not flat circles.
- Octave number is smaller and offset from the note name so `Sol♯6` remains readable.
- opening/closing never moves button geometry.
- selected keys use the chord-degree palette.
- when only one hand is visible, it expands to the available width.

## Score sheet
- Treble and bass staffs sit on one large ivory paper surface.
- The paper is visually distinct from the dark instrument section.
- Notes are dark ink; selected note is restrained brick-red.
- horizontal scrolling is allowed for the note sequence on small screens.
- natural notes only in v0.2; accidental interaction is deferred and clearly labeled.

## Interaction feel
- no ornamental animation
- 150–180 ms transitions only for direct interaction
- selected controls use ivory, not bright app-blue
- hover may lift a key very slightly, but touch/click is primary
- visible focus state is mandatory
- respect `prefers-reduced-motion`

## Responsive behavior
At <= 900px:
- keyboards stack vertically
- decorative bellows disappear
- controls reflow rather than shrink
- staves remain horizontally scrollable

At <= 620px:
- direction control spans width
- search button stacks below input
- dense metadata disappears before primary content is compromised

## Anti-patterns
Do not introduce:
- neon gradients
- glassmorphism
- generic blue/purple AI palette
- floating dashboard cards everywhere
- decorative charts
- fake 3D photorealism
- tiny labels requiring hover
- icons where plain language is clearer
