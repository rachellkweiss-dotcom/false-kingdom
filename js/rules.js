import { PIECE_TYPES } from './pieces.js';
import { inBounds, deepCloneBoard, oppositeColor, WHITE, BLACK } from './utils.js';

export function getRawMoves(row, col, board) {
  const piece = board[row][col];
  if (!piece) return [];
  const def = PIECE_TYPES[piece.type];
  if (!def) return [];
  return def.getMoves(row, col, board, piece.color);
}

export function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'king' && p.color === color) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

export function isSquareAttacked(board, row, col, byColor) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== byColor) continue;
      const moves = getRawMoves(r, c, board);
      if (moves.some(m => m.row === row && m.col === col)) {
        return true;
      }
    }
  }
  return false;
}

export function isKingInDanger(board, color) {
  const king = findKing(board, color);
  if (!king) return true;
  return isSquareAttacked(board, king.row, king.col, oppositeColor(color));
}

export function simulateMove(board, fromRow, fromCol, toRow, toCol) {
  const clone = deepCloneBoard(board);
  const piece = { ...clone[fromRow][fromCol], hasMoved: true };
  clone[toRow][toCol] = piece;
  clone[fromRow][fromCol] = null;

  if (piece.type === 'servant') {
    const promoRow = piece.color === WHITE ? 0 : 7;
    if (toRow === promoRow) {
      clone[toRow][toCol] = { type: 'transformed', color: piece.color, hasMoved: true };
    }
  }

  return clone;
}

export function getLegalMoves(row, col, board) {
  const piece = board[row][col];
  if (!piece) return [];

  const raw = getRawMoves(row, col, board);
  const legal = [];

  for (const move of raw) {
    if (piece.type === 'king') {
      const target = board[move.row][move.col];
      if (target && target.type === 'king') continue;
    }

    const simulated = simulateMove(board, row, col, move.row, move.col);
    if (!isKingInDanger(simulated, piece.color)) {
      legal.push(move);
    }
  }

  return legal;
}

export function getAllLegalMoves(board, color) {
  const allMoves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color) {
        const moves = getLegalMoves(r, c, board);
        for (const m of moves) {
          allMoves.push({ fromRow: r, fromCol: c, ...m });
        }
      }
    }
  }
  return allMoves;
}

export function getGameStatus(board, currentTurn) {
  const king = findKing(board, currentTurn);
  if (!king) {
    return { over: true, result: 'king_captured', winner: oppositeColor(currentTurn) };
  }

  let hasNonKing = false;
  for (let r = 0; r < 8 && !hasNonKing; r++) {
    for (let c = 0; c < 8 && !hasNonKing; c++) {
      const p = board[r][c];
      if (p && p.type !== 'king') hasNonKing = true;
    }
  }
  if (!hasNonKing) {
    return { over: true, result: 'draw_kings_only', winner: null };
  }

  const moves = getAllLegalMoves(board, currentTurn);
  const inDanger = isKingInDanger(board, currentTurn);

  if (moves.length === 0) {
    if (inDanger) {
      return { over: true, result: 'king_trapped', winner: oppositeColor(currentTurn) };
    }
    return { over: true, result: 'stalemate', winner: null };
  }

  return { over: false, inCheck: inDanger };
}
