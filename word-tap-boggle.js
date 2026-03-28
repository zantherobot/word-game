// Word Tap Boggle - 4x4 grid word game with adjacency rules
// Letters must be adjacent (including diagonals) to the previous letter.

const GAME_DURATION = 120;
const GRID_SIZE = 16;
const GRID_COLS = 4;
const MIN_WORD_LENGTH = 3;

const LETTER_WEIGHTS = {
  a: 8.2, b: 1.5, c: 2.8, d: 4.3, e: 12.7, f: 2.2, g: 2.0, h: 6.1,
  i: 7.0, j: 0.15, k: 0.77, l: 4.0, m: 2.4, n: 6.7, o: 7.5, p: 1.9,
  q: 0.095, r: 6.0, s: 6.3, t: 9.1, u: 2.8, v: 0.98, w: 2.4, x: 0.15,
  y: 2.0, z: 0.074
};

const LETTER_POINTS = {
  a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4,
  i: 1, j: 8, k: 5, l: 1, m: 3, n: 1, o: 1, p: 3,
  q: 10, r: 1, s: 1, t: 1, u: 1, v: 4, w: 4, x: 8,
  y: 4, z: 10
};

const LENGTH_MULTIPLIER = [0, 0, 0, 1, 2, 4, 8, 15, 25, 40, 60, 80, 100, 130, 160, 200, 250];

function scoreWord(letters, timeRemaining) {
  const letterSum = letters.reduce((sum, l) => sum + (LETTER_POINTS[l] || 1), 0);
  const lengthMult = LENGTH_MULTIPLIER[Math.min(letters.length, LENGTH_MULTIPLIER.length - 1)]
    || (letters.length * 15);
  const timeBonus = Math.ceil(timeRemaining / 20);
  return letterSum * lengthMult + timeBonus;
}

// Score a word without time bonus (for max score calculation)
function scoreWordBase(letters) {
  const letterSum = letters.reduce((sum, l) => sum + (LETTER_POINTS[l] || 1), 0);
  const lengthMult = LENGTH_MULTIPLIER[Math.min(letters.length, LENGTH_MULTIPLIER.length - 1)]
    || (letters.length * 15);
  return letterSum * lengthMult;
}

function areAdjacent(a, b) {
  const rowA = Math.floor(a / GRID_COLS), colA = a % GRID_COLS;
  const rowB = Math.floor(b / GRID_COLS), colB = b % GRID_COLS;
  return Math.abs(rowA - rowB) <= 1 && Math.abs(colA - colB) <= 1 && a !== b;
}

function getAdjacentIndices(index) {
  const row = Math.floor(index / GRID_COLS);
  const col = index % GRID_COLS;
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr, c = col + dc;
      if (r >= 0 && r < GRID_COLS && c >= 0 && c < GRID_COLS) {
        neighbors.push(r * GRID_COLS + c);
      }
    }
  }
  return neighbors;
}

// Precompute adjacency list
const adjacency = [];
for (let i = 0; i < GRID_SIZE; i++) {
  adjacency.push(getAdjacentIndices(i));
}

// Standard Boggle dice (classic 4x4)
const BOGGLE_DICE = [
  'AAEEGN', 'ABBJOO', 'ACHOPS', 'AFFKPS',
  'AOOTTW', 'CIMOTU', 'DEILRX', 'DELRVY',
  'DISTTY', 'EEGHNW', 'EEINSU', 'EHRTVW',
  'EIOSST', 'ELRTTY', 'HIMNQU', 'HLNNRZ'
];

function rollBoggleDice() {
  const dice = [...BOGGLE_DICE];
  for (let i = dice.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dice[i], dice[j]] = [dice[j], dice[i]];
  }
  return dice.map(die => {
    const face = die[Math.floor(Math.random() * 6)];
    return face.toLowerCase();
  });
}

// Find all valid words on the board using DFS
function findAllWords(boardGrid) {
  const found = new Map(); // word -> letter array for scoring

  function dfs(index, path, wordSoFar, visited) {
    const word = wordSoFar + boardGrid[index];
    visited[index] = true;
    path.push(index);

    if (word.length >= MIN_WORD_LENGTH && dictionary.has(word) && !found.has(word)) {
      found.set(word, path.map(i => boardGrid[i]));
    }

    // Prune: check if any word in dictionary starts with this prefix
    if (word.length < 16 && hasPrefixInDict(word)) {
      for (const neighbor of adjacency[index]) {
        if (!visited[neighbor]) {
          dfs(neighbor, path, word, visited);
        }
      }
    }

    path.pop();
    visited[index] = false;
  }

  const visited = new Array(GRID_SIZE).fill(false);
  for (let i = 0; i < GRID_SIZE; i++) {
    dfs(i, [], '', visited);
  }

  return found;
}

// Build a trie for prefix lookups
let trieRoot = null;

function buildTrie() {
  trieRoot = {};
  for (const word of dictionary) {
    let node = trieRoot;
    for (const ch of word) {
      if (!node[ch]) node[ch] = {};
      node = node[ch];
    }
    node['$'] = true;
  }
}

function hasPrefixInDict(prefix) {
  if (!trieRoot) return true;
  let node = trieRoot;
  for (const ch of prefix) {
    if (!node[ch]) return false;
    node = node[ch];
  }
  return true;
}

function calculateMaxScore(boardGrid) {
  const allWords = findAllWords(boardGrid);
  let totalScore = 0;
  let wordCount = 0;
  for (const [word, letters] of allWords) {
    totalScore += scoreWordBase(letters);
    wordCount++;
  }
  return { totalScore, wordCount };
}

let dictionary = new Set();
let grid = [];
let lastGrid = null; // store for replay
let selected = [];
let score = 0;
let wordsFound = [];
let timeRemaining = GAME_DURATION;
let timerInterval = null;
let gameActive = false;
let maxScoreInfo = null;

let gridEl, wordEl, scoreEl, timerEl, submitBtn, clearBtn, startBtn,
    wordsListEl, messageEl, finalEl, finalScoreEl, finalWordsEl,
    playAgainBtn, playSameBtn, maxScoreEl, finalMaxEl, finalMaxWordsEl;

async function loadDictionary() {
  const resp = await fetch('word-tap-dict.txt');
  const text = await resp.text();
  text.split('\n').forEach(w => {
    const trimmed = w.trim();
    if (trimmed) dictionary.add(trimmed);
  });
  buildTrie();
}

function initGrid() {
  grid = rollBoggleDice();
  lastGrid = [...grid];
}

function renderGrid() {
  gridEl.innerHTML = '';

  grid.forEach((letter, i) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.index = i;

    if (selected.includes(i)) tile.classList.add('selected');

    const letterSpan = document.createElement('span');
    letterSpan.className = 'tile-letter';
    letterSpan.textContent = letter.toUpperCase();
    tile.appendChild(letterSpan);

    const ptsSpan = document.createElement('span');
    ptsSpan.className = 'tile-pts';
    ptsSpan.textContent = LETTER_POINTS[letter] || 1;
    tile.appendChild(ptsSpan);

    tile.addEventListener('click', () => onTileClick(i));
    gridEl.appendChild(tile);
  });

  renderPath();
}

function renderPath() {
  let svg = document.getElementById('path-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'path-svg';
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;';
    gridEl.style.position = 'relative';
    gridEl.appendChild(svg);
  }
  svg.innerHTML = '';

  if (selected.length < 2) return;

  const tiles = gridEl.querySelectorAll('.tile');
  const gridRect = gridEl.getBoundingClientRect();

  for (let i = 0; i < selected.length - 1; i++) {
    const tileA = tiles[selected[i]];
    const tileB = tiles[selected[i + 1]];
    if (!tileA || !tileB) continue;

    const rectA = tileA.getBoundingClientRect();
    const rectB = tileB.getBoundingClientRect();

    const x1 = rectA.left + rectA.width / 2 - gridRect.left;
    const y1 = rectA.top + rectA.height / 2 - gridRect.top;
    const x2 = rectB.left + rectB.width / 2 - gridRect.left;
    const y2 = rectB.top + rectB.height / 2 - gridRect.top;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'rgba(191, 124, 92, 0.5)');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-linecap', 'round');
    svg.appendChild(line);
  }
}

function onTileClick(index) {
  if (!gameActive) return;

  const pos = selected.indexOf(index);
  if (pos !== -1) {
    selected.splice(pos);
  } else {
    if (selected.length > 0) {
      const last = selected[selected.length - 1];
      if (!areAdjacent(last, index)) {
        showMessage('Must be adjacent!');
        return;
      }
    }
    selected.push(index);
  }

  renderGrid();
  updateCurrentWord();
}

function updateCurrentWord() {
  const word = selected.map(i => grid[i]).join('');
  wordEl.textContent = word.toUpperCase() || '\u00A0';
}

function getCurrentWord() {
  return selected.map(i => grid[i]).join('');
}

function getSelectedLetters() {
  return selected.map(i => grid[i]);
}

function submitWord() {
  if (!gameActive) return;

  const word = getCurrentWord();
  const letters = getSelectedLetters();

  if (word.length < MIN_WORD_LENGTH) {
    showMessage('Too short! (3+ letters)');
    clearSelection();
    return;
  }

  if (wordsFound.includes(word)) {
    showMessage('Already found!');
    clearSelection();
    return;
  }

  if (!dictionary.has(word)) {
    showMessage('Not a word!');
    clearSelection();
    return;
  }

  const points = scoreWord(letters, timeRemaining);
  score += points;
  wordsFound.push(word);

  showMessage(`+${points} pts!`, 'success');

  selected = [];
  renderGrid();
  updateCurrentWord();
  updateScore();
  addWordToList(word, points);
}

function clearSelection() {
  selected = [];
  renderGrid();
  updateCurrentWord();
}

function showMessage(text, type = 'error') {
  messageEl.textContent = text;
  messageEl.className = 'message ' + type;
  messageEl.classList.add('show');
  setTimeout(() => messageEl.classList.remove('show'), 1200);
}

function updateScore() {
  scoreEl.textContent = score;
}

function updateTimer() {
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  if (timeRemaining <= 10) {
    timerEl.classList.add('urgent');
  }
}

function addWordToList(word, points) {
  const li = document.createElement('li');
  li.innerHTML = `<span class="found-word">${word.toUpperCase()}</span><span class="found-pts">+${points}</span>`;
  wordsListEl.prepend(li);
}

function startGame(useSameGrid) {
  score = 0;
  wordsFound = [];
  selected = [];
  timeRemaining = GAME_DURATION;
  gameActive = true;
  maxScoreInfo = null;

  if (useSameGrid && lastGrid) {
    grid = [...lastGrid];
  } else {
    initGrid();
  }

  renderGrid();
  updateCurrentWord();
  updateScore();
  updateTimer();
  maxScoreEl.textContent = '--';

  timerEl.classList.remove('urgent');
  wordsListEl.innerHTML = '';
  finalEl.classList.remove('show');
  startBtn.style.display = 'none';
  document.querySelector('.game-area').classList.add('active');

  // Calculate max score in background
  setTimeout(() => {
    maxScoreInfo = calculateMaxScore(grid);
    if (gameActive) {
      maxScoreEl.textContent = maxScoreInfo.totalScore.toLocaleString();
    }
  }, 0);

  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimer();
    if (timeRemaining <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  gameActive = false;
  clearInterval(timerInterval);

  finalScoreEl.textContent = score;
  finalWordsEl.textContent = wordsFound.length;

  if (maxScoreInfo) {
    finalMaxEl.textContent = maxScoreInfo.totalScore.toLocaleString();
    finalMaxWordsEl.textContent = maxScoreInfo.wordCount;
  } else {
    finalMaxEl.textContent = '...';
    finalMaxWordsEl.textContent = '...';
  }

  finalEl.classList.add('show');
  document.querySelector('.game-area').classList.remove('active');
}

async function init() {
  gridEl = document.getElementById('grid');
  wordEl = document.getElementById('current-word');
  scoreEl = document.getElementById('score');
  timerEl = document.getElementById('timer');
  submitBtn = document.getElementById('submit-btn');
  clearBtn = document.getElementById('clear-btn');
  startBtn = document.getElementById('start-btn');
  wordsListEl = document.getElementById('words-list');
  messageEl = document.getElementById('message');
  finalEl = document.getElementById('final-screen');
  finalScoreEl = document.getElementById('final-score');
  finalWordsEl = document.getElementById('final-words');
  playAgainBtn = document.getElementById('play-again');
  playSameBtn = document.getElementById('play-same');
  maxScoreEl = document.getElementById('max-score');
  finalMaxEl = document.getElementById('final-max');
  finalMaxWordsEl = document.getElementById('final-max-words');

  submitBtn.addEventListener('click', submitWord);
  clearBtn.addEventListener('click', clearSelection);
  startBtn.addEventListener('click', () => startGame(false));
  playAgainBtn.addEventListener('click', () => startGame(false));
  playSameBtn.addEventListener('click', () => startGame(true));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitWord();
    if (e.key === 'Escape' || e.key === 'Backspace') {
      e.preventDefault();
      if (selected.length > 0) {
        selected.pop();
        renderGrid();
        updateCurrentWord();
      }
    }
  });

  startBtn.textContent = 'Loading dictionary...';
  startBtn.disabled = true;
  await loadDictionary();
  startBtn.textContent = 'START';
  startBtn.disabled = false;
}

document.addEventListener('DOMContentLoaded', init);
