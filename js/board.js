import { PIECE_TYPES } from './pieces.js';
import { findKing } from './rules.js';
import { isGreenSquare } from './utils.js';

export class BoardRenderer {
  constructor(boardEl, game, onMoveCallback) {
    this.boardEl = boardEl;
    this.game = game;
    this.onMove = onMoveCallback;
    this.selectedSquare = null;
    this.legalMoves = [];
    this.interactionEnabled = true;
    this.squares = [];

    this._buildGrid();
  }

  _buildGrid() {
    this.boardEl.innerHTML = '';
    this.squares = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('div');
        sq.classList.add('square');
        sq.classList.add(isGreenSquare(r, c) ? 'dark' : 'light');
        sq.dataset.row = r;
        sq.dataset.col = c;

        sq.addEventListener('click', () => this._handleClick(r, c));

        this.boardEl.appendChild(sq);
        this.squares.push(sq);
      }
    }
  }

  _getSquare(row, col) {
    return this.squares[row * 8 + col];
  }

  render() {
    const board = this.game.getCurrentBoard();
    const status = this.game.getStatus();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = this._getSquare(r, c);
        sq.innerHTML = '';
        sq.className = 'square ' + (isGreenSquare(r, c) ? 'dark' : 'light');

        const piece = board[r][c];
        if (piece) {
          const def = PIECE_TYPES[piece.type];
          if (def && def.img) {
            const img = document.createElement('img');
            img.classList.add('piece', 'piece-img');
            img.src = def.img[piece.color];
            img.alt = def.name;
            img.title = def.name;
            img.draggable = false;
            sq.appendChild(img);
          }
        }
      }
    }

    if (this.selectedSquare) {
      const { row, col } = this.selectedSquare;
      this._getSquare(row, col).classList.add('selected');
    }

    for (const move of this.legalMoves) {
      const sq = this._getSquare(move.row, move.col);
      sq.classList.add(move.capture ? 'capture-target' : 'move-target');
    }

    if (status.inCheck) {
      const king = findKing(board, this.game.turn);
      if (king) {
        this._getSquare(king.row, king.col).classList.add('in-check');
      }
    }

    if (this.game.lastMove) {
      const { from, to } = this.game.lastMove;
      this._getSquare(from.row, from.col).classList.add('last-move');
      this._getSquare(to.row, to.col).classList.add('last-move');
    }
  }

  _handleClick(row, col) {
    if (!this.interactionEnabled) return;

    const board = this.game.getCurrentBoard();

    if (this.selectedSquare) {
      const isLegalTarget = this.legalMoves.some(m => m.row === row && m.col === col);

      if (isLegalTarget) {
        const from = this.selectedSquare;
        this.clearSelection();
        this.onMove(from.row, from.col, row, col);
        return;
      }

      this.clearSelection();

      const piece = board[row][col];
      if (piece && piece.color === this.game.turn) {
        this._selectSquare(row, col);
      }
    } else {
      const piece = board[row][col];
      if (piece && piece.color === this.game.turn) {
        this._selectSquare(row, col);
      }
    }

    this.render();
  }

  _selectSquare(row, col) {
    this.selectedSquare = { row, col };
    this.legalMoves = this.game.getLegalMovesAt(row, col);
  }

  clearSelection() {
    this.selectedSquare = null;
    this.legalMoves = [];
  }

  setInteractionEnabled(enabled) {
    this.interactionEnabled = enabled;
  }
}
