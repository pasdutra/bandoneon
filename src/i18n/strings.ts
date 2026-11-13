export type Language = "pt" | "es";

export interface Strings {
  brandSubtitle: string;
  languageLabel: string;
  notationLabel: string;
  notationLatin: string;
  notationAmerican: string;
  notationBoth: string;
  directionGroupLabel: string;
  opening: string;
  closing: string;
  openingLower: string;
  closingLower: string;
  notesHeading: string;
  notesSubtitle: string;
  notePlaceholder: string;
  noteSearchLabel: string;
  show: string;
  noteEmptyState: string;
  allOctaves: (count: number) => string;
  exactNote: (count: number) => string;
  buttonDetailLabel: string;
  handLeft: string;
  handRight: string;
  handLeftLower: string;
  handRightLower: string;
  apostilaPositionLabel: string;
  otherPositionsLabel: string;
  currentNoteLabel: (direction: string) => string;
  enharmonicLabel: string;
  namesToggle: string;
  handsVisibleLabel: string;
  bothHands: string;
  chordFunctionsLabel: string;
  degreeRoot: string;
  degreeThird: string;
  degreeFifth: string;
  degreeSeventh: string;
  bellowsPrefix: string;
  chordsHeading: string;
  chordsSubtitle: string;
  chordPlaceholder: string;
  chordSearchLabel: string;
  chordTonesLabel: string;
  noteNotFound: string;
  chordNotFound: string;
  footerTag: (notation: string) => string;
  statusComplete: string;
  statusOpen: string;
  statusIncomplete: string;
  missing: (list: string) => string;
  hintOtherDirection: (direction: string) => string;
  suggestedPosition: string;
  suggestedDisclaimer: string;
  showAlternatives: string;
  hideAlternatives: string;
  suggestion: string;
  alternative: (n: number) => string;
  staffHeading: string;
  staffSubtitle: string;
  staffWatermark: string;
  staffFootnote: string;
  trebleClef: string;
  bassClef: string;
  buttonsCount: (n: number) => string;
  addFavoriteLabel: string;
  removeFavoriteLabel: string;
  credit: string;
  metronomeHeading: string;
  metronomeSubtitle: string;
  bpmLabel: string;
  beatsPerMeasureLabel: string;
  accentFirstBeatLabel: string;
  metronomeStart: string;
  metronomeStop: string;
  closeLabel: string;
  updateAvailable: (version: string) => string;
  updateInstall: string;
  updateInstalling: string;
  searchDrawerLabel: string;
  pieceVoicingLabel: (piece: string, page: number) => string;
  handsShort: string;
  handLeftShort: string;
  handRightShort: string;
  bothShort: string;
  noteNamesToggle: string;
  selectionChord: string;
  selectionNote: string;
  rootShort: string;
  typeShort: string;
  favoritesShort: string;
  chordRootLabel: string;
  chordTypeLabel: string;
  chordMajorLabel: string;
  musicHeading: string;
  musicSubtitle: string;
  musicLoadLabel: string;
  musicLoading: string;
  musicEmptyState: string;
  musicLoadError: string;
}

export const STRINGS: Record<Language, Strings> = {
  pt: {
    brandSubtitle: "mapa de estudo · 71 botões",
    languageLabel: "Idioma",
    notationLabel: "Notação",
    notationLatin: "Latina",
    notationAmerican: "Americana",
    notationBoth: "Ambas",
    directionGroupLabel: "Direção do fole",
    opening: "Abrindo",
    closing: "Fechando",
    openingLower: "abrindo",
    closingLower: "fechando",
    notesHeading: "Notas",
    notesSubtitle: "busca por nome ou clique na pauta",
    notePlaceholder: "Sol, Fá♯4, Si♭3…",
    noteSearchLabel: "Buscar nota",
    show: "Mostrar",
    noteEmptyState: "Escolha uma nota, clique num botão ou numa nota da pauta.",
    allOctaves: (count) => `Todas as oitavas · ${count} posições nesta direção`,
    exactNote: (count) => `Nota exata · ${count} posições nesta direção`,
    buttonDetailLabel: "Botão",
    handLeft: "Mão esquerda",
    handRight: "Mão direita",
    handLeftLower: "mão esquerda",
    handRightLower: "mão direita",
    apostilaPositionLabel: "Posição da apostila",
    otherPositionsLabel: "Outras posições",
    currentNoteLabel: (direction) => `Nota atual (${direction})`,
    enharmonicLabel: "Enarmônico",
    namesToggle: "Nomes",
    handsVisibleLabel: "Mãos visíveis",
    bothHands: "Duas mãos",
    chordFunctionsLabel: "Funções do acorde",
    degreeRoot: "fundamental",
    degreeThird: "terça",
    degreeFifth: "quinta",
    degreeSeventh: "sétima",
    bellowsPrefix: "Fole",
    chordsHeading: "Acordes",
    chordsSubtitle: "busca ou favoritos",
    chordPlaceholder: "Solm, Dó7, Si♭7…",
    chordSearchLabel: "Buscar acorde",
    chordTonesLabel: "Notas do acorde",
    noteNotFound: "Não reconheci essa nota. Tente Sol, Si♭, Fá♯4 ou Dó5.",
    chordNotFound: "Não reconheci esse acorde. Tente Solm, Dó7, Fá♯m7, Si♭maj7, Ré6, Lásus4 ou Mi9.",
    footerTag: (notation) => `Notação ${notation} · layout de referência AA 71`,
    statusComplete: "Completo",
    statusOpen: "Completo · muito aberto",
    statusIncomplete: "Incompleto",
    missing: (list) => `Faltando: ${list}`,
    hintOtherDirection: (direction) => `Há uma posição completa nesta mão ${direction} o fole.`,
    suggestedPosition: "Posição compacta sugerida",
    suggestedDisclaimer: "(sugestão de proximidade, não a melhor digitação)",
    showAlternatives: "Mostrar alternativas",
    hideAlternatives: "Ocultar alternativas",
    suggestion: "Sugestão",
    alternative: (n) => `Alternativa ${n}`,
    staffHeading: "Pauta interativa",
    staffSubtitle: "clique numa nota e encontre o botão",
    staffWatermark: "BANDONEON LAB · LEITURA VISUAL",
    staffFootnote: "Notas naturais · acidentes entram na próxima camada",
    trebleClef: "Clave de Sol",
    bassClef: "Clave de Fá",
    buttonsCount: (n) => `${n} botões`,
    addFavoriteLabel: "Adicionar aos favoritos",
    removeFavoriteLabel: "Remover dos favoritos",
    credit: "por Pedro Dutra e Grisel Petru",
    metronomeHeading: "Metrônomo",
    metronomeSubtitle: "pulso pra estudar no tempo",
    bpmLabel: "BPM",
    beatsPerMeasureLabel: "Compasso",
    accentFirstBeatLabel: "Acentuar o primeiro tempo",
    metronomeStart: "Iniciar",
    metronomeStop: "Parar",
    closeLabel: "Fechar",
    updateAvailable: (version) => `Nova versão disponível: ${version}`,
    updateInstall: "Atualizar e reiniciar",
    updateInstalling: "Instalando…",
    searchDrawerLabel: "Notas & Acordes",
    pieceVoicingLabel: (piece, page) => `${piece} · pág. ${page}`,
    handsShort: "Mãos",
    handLeftShort: "Esquerda",
    handRightShort: "Direita",
    bothShort: "Duas",
    noteNamesToggle: "Nomes das notas",
    selectionChord: "Acorde",
    selectionNote: "Nota",
    rootShort: "Tom",
    typeShort: "Tipo",
    favoritesShort: "Favoritos",
    chordRootLabel: "Tom do acorde",
    chordTypeLabel: "Tipo do acorde",
    chordMajorLabel: "Maior",
    musicHeading: "Música",
    musicSubtitle: "carregue uma partitura MusicXML e clique numa nota",
    musicLoadLabel: "Carregar partitura (.musicxml/.xml)",
    musicLoading: "Carregando…",
    musicEmptyState: "Nenhuma partitura carregada ainda.",
    musicLoadError: "Não consegui ler esse arquivo. Verifique se é um MusicXML válido.",
  },
  es: {
    brandSubtitle: "mapa de estudio · 71 botones",
    languageLabel: "Idioma",
    notationLabel: "Notación",
    notationLatin: "Latina",
    notationAmerican: "Americana",
    notationBoth: "Ambas",
    directionGroupLabel: "Dirección del fuelle",
    opening: "Abriendo",
    closing: "Cerrando",
    openingLower: "abriendo",
    closingLower: "cerrando",
    notesHeading: "Notas",
    notesSubtitle: "busca por nombre o haz clic en el pentagrama",
    notePlaceholder: "Sol, Fa♯4, Si♭3…",
    noteSearchLabel: "Buscar nota",
    show: "Mostrar",
    noteEmptyState: "Elige una nota, haz clic en un botón o en una nota del pentagrama.",
    allOctaves: (count) => `Todas las octavas · ${count} posiciones en esta dirección`,
    exactNote: (count) => `Nota exacta · ${count} posiciones en esta dirección`,
    buttonDetailLabel: "Botón",
    handLeft: "Mano izquierda",
    handRight: "Mano derecha",
    handLeftLower: "mano izquierda",
    handRightLower: "mano derecha",
    apostilaPositionLabel: "Posición del método",
    otherPositionsLabel: "Otras posiciones",
    currentNoteLabel: (direction) => `Nota actual (${direction})`,
    enharmonicLabel: "Enarmónico",
    namesToggle: "Nombres",
    handsVisibleLabel: "Manos visibles",
    bothHands: "Dos manos",
    chordFunctionsLabel: "Funciones del acorde",
    degreeRoot: "fundamental",
    degreeThird: "tercera",
    degreeFifth: "quinta",
    degreeSeventh: "séptima",
    bellowsPrefix: "Fuelle",
    chordsHeading: "Acordes",
    chordsSubtitle: "búsqueda o favoritos",
    chordPlaceholder: "Solm, Do7, Sib7…",
    chordSearchLabel: "Buscar acorde",
    chordTonesLabel: "Notas del acorde",
    noteNotFound: "No reconocí esa nota. Prueba Sol, Si♭, Fa♯4 o Do5.",
    chordNotFound: "No reconocí ese acorde. Prueba Solm, Do7, Fa♯m7, Si♭maj7, Re6, Lasus4 o Mi9.",
    footerTag: (notation) => `Notación ${notation} · mapa de referencia AA 71`,
    statusComplete: "Completo",
    statusOpen: "Completo · muy abierto",
    statusIncomplete: "Incompleto",
    missing: (list) => `Falta: ${list}`,
    hintOtherDirection: (direction) => `Hay una posición completa en esta mano ${direction} el fuelle.`,
    suggestedPosition: "Posición compacta sugerida",
    suggestedDisclaimer: "(sugerencia de proximidad, no el mejor digitado)",
    showAlternatives: "Mostrar alternativas",
    hideAlternatives: "Ocultar alternativas",
    suggestion: "Sugerencia",
    alternative: (n) => `Alternativa ${n}`,
    staffHeading: "Pentagrama interactivo",
    staffSubtitle: "haz clic en una nota y encuentra el botón",
    staffWatermark: "BANDONEON LAB · LECTURA VISUAL",
    staffFootnote: "Notas naturales · los alterados llegan en la próxima capa",
    trebleClef: "Clave de Sol",
    bassClef: "Clave de Fa",
    buttonsCount: (n) => `${n} botones`,
    addFavoriteLabel: "Agregar a favoritos",
    removeFavoriteLabel: "Quitar de favoritos",
    credit: "por Pedro Dutra y Grisel Petru",
    metronomeHeading: "Metrónomo",
    metronomeSubtitle: "pulso para estudiar en tiempo",
    bpmLabel: "BPM",
    beatsPerMeasureLabel: "Compás",
    accentFirstBeatLabel: "Acentuar el primer tiempo",
    metronomeStart: "Iniciar",
    metronomeStop: "Detener",
    closeLabel: "Cerrar",
    updateAvailable: (version) => `Nueva versión disponible: ${version}`,
    updateInstall: "Actualizar y reiniciar",
    updateInstalling: "Instalando…",
    searchDrawerLabel: "Notas y Acordes",
    pieceVoicingLabel: (piece, page) => `${piece} · pág. ${page}`,
    handsShort: "Manos",
    handLeftShort: "Izquierda",
    handRightShort: "Derecha",
    bothShort: "Dos",
    noteNamesToggle: "Nombres de las notas",
    selectionChord: "Acorde",
    selectionNote: "Nota",
    rootShort: "Tono",
    typeShort: "Tipo",
    favoritesShort: "Favoritos",
    chordRootLabel: "Tono del acorde",
    chordTypeLabel: "Tipo de acorde",
    chordMajorLabel: "Mayor",
    musicHeading: "Música",
    musicSubtitle: "carga una partitura MusicXML y haz clic en una nota",
    musicLoadLabel: "Cargar partitura (.musicxml/.xml)",
    musicLoading: "Cargando…",
    musicEmptyState: "Todavía no hay ninguna partitura cargada.",
    musicLoadError: "No pude leer ese archivo. Verifica que sea un MusicXML válido.",
  },
};
