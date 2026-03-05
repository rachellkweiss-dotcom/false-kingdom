import { Game } from './game.js';
import { BoardRenderer } from './board.js';
import { getAIMove } from './ai.js';
import { PIECE_TYPES } from './pieces.js';
import { getRawMoves } from './rules.js';

const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const boardEl = document.getElementById('board');
const turnIndicator = document.getElementById('turn-indicator');
const turnText = document.getElementById('turn-text');
const modeLabel = document.getElementById('game-mode-label');
const gameOverModal = document.getElementById('game-over-modal');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverMessage = document.getElementById('game-over-message');
const capturedWhitePieces = document.getElementById('captured-white-pieces');
const capturedBlackPieces = document.getElementById('captured-black-pieces');

const btnVsFriend = document.getElementById('btn-vs-friend');
const btnVsAI = document.getElementById('btn-vs-ai');
const btnBack = document.getElementById('btn-back');
const btnPlayAgain = document.getElementById('btn-play-again');
const btnMainMenu = document.getElementById('btn-main-menu');
const difficultySelect = document.getElementById('difficulty-select');
const btnEasy = document.getElementById('btn-easy');
const btnMedium = document.getElementById('btn-medium');
const btnHard = document.getElementById('btn-hard');

const knowModal = document.getElementById('know-modal');
const btnTeachMe = document.getElementById('btn-teach-me');
const btnIKnow = document.getElementById('btn-i-know');
const tutorialOverlay = document.getElementById('tutorial-overlay');
const tutorialTitle = document.getElementById('tutorial-title');
const tutorialText = document.getElementById('tutorial-text');
const tutorialPiecePreview = document.getElementById('tutorial-piece-preview');
const tutorialDots = document.getElementById('tutorial-dots');
const btnTutBack = document.getElementById('btn-tut-back');
const btnTutNext = document.getElementById('btn-tut-next');
const btnSpeak = document.getElementById('btn-speak');

const DIFFICULTY = { easy: { depth: 2, randomness: 0.4 }, medium: { depth: 3, randomness: 0 }, hard: { depth: 5, randomness: 0 } };

const TUTORIAL_STEPS = [
  {
    title: 'Welcome!',
    text: 'Welcome to False Kingdom! Your goal is simple: capture the other player\'s Dragon. Let\'s meet your team!',
    highlights: [],
    pieceImgs: [],
  },
  {
    title: 'The Dragon',
    text: 'This is your Dragon — the most important piece! It can move one square in any direction. Keep it safe! If your Dragon gets captured, you lose the game.',
    highlights: [[7, 2]],
    pieceImgs: ['king'],
  },
  {
    title: 'Shield Bearers',
    text: 'These are your Shield Bearers. They move forward or diagonally, one square at a time. On their very first move, they can jump two squares! If a Shield Bearer makes it all the way to the other side of the board, it transforms into a powerful Phoenix!',
    highlights: [[7, 0], [7, 4], [7, 6]],
    pieceImgs: ['servant'],
  },
  {
    title: 'Elven Archer',
    text: 'This is your Elven Archer. It slides in a straight line — forward, backward, or sideways — as far as it wants! It captures any enemy it bumps into along the way.',
    highlights: [[5, 2]],
    pieceImgs: ['saviour'],
  },
  {
    title: 'The Phoenix',
    text: 'When a Shield Bearer reaches the far side of the board, it transforms into a Phoenix! The Phoenix can move one square in any direction and can land on any color square. It\'s your strongest piece after the Dragon!',
    highlights: [],
    pieceImgs: ['transformed'],
  },
  {
    title: 'You\'re Ready!',
    text: 'Capture the enemy Dragon to win. Use your Shield Bearers to push forward, your Elven Archer to control the board, and protect your Dragon at all costs. Good luck!',
    highlights: [],
    pieceImgs: [],
  },
];

const game = new Game();
let renderer = null;
let aiDifficulty = DIFFICULTY.medium;
let pendingMode = null;
let tutorialStep = 0;

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function askIfKnowsRules(mode) {
  pendingMode = mode;
  knowModal.classList.add('active');
}

const gameBody = document.querySelector('.game-body');

function startGame(mode) {
  game.reset();
  game.setMode(mode);
  difficultySelect.classList.add('hidden');
  knowModal.classList.remove('active');
  tutorialOverlay.classList.remove('active');
  gameBody.classList.remove('tutorial-active');
  stopSpeech();

  if (mode === 'ai') {
    const label = aiDifficulty === DIFFICULTY.easy ? 'Easy'
                : aiDifficulty === DIFFICULTY.hard ? 'Hard' : 'Medium';
    modeLabel.textContent = `vs AI (${label})`;
  } else {
    modeLabel.textContent = 'vs Friend';
  }

  showScreen(gameScreen);
  gameOverModal.classList.remove('active');

  renderer = new BoardRenderer(boardEl, game, handlePlayerMove);
  updateUI();
}

function startTutorial() {
  knowModal.classList.remove('active');

  game.reset();
  game.setMode(pendingMode || 'local');
  modeLabel.textContent = '';
  turnText.textContent = 'Tutorial';

  showScreen(gameScreen);
  renderer = new BoardRenderer(boardEl, game, () => {});
  renderer.setInteractionEnabled(false);
  renderer.render();

  gameBody.classList.add('tutorial-active');
  tutorialStep = 0;
  renderTutorialStep();
  tutorialOverlay.classList.add('active');
}

function clearTutorialMarkers() {
  document.querySelectorAll('.square.tutorial-highlight').forEach(sq => {
    sq.classList.remove('tutorial-highlight');
  });
  document.querySelectorAll('.square.tutorial-move').forEach(sq => {
    sq.classList.remove('tutorial-move');
  });
  document.querySelectorAll('.square.tutorial-capture').forEach(sq => {
    sq.classList.remove('tutorial-capture');
  });
}

function renderTutorialStep() {
  const step = TUTORIAL_STEPS[tutorialStep];

  tutorialTitle.textContent = step.title;
  tutorialText.textContent = step.text;

  tutorialPiecePreview.innerHTML = '';
  for (const type of step.pieceImgs) {
    const def = PIECE_TYPES[type];
    if (def && def.img) {
      const img = document.createElement('img');
      img.src = def.img.white;
      img.alt = def.name;
      tutorialPiecePreview.appendChild(img);
    }
  }

  tutorialDots.innerHTML = '';
  for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
    const dot = document.createElement('span');
    dot.classList.add('tutorial-dot');
    if (i === tutorialStep) dot.classList.add('active');
    tutorialDots.appendChild(dot);
  }

  btnTutBack.style.visibility = tutorialStep === 0 ? 'hidden' : 'visible';

  const isLast = tutorialStep === TUTORIAL_STEPS.length - 1;
  btnTutNext.textContent = isLast ? "Let's Play!" : 'Next';

  clearTutorialMarkers();

  for (const [row, col] of step.highlights) {
    const sq = boardEl.children[row * 8 + col];
    if (sq) sq.classList.add('tutorial-highlight');
  }

  const board = game.getCurrentBoard();
  for (const [row, col] of step.highlights) {
    const piece = board[row][col];
    if (!piece) continue;
    const moves = getRawMoves(row, col, board);
    for (const move of moves) {
      const sq = boardEl.children[move.row * 8 + move.col];
      if (!sq) continue;
      sq.classList.add(move.capture ? 'tutorial-capture' : 'tutorial-move');
    }
  }

  stopSpeech();
}

function nextTutorialStep() {
  if (tutorialStep < TUTORIAL_STEPS.length - 1) {
    tutorialStep++;
    renderTutorialStep();
  } else {
    tutorialOverlay.classList.remove('active');
    gameBody.classList.remove('tutorial-active');
    clearTutorialMarkers();
    stopSpeech();
    startGame(pendingMode || 'local');
  }
}

function prevTutorialStep() {
  if (tutorialStep > 0) {
    tutorialStep--;
    renderTutorialStep();
  }
}

function speakText() {
  if (!window.speechSynthesis) return;

  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
    btnSpeak.classList.remove('speaking');
    return;
  }

  const step = TUTORIAL_STEPS[tutorialStep];
  const utterance = new SpeechSynthesisUtterance(step.text);
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  utterance.onstart = () => btnSpeak.classList.add('speaking');
  utterance.onend = () => btnSpeak.classList.remove('speaking');
  utterance.onerror = () => btnSpeak.classList.remove('speaking');

  speechSynthesis.speak(utterance);
}

function stopSpeech() {
  if (window.speechSynthesis && speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  btnSpeak.classList.remove('speaking');
}

function handlePlayerMove(fromRow, fromCol, toRow, toCol) {
  const result = game.makeMove(fromRow, fromCol, toRow, toCol);
  if (!result) return;

  renderer.clearSelection();
  updateUI();

  if (result.status.over) {
    setTimeout(() => showGameOver(result.status), 600);
    return;
  }

  if (game.isAITurn()) {
    renderer.setInteractionEnabled(false);
    setTimeout(doAIMove, 400);
  }
}

function doAIMove() {
  const move = getAIMove(game.getCurrentBoard(), aiDifficulty.depth, aiDifficulty.randomness);
  if (!move) {
    renderer.setInteractionEnabled(true);
    return;
  }

  const result = game.makeMove(move.fromRow, move.fromCol, move.row, move.col);
  renderer.clearSelection();
  updateUI();
  renderer.setInteractionEnabled(true);

  if (result && result.status.over) {
    setTimeout(() => showGameOver(result.status), 600);
  }
}

function updateUI() {
  renderer.render();
  updateTurnIndicator();
  updateCapturedPieces();
}

function updateTurnIndicator() {
  const isBlack = game.turn === 'black';
  turnText.textContent = isBlack ? "Black's Turn" : "White's Turn";
  turnIndicator.classList.toggle('black-turn', isBlack);
}

function updateCapturedPieces() {
  capturedWhitePieces.innerHTML = '';
  capturedBlackPieces.innerHTML = '';

  for (const piece of game.capturedPieces.white) {
    const def = PIECE_TYPES[piece.type];
    if (def && def.img) {
      const img = document.createElement('img');
      img.src = def.img[piece.color];
      img.alt = def.name;
      img.title = def.name;
      img.classList.add('captured-icon');
      capturedWhitePieces.appendChild(img);
    }
  }

  for (const piece of game.capturedPieces.black) {
    const def = PIECE_TYPES[piece.type];
    if (def && def.img) {
      const img = document.createElement('img');
      img.src = def.img[piece.color];
      img.alt = def.name;
      img.title = def.name;
      img.classList.add('captured-icon');
      capturedBlackPieces.appendChild(img);
    }
  }
}

function showGameOver(status) {
  gameOverModal.classList.add('active');

  if (status.result === 'king_captured' || status.result === 'king_trapped') {
    const winnerName = status.winner === 'white' ? 'White' : 'Black';
    gameOverTitle.textContent = 'The King Has Fallen!';
    gameOverMessage.textContent = `${winnerName} conquers the False Kingdom!`;
  } else if (status.result === 'draw_kings_only') {
    gameOverTitle.textContent = 'A Standoff!';
    gameOverMessage.textContent = 'Only Dragons remain. Neither can defeat the other. It\'s a draw!';
  }
}

// --- Menu button wiring ---

btnVsFriend.addEventListener('click', () => {
  difficultySelect.classList.add('hidden');
  pendingMode = 'local';
  askIfKnowsRules('local');
});

btnVsAI.addEventListener('click', () => {
  difficultySelect.classList.toggle('hidden');
});

btnEasy.addEventListener('click', () => {
  aiDifficulty = DIFFICULTY.easy;
  difficultySelect.classList.add('hidden');
  askIfKnowsRules('ai');
});
btnMedium.addEventListener('click', () => {
  aiDifficulty = DIFFICULTY.medium;
  difficultySelect.classList.add('hidden');
  askIfKnowsRules('ai');
});
btnHard.addEventListener('click', () => {
  aiDifficulty = DIFFICULTY.hard;
  difficultySelect.classList.add('hidden');
  askIfKnowsRules('ai');
});

// --- Know modal wiring ---

btnIKnow.addEventListener('click', () => {
  knowModal.classList.remove('active');
  startGame(pendingMode || 'local');
});

btnTeachMe.addEventListener('click', () => {
  startTutorial();
});

// --- Tutorial nav wiring ---

btnTutNext.addEventListener('click', nextTutorialStep);
btnTutBack.addEventListener('click', prevTutorialStep);
btnSpeak.addEventListener('click', speakText);

// --- Other buttons ---

btnBack.addEventListener('click', () => {
  stopSpeech();
  tutorialOverlay.classList.remove('active');
  gameBody.classList.remove('tutorial-active');
  clearTutorialMarkers();
  showScreen(menuScreen);
  gameOverModal.classList.remove('active');
});

btnPlayAgain.addEventListener('click', () => {
  startGame(game.mode);
});

btnMainMenu.addEventListener('click', () => {
  showScreen(menuScreen);
  gameOverModal.classList.remove('active');
});
