// Word Tap - 16 letter grid word game
// Tap letters to form words. Longer words + speed = more points. 2 minutes.

const GAME_DURATION = 120; // seconds
const GRID_SIZE = 16;
const MIN_WORD_LENGTH = 3;

// English letter frequencies (approximate)
const LETTER_WEIGHTS = {
  a: 8.2, b: 1.5, c: 2.8, d: 4.3, e: 12.7, f: 2.2, g: 2.0, h: 6.1,
  i: 7.0, j: 0.15, k: 0.77, l: 4.0, m: 2.4, n: 6.7, o: 7.5, p: 1.9,
  q: 0.095, r: 6.0, s: 6.3, t: 9.1, u: 2.8, v: 0.98, w: 2.4, x: 0.15,
  y: 2.0, z: 0.074
};

// Scoring: exponential reward for longer words
function scoreWord(len, timeRemaining) {
  const basePoints = [0, 0, 0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78, 91, 105];
  const base = basePoints[Math.min(len, basePoints.length - 1)] || (len * (len - 1) / 2);
  const timeBonus = Math.ceil(timeRemaining / 20); // 1-6 bonus based on time left
  return base + timeBonus;
}

// Build weighted random letter picker
const weightedLetters = [];
for (const [letter, weight] of Object.entries(LETTER_WEIGHTS)) {
  const count = Math.round(weight * 10);
  for (let i = 0; i < count; i++) {
    weightedLetters.push(letter);
  }
}

function randomLetter() {
  return weightedLetters[Math.floor(Math.random() * weightedLetters.length)];
}

// Game state
let dictionary = new Set();
let grid = [];          // 16 letters
let selected = [];      // indices of selected tiles
let score = 0;
let wordsFound = [];
let timeRemaining = GAME_DURATION;
let timerInterval = null;
let gameActive = false;

// DOM refs (set in init)
let gridEl, wordEl, scoreEl, timerEl, submitBtn, clearBtn, startBtn,
    wordsListEl, messageEl, finalEl, finalScoreEl, finalWordsEl, playAgainBtn;

async function loadDictionary() {
  const resp = await fetch('word-tap-dict.txt');
  const text = await resp.text();
  text.split('\n').forEach(w => {
    const trimmed = w.trim();
    if (trimmed) dictionary.add(trimmed);
  });
}

function initGrid() {
  grid = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    grid.push(randomLetter());
  }
}

function renderGrid() {
  gridEl.innerHTML = '';
  grid.forEach((letter, i) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.textContent = letter.toUpperCase();
    tile.dataset.index = i;
    if (selected.includes(i)) {
      tile.classList.add('selected');
      const order = selected.indexOf(i);
      tile.style.setProperty('--select-order', order);
    }
    tile.addEventListener('click', () => onTileClick(i));
    gridEl.appendChild(tile);
  });
}

function onTileClick(index) {
  if (!gameActive) return;

  const pos = selected.indexOf(index);
  if (pos !== -1) {
    // Deselect: remove this and all after it
    selected.splice(pos);
  } else {
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

function submitWord() {
  if (!gameActive) return;

  const word = getCurrentWord();

  if (word.length < MIN_WORD_LENGTH) {
    showMessage('Too short! (3+ letters)');
    return;
  }

  if (wordsFound.includes(word)) {
    showMessage('Already found!');
    return;
  }

  if (!dictionary.has(word)) {
    showMessage('Not a word!');
    return;
  }

  // Valid word!
  const points = scoreWord(word.length, timeRemaining);
  score += points;
  wordsFound.push(word);

  showMessage(`+${points} pts!`, 'success');

  // Replace used tiles with new letters
  const usedIndices = [...selected];
  usedIndices.forEach(i => {
    grid[i] = randomLetter();
  });

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

function startGame() {
  score = 0;
  wordsFound = [];
  selected = [];
  timeRemaining = GAME_DURATION;
  gameActive = true;

  initGrid();
  renderGrid();
  updateCurrentWord();
  updateScore();
  updateTimer();

  timerEl.classList.remove('urgent');
  wordsListEl.innerHTML = '';
  finalEl.classList.remove('show');
  startBtn.style.display = 'none';
  document.querySelector('.game-area').classList.add('active');

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

  submitBtn.addEventListener('click', submitWord);
  clearBtn.addEventListener('click', clearSelection);
  startBtn.addEventListener('click', startGame);
  playAgainBtn.addEventListener('click', startGame);

  // Keyboard shortcuts
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
