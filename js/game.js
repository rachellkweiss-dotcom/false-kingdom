import { getInitialBoard } from './pieces.js';
import { getLegalMoves, getGameStatus } from './rules.js';
import { oppositeColor, WHITE, BLACK } from './utils.js';

export class Game {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = getInitialBoard();
    this.turn = WHITE;
    this.history = [];
    this.capturedPieces = { [WHITE]: [], [BLACK]: [] };
    this.status = { over: false, inCheck: false };
    this.lastMove = null;
    this.mode = 'local';
  }

  setMode(mode) {
    this.mode = mode;
  }

  getLegalMovesAt(row, col) {
    const piece = this.board[row][col];
    if (!piece || piece.color !== this.turn) return [];
    return getLegalMoves(row, col, this.board);
  }

  makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = this.board[fromRow][fromCol];
    if (!piece || piece.color !== this.turn) return null;

    const legal = this.getLegalMovesAt(fromRow, fromCol);
    const move = legal.find(m => m.row === toRow && m.col === toCol);
    if (!move) return null;

    const captured = this.board[toRow][toCol];

    this.history.push({
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      piece: { ...piece },
      captured: captured ? { ...captured } : null,
      boardSnapshot: this.board.map(r => r.map(c => c ? { ...c } : null)),
    });

    this.board[toRow][toCol] = { ...piece, hasMoved: true };
    this.board[fromRow][fromCol] = null;

    if (piece.type === 'servant') {
      const promoRow = piece.color === WHITE ? 0 : 7;
      if (toRow === promoRow) {
        this.board[toRow][toCol] = { type: 'transformed', color: piece.color, hasMoved: true };
      }
    }

    if (captured) {
      this.capturedPieces[piece.color].push(captured);
    }

    this.lastMove = { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
    this.turn = oppositeColor(this.turn);
    this.status = getGameStatus(this.board, this.turn);

    return {
      captured,
      status: this.status,
    };
  }

  isAITurn() {
    return this.mode === 'ai' && this.turn === BLACK && !this.status.over;
  }

  getCurrentBoard() {
    return this.board;
  }

  getStatus() {
    return this.status;
  }
}
