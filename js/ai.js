import { PIECE_TYPES } from './pieces.js';
import { getAllLegalMoves, simulateMove, isKingInDanger, findKing } from './rules.js';
import { WHITE, BLACK } from './utils.js';

const POSITION_BONUS = {
  servant: [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [20, 20, 30, 30, 30, 30, 20, 20],
    [10, 10, 20, 25, 25, 20, 10, 10],
    [ 5,  5, 10, 20, 20, 10,  5,  5],
    [ 0,  0,  0, 10, 10,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
  ],
  king: [
    [-20,-20,-20,-20,-20,-20,-20,-20],
    [-20,-20,-20,-20,-20,-20,-20,-20],
    [-10,-10,-10,-10,-10,-10,-10,-10],
    [ -5, -5, -5, -5, -5, -5, -5, -5],
    [  0,  0,  5,  5,  5,  5,  0,  0],
    [  5, 10, 10, 10, 10, 10, 10,  5],
    [ 10, 15, 15,  5,  5, 15, 15, 10],
    [ 10, 20, 10,  0,  0, 10, 20, 10],
  ],
  saviour: [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  5,  5,  5,  5,  5,  5,  0],
    [ 0,  5, 10, 10, 10, 10,  5,  0],
    [ 0,  5, 10, 15, 15, 10,  5,  0],
    [ 0,  5, 10, 15, 15, 10,  5,  0],
    [ 0,  5, 10, 10, 10, 10,  5,  0],
    [ 0,  5,  5,  5,  5,  5,  5,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
  ],
};

function evaluateBoard(board) {
  let score = 0;

  const whiteKing = findKing(board, WHITE);
  const blackKing = findKing(board, BLACK);

  if (!whiteKing) return -99999;
  if (!blackKing) return 99999;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const def = PIECE_TYPES[piece.type];
      let value = def ? def.value : 0;

      const baseType = piece.type === 'transformed' ? 'saviour' : piece.type;
      const posTable = POSITION_BONUS[baseType];
      if (posTable) {
        const tableRow = piece.color === WHITE ? r : 7 - r;
        value += posTable[tableRow][c] * 0.1;
      }

      score += piece.color === WHITE ? value : -value;
    }
  }

  if (isKingInDanger(board, BLACK)) score += 30;
  if (isKingInDanger(board, WHITE)) score -= 30;

  return score;
}

function orderMoves(moves, board) {
  return [...moves].sort((a, b) => {
    let scoreA = 0, scoreB = 0;
    if (a.capture) {
      const target = board[a.row]?.[a.col];
      scoreA += 100 + (target?.type === 'king' ? 9000 : 0);
    }
    if (b.capture) {
      const target = board[b.row]?.[b.col];
      scoreB += 100 + (target?.type === 'king' ? 9000 : 0);
    }
    return scoreB - scoreA;
  });
}

function onlyKingsLeft(board) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] && board[r][c].type !== 'king') return false;
  return true;
}

function minimax(board, depth, alpha, beta, maximizing) {
  const currentColor = maximizing ? WHITE : BLACK;

  const whiteKing = findKing(board, WHITE);
  const blackKing = findKing(board, BLACK);
  if (!whiteKing) return { score: -99999 + (4 - depth), move: null };
  if (!blackKing) return { score: 99999 - (4 - depth), move: null };
  if (onlyKingsLeft(board)) return { score: 0, move: null };

  const moves = getAllLegalMoves(board, currentColor);

  if (depth === 0 || moves.length === 0) {
    if (moves.length === 0) {
      if (isKingInDanger(board, currentColor)) {
        return { score: maximizing ? -99999 + (4 - depth) : 99999 - (4 - depth), move: null };
      }
      return { score: 0, move: null };
    }
    return { score: evaluateBoard(board), move: null };
  }

  const ordered = orderMoves(moves, board);
  let bestMove = ordered[0];

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of ordered) {
      const newBoard = simulateMove(board, move.fromRow, move.fromCol, move.row, move.col);
      const result = minimax(newBoard, depth - 1, alpha, beta, false);
      if (result.score > maxEval) {
        maxEval = result.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, result.score);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of ordered) {
      const newBoard = simulateMove(board, move.fromRow, move.fromCol, move.row, move.col);
      const result = minimax(newBoard, depth - 1, alpha, beta, true);
      if (result.score < minEval) {
        minEval = result.score;
        bestMove = move;
      }
      beta = Math.min(beta, result.score);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
}

export function getAIMove(board, depth = 4, randomness = 0) {
  const result = minimax(board, depth, -Infinity, Infinity, false);

  if (randomness > 0 && Math.random() < randomness) {
    const moves = getAllLegalMoves(board, BLACK);
    if (moves.length > 0) {
      return moves[Math.floor(Math.random() * moves.length)];
    }
  }

  return result.move;
}
