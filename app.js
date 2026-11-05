'use strict';

// 1. Einstellungen und Zustand des aktuellen Spiels.
const SAVE_KEY = 'denkpause-sudoku-v1';
const CLUE_COUNTS = { easy: 39, medium: 32, hard: 27 };
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const boardElement = document.querySelector('#board');
const numberButtons = document.querySelector('#numbers');
const levelButtons = document.querySelectorAll('[data-level]');
const menuButton = document.querySelector('#menu-toggle');
const navigation = document.querySelector('#navigation');
const themeButtons = document.querySelectorAll('.theme-toggle');
const root = document.documentElement;
let game;
let selectedCell = -1;

// Jedes Farbtheme besteht aus Name, dunkler Farbe und heller Farbe.
// Die eigentlichen Seitenfarben stehen passend dazu am Anfang der CSS-Datei.
const PALETTES = [
  { id: 'mono', name: 'Schwarz & Weiß', dark: '#000000', light: '#fff' },
  { id: 'garden', name: 'Grün & Pink', dark: '#141c14', light: '#f6bdd7' },
  { id: 'rose', name: 'Rot & Pink', dark: '#3b090b', light: '#fa5c5c' },
  { id: 'pink', name: 'Hellpink & Dunkelpink', dark: '#330c15', light: '#ffe0f0' },
  { id: 'blue', name: 'Hellblau & Dunkelblau', dark: '#0a0f36', light: '#7077a1' },
  { id: 'green', name: 'Hellgrün & Dunkelgrün', dark: '#0e2111', light: '#dcefcf' },
  { id: 'lavender', name: 'Lavendel', dark: '#1a0e21', light: '#ebe1ff' },
  { id: 'sunshine', name: 'Orange & Gelb', dark: '#703a03', light: '#fff0a6' },
  { id: 'sand', name: 'Braun & Beige', dark: '#261c12', light: '#f0e2cc' },
];

// Alle übersetzbaren Texte stehen hier nebeneinander.
// data-text und data-label verbinden die HTML-Elemente mit diesen Schlüsseln.
const TEXT = {
  de: {
    headline: 'Denken statt scrollen.', legalNav: 'Rechtliche Informationen', imprint: 'Impressum', privacy: 'Datenschutz', colors: 'Farbtheme',
    moreFromAshwite: 'Mehr von ashwite',
    account: 'Konto', accountSignIn: 'Anmelden', accountSignUp: 'Konto erstellen',
    accountSave: 'Speichern', accountLoad: 'Laden', accountSignOut: 'Abmelden',
    difficulty: 'Schwierigkeit', language: 'Sprache', easy: 'Leicht', medium: 'Mittel', hard: 'Schwer',
    home: 'Sudoku Startseite', settings: 'Spieleinstellungen', game: 'Sudoku-Spiel',
    board: 'Sudoku-Raster', numbers: 'Zahlen eingeben', number: 'Zahl',
    openMenu: 'Menü öffnen', closeMenu: 'Menü schließen',
    useLight: 'Hellmodus einschalten', useDark: 'Dunkelmodus einschalten',
    row: 'Zeile', column: 'Spalte', empty: 'leer', fixed: 'vorgegeben',
    start: 'Such dir ein freies Feld und leg los.', select: 'Wähle zuerst ein Feld aus.',
    fixedMessage: 'Diese Zahl ist vorgegeben.', completed: 'Geschafft! Das nächste Sudoku startet gleich.',
    replace: 'Schwierigkeit wechseln? Dein aktueller Spielstand wird ersetzt.',
    description: 'Sudoku mit drei Schwierigkeitsstufen und automatischem Spielstand.',
    paletteNames: ['Schwarz & Weiß', 'Grün & Pink', 'Rot & Pink', 'Hellpink & Dunkelpink',
      'Hellblau & Dunkelblau', 'Hellgrün & Dunkelgrün', 'Lavendel', 'Orange & Gelb', 'Braun & Beige']
  },
  en: {
    headline: 'Think instead of scrolling.', legalNav: 'Legal information', imprint: 'Legal notice', privacy: 'Privacy', colors: 'Color theme',
    moreFromAshwite: 'More from ashwite',
    account: 'Account', accountSignIn: 'Sign in', accountSignUp: 'Create account',
    accountSave: 'Save', accountLoad: 'Load', accountSignOut: 'Sign out',
    difficulty: 'Difficulty', language: 'Language', easy: 'Easy', medium: 'Medium', hard: 'Hard',
    home: 'Sudoku home', settings: 'Game settings', game: 'Sudoku game',
    board: 'Sudoku grid', numbers: 'Enter numbers', number: 'Number',
    openMenu: 'Open menu', closeMenu: 'Close menu',
    useLight: 'Switch to light mode', useDark: 'Switch to dark mode',
    row: 'Row', column: 'Column', empty: 'empty', fixed: 'given',
    start: 'Choose an empty cell to begin.', select: 'Choose a cell first.',
    fixedMessage: 'This number is given.', completed: 'Solved! The next Sudoku is about to start.',
    replace: 'Change difficulty? Your current progress will be replaced.',
    description: 'Sudoku with three difficulty levels and automatic progress saving.',
    paletteNames: ['Black & White', 'Green & Pink', 'Red & Pink', 'Light & Dark Pink',
      'Light & Dark Blue', 'Light & Dark Green', 'Lavender', 'Orange & Yellow', 'Brown & Beige']
  }
};
let lastMessage = '';

function translate(key) {
  return TEXT[root.lang === 'en' ? 'en' : 'de'][key];
}

function updateLanguage() {
  document.querySelectorAll('[data-text]').forEach(element => {
    element.textContent = translate(element.dataset.text);
  });
  document.querySelectorAll('[data-label]').forEach(element => {
    element.setAttribute('aria-label', translate(element.dataset.label));
  });
  document.querySelectorAll('[data-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === root.lang));
  });
  document.querySelectorAll('[data-palette-choice]').forEach((button, index) => {
    const name = translate('paletteNames')[index];
    button.title = name;
    button.setAttribute('aria-label', name);
  });
  [...numberButtons.children].forEach((button, index) => {
    button.setAttribute('aria-label', `${translate('number')} ${index + 1}`);
  });
  document.title = `Sudoku · ${translate('headline')}`;
  document.querySelector('meta[name="description"]').content = translate('description');
  updateAppearance();
  toggleMenu(!navigation.hidden);
  if (lastMessage) announce(lastMessage);
  if (game) renderBoard();
}

// 2. Sudoku erzeugen. Eine 0 bedeutet immer: Dieses Feld ist leer.
function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [result[i], result[randomIndex]] = [result[randomIndex], result[i]];
  }
  return result;
}

function createSolution() {
  // Zeilen und Spalten werden innerhalb gültiger Dreiergruppen vertauscht.
  // So bleibt das Grundmuster ein gültiges Sudoku.
  function shuffledGroups() {
    return shuffle([0, 1, 2]).flatMap(group =>
      shuffle([0, 1, 2]).map(offset => group * 3 + offset)
    );
  }
  const rows = shuffledGroups();
  const columns = shuffledGroups();
  const digits = shuffle(DIGITS);
  return rows.flatMap(row => columns.map(column => {
    const position = (row * 3 + Math.floor(row / 3) + column) % 9;
    return digits[position];
  }));
}

function possibleDigits(board, index) {
  const row = Math.floor(index / 9);
  const column = index % 9;
  const used = new Set();
  for (let i = 0; i < 9; i++) {
    used.add(board[row * 9 + i]);
    used.add(board[i * 9 + column]);
    const blockRow = Math.floor(row / 3) * 3 + Math.floor(i / 3);
    const blockColumn = Math.floor(column / 3) * 3 + i % 3;
    used.add(board[blockRow * 9 + blockColumn]);
  }
  return DIGITS.filter(digit => !used.has(digit));
}

function countSolutions(board, limit = 2) {
  // Probiere zuerst das leere Feld mit den wenigsten Möglichkeiten.
  // Bei zwei Lösungen können wir aufhören: Das Rätsel wäre nicht eindeutig.
  let nextIndex = -1;
  let candidates = [];
  for (let i = 0; i < 81; i++) {
    if (board[i] !== 0) continue;
    const options = possibleDigits(board, i);
    if (options.length === 0) return 0;
    if (nextIndex === -1 || options.length < candidates.length) {
      nextIndex = i;
      candidates = options;
      if (options.length === 1) break;
    }
  }
  if (nextIndex === -1) return 1;

  let total = 0;
  for (const digit of candidates) {
    board[nextIndex] = digit;
    total += countSolutions(board, limit - total);
    if (total >= limit) break;
  }
  board[nextIndex] = 0;
  return total;
}

function startGame(level = 'easy') {
  const solved = createSolution();
  const given = [...solved];
  const positions = shuffle(Array.from({ length: 81 }, (_, index) => index));
  let clueCount = 81;

  // Entferne Zahlen nur dann, wenn genau eine Lösung übrig bleibt.
  for (const index of positions) {
    if (clueCount <= CLUE_COUNTS[level]) break;
    const digit = given[index];
    given[index] = 0;
    if (countSolutions([...given]) === 1) clueCount--;
    else given[index] = digit;
  }
  game = { level, solved, given, values: [...given], done: false };
  selectedCell = -1;
  announce('start');
  saveGame();
  renderBoard();
}

// 3. Eingabe und Anzeige. Vorgegebene Zahlen können nicht geändert werden.
function sharesUnit(first, second) {
  const firstRow = Math.floor(first / 9);
  const secondRow = Math.floor(second / 9);
  const firstColumn = first % 9;
  const secondColumn = second % 9;
  return firstRow === secondRow || firstColumn === secondColumn ||
    (Math.floor(firstRow / 3) === Math.floor(secondRow / 3) &&
     Math.floor(firstColumn / 3) === Math.floor(secondColumn / 3));
}

function renderBoard() {
  boardElement.replaceChildren();
  for (let index = 0; index < 81; index++) {
    const button = document.createElement('button');
    const value = game.values[index];
    button.className = 'cell';
    button.textContent = value || '';
    button.classList.toggle('given', game.given[index] !== 0);
    button.classList.toggle('selected', selectedCell === index);
    if (selectedCell >= 0) {
      button.classList.toggle('related', sharesUnit(selectedCell, index));
      button.classList.toggle('same', value !== 0 && value === game.values[selectedCell]);
    }
    const row = Math.floor(index / 9) + 1;
    const column = index % 9 + 1;
    const fixedLabel = game.given[index] ? `, ${translate('fixed')}` : '';
    button.setAttribute('aria-label', `${translate('row')} ${row}, ${translate('column')} ${column}: ${value || translate('empty')}${fixedLabel}`);
    button.setAttribute('aria-pressed', String(selectedCell === index));
    button.tabIndex = selectedCell === index || (selectedCell === -1 && index === 0) ? 0 : -1;
    button.onclick = () => selectCell(index);
    boardElement.append(button);
  }
  levelButtons.forEach(button => {
    const active = button.dataset.level === game.level;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function selectCell(index) {
  // Ein zweiter Tipp auf das ausgewählte Feld löscht die eigene Zahl.
  if (selectedCell === index && !game.given[index] && game.values[index]) {
    enterDigit(0);
    return;
  }
  selectedCell = index;
  renderBoard();
}

function enterDigit(digit) {
  if (game.done) return;
  if (selectedCell < 0) return announce('select');
  if (game.given[selectedCell]) return announce('fixedMessage');
  game.values[selectedCell] = digit;
  game.done = game.values.every((value, index) => value === game.solved[index]);
  saveGame();
  renderBoard();
  if (game.done) advanceAfterCompletion();
}

function advanceAfterCompletion() {
  announce('completed');
  const completedGame = game;
  // Kurze Pause, damit das vollständig gelöste Raster noch zu sehen ist.
  setTimeout(() => {
    if (game === completedGame && game.done) startGame(game.level);
  }, 1200);
}

function announce(key) {
  lastMessage = key;
  document.querySelector('#message').textContent = translate(key);
}

// 4. Spielstand speichern. Alte Spielstände nutzen dieselben Felder weiter.
function saveSetting(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Bei blockiertem Speicher bleibt das Spiel in diesem Tab nutzbar.
  }
}

function saveGame() {
  saveSetting(SAVE_KEY, JSON.stringify(game));
}

function isValidBoard(board, minimum = 0) {
  return Array.isArray(board) && board.length === 81 &&
    board.every(value => Number.isInteger(value) && value >= minimum && value <= 9);
}

function loadGame(serialized) {
  try {
    const saved = JSON.parse(serialized ?? localStorage.getItem(SAVE_KEY));
    if (!saved || !Object.hasOwn(CLUE_COUNTS, saved.level) ||
        !isValidBoard(saved.solved, 1) || !isValidBoard(saved.given) ||
        !isValidBoard(saved.values)) return false;
    if (saved.solved.some((value, index) => saved.solved
        .slice(0, index).some((other, previous) => value === other && sharesUnit(index, previous)))) return false;
    if (!saved.given.every((value, index) => value === 0 ||
        (value === saved.solved[index] && value === saved.values[index]))) return false;
    game = {
      level: saved.level,
      solved: saved.solved,
      given: saved.given,
      values: saved.values,
      done: saved.values.every((value, index) => value === saved.solved[index])
    };
    return true;
  } catch {
    return false;
  }
}

// 5. Navigation, Hell-/Dunkelmodus und Farbthemes.
function toggleMenu(open) {
  navigation.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', translate(open ? 'closeMenu' : 'openMenu'));
}

function updateAppearance() {
  const dark = root.dataset.theme === 'dark';
  themeButtons.forEach(button => {
    button.firstElementChild.textContent = dark ? '☀︎' : '☾';
    button.setAttribute('aria-label', translate(dark ? 'useLight' : 'useDark'));
    button.setAttribute('aria-pressed', String(dark));
  });
  document.querySelectorAll('[data-palette-choice]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.paletteChoice === root.dataset.palette));
  });
  const background = getComputedStyle(root).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]').content = background;
}

function createPaletteButtons() {
  for (const palette of PALETTES) {
    const button = document.createElement('button');
    button.className = 'palette-choice';
    button.dataset.paletteChoice = palette.id;
    button.title = palette.name;
    button.setAttribute('aria-label', palette.name);
    const swatch = document.createElement('span');
    swatch.className = 'palette-swatch';
    swatch.style.setProperty('--swatch-dark', palette.dark);
    swatch.style.setProperty('--swatch-light', palette.light);
    swatch.setAttribute('aria-hidden', 'true');
    button.append(swatch);
    button.onclick = () => {
      root.dataset.palette = palette.id;
      saveSetting('sudoku-palette', palette.id);
      updateAppearance();
    };
    document.querySelector('#palettes').append(button);
  }
}

document.querySelectorAll('[data-language]').forEach(button => {
  button.onclick = () => {
    root.lang = button.dataset.language;
    saveSetting('sudoku-language', root.lang);
    updateLanguage();
  };
});

menuButton.onclick = () => toggleMenu(navigation.hidden);
function toggleTheme() {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  saveSetting('sudoku-theme', root.dataset.theme);
  updateAppearance();
}
themeButtons.forEach(button => button.addEventListener('click', toggleTheme));
document.addEventListener('click', event => {
  if (!event.target.closest('.header-actions')) toggleMenu(false);
});
levelButtons.forEach(button => {
  button.onclick = () => {
    const level = button.dataset.level;
    if (game && level !== game.level) {
      const hasEntries = game.values.some((value, index) => value !== game.given[index]);
      const mayReplace = !hasEntries || game.done ||
        confirm(translate('replace'));
      if (mayReplace) startGame(level);
    }
    toggleMenu(false);
  };
});

// Zahlentasten erstellen; die Tastatur bietet dieselben Eingabemöglichkeiten.
for (const digit of DIGITS) {
  const button = document.createElement('button');
  button.textContent = digit;
  button.setAttribute('aria-label', `${translate('number')} ${digit}`);
  button.onclick = () => enterDigit(digit);
  numberButtons.append(button);
}

document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.target.closest?.('input, textarea, select, [contenteditable], [role=dialog]')) return;
  if (event.key === 'Escape' && !navigation.hidden) {
    toggleMenu(false);
    menuButton.focus();
    return;
  }
  // In der Navigation bleiben Tab, Pfeiltasten und Kurzbefehle frei nutzbar.
  if (!navigation.hidden || event.ctrlKey || event.metaKey || event.altKey) return;
  if (/^[1-9]$/.test(event.key)) {
    event.preventDefault();
    enterDigit(Number(event.key));
  } else if (['Backspace', 'Delete', '0'].includes(event.key)) {
    event.preventDefault();
    enterDigit(0);
  } else if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
    event.preventDefault();
    if (selectedCell < 0) selectedCell = 0;
    else {
      let row = Math.floor(selectedCell / 9);
      let column = selectedCell % 9;
      if (event.key === 'ArrowRight') column = (column + 1) % 9;
      if (event.key === 'ArrowLeft') column = (column + 8) % 9;
      if (event.key === 'ArrowDown') row = (row + 1) % 9;
      if (event.key === 'ArrowUp') row = (row + 8) % 9;
      selectedCell = row * 9 + column;
    }
    renderBoard();
    boardElement.children[selectedCell].focus();
  }
});
window.addEventListener('pagehide', saveGame);

// 6. Start: gespeicherte Einstellungen und Spielstand wiederherstellen.
if (!PALETTES.some(palette => palette.id === root.dataset.palette)) root.dataset.palette = 'mono';
createPaletteButtons();
updateLanguage();
if (loadGame()) {
  renderBoard();
  if (game.done) advanceAfterCompletion();
} else startGame();

// Elemente beim ersten Hineinscrollen sanft einblenden.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('.board-wrap, #numbers').forEach((element, index) => {
    element.classList.add('scroll-reveal');
    element.style.transitionDelay = `${index * 90 + 100}ms`;
    observer.observe(element);
  });
}
