import { inBounds, isGreenSquare, WHITE, BLACK } from './utils.js';

export const PIECE_TYPES = {
  king: {
    name: 'Dragon',
    value: 9999,
    img: { [WHITE]: 'img/dragon-white.svg', [BLACK]: 'img/dragon-black.svg' },
    getMoves(row, col, board, color) {
      const moves = [];
      const offsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ];
      for (const [dr, dc] of offsets) {
        const r = row + dr;
        const c = col + dc;
        if (!inBounds(r, c)) continue;
        const target = board[r][c];
        if (!target || target.color !== color) {
          moves.push({ row: r, col: c, capture: !!target });
        }
      }
      return moves;
    },
  },

  servant: {
    name: 'Shield Bearer',
    value: 10,
    img: { [WHITE]: 'img/shield-white.svg', [BLACK]: 'img/shield-black.svg' },
    getMoves(row, col, board, color) {
      const moves = [];
      const forward = color === WHITE ? -1 : 1;

      for (const dc of [-1, 0, 1]) {
        const r = row + forward;
        const c = col + dc;
        if (!inBounds(r, c)) continue;
        const target = board[r][c];
        if (!target || target.color !== color) {
          moves.push({ row: r, col: c, capture: !!target });
        }
      }

      const piece = board[row][col];
      if (piece && !piece.hasMoved) {
        const r2 = row + 2 * forward;
        if (inBounds(r2, col) && !board[row + forward][col]) {
          const target = board[r2][col];
          if (!target || target.color !== color) {
            moves.push({ row: r2, col, capture: !!target });
          }
        }

        for (const dc of [-1, 1]) {
          const r1 = row + forward;
          const c1 = col + dc;
          const r2d = row + 2 * forward;
          const c2 = col + 2 * dc;
          if (!inBounds(r2d, c2)) continue;
          if (!isGreenSquare(r2d, c2)) continue;
          const mid = board[r1]?.[c1];
          const target = board[r2d][c2];
          if (!target || target.color !== color) {
            if (!mid || mid.color !== color) {
              moves.push({ row: r2d, col: c2, capture: !!target });
            }
          }
        }
      }

      return moves;
    },
  },

  saviour: {
    name: 'Elven Archer',
    value: 40,
    img: { [WHITE]: 'img/archer-white.svg', [BLACK]: 'img/archer-black.svg' },
    getMoves(row, col, board, color) {
      const moves = [];
      const forward = color === WHITE ? -1 : 1;

      for (const dir of [[0, -1], [0, 1]]) {
        let r = row;
        let c = col + dir[1];
        while (inBounds(r, c)) {
          const target = board[r][c];
          if (target) {
            if (target.color !== color) {
              moves.push({ row: r, col: c, capture: true });
            }
            break;
          }
          if (isGreenSquare(r, c)) {
            moves.push({ row: r, col: c, capture: false });
          }
          c += dir[1];
        }
      }

      for (const vdir of [forward, -forward]) {
        let r = row + vdir;
        while (inBounds(r, col)) {
          const target = board[r][col];
          if (target) {
            if (target.color !== color) {
              moves.push({ row: r, col: col, capture: true });
            }
            break;
          }
          if (isGreenSquare(r, col)) {
            moves.push({ row: r, col: col, capture: false });
          }
          r += vdir;
        }
      }

      return moves;
    },
  },

  transformed: {
    name: 'Transformed',
    value: 70,
    img: { [WHITE]: 'img/transformed-white.svg', [BLACK]: 'img/transformed-black.svg' },
    getMoves(row, col, board, color) {
      const moves = [];
      const ownHalf = color === WHITE ? (r) => r >= 4 : (r) => r < 4;
      const onOwnSide = ownHalf(row);

      const offsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ];

      for (const [dr, dc] of offsets) {
        const r = row + dr;
        const c = col + dc;
        if (!inBounds(r, c)) continue;

        if (onOwnSide && !isGreenSquare(r, c)) continue;

        const target = board[r][c];
        if (!target || target.color !== color) {
          moves.push({ row: r, col: c, capture: !!target });
        }
      }
      return moves;
    },
  },
};

export function createPiece(type, color) {
  return { type, color, hasMoved: false };
}

export function getInitialBoard() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));

  board[7][0] = createPiece('servant', WHITE);
  board[7][2] = createPiece('king', WHITE);
  board[7][4] = createPiece('servant', WHITE);
  board[7][6] = createPiece('servant', WHITE);
  board[5][2] = createPiece('saviour', WHITE);

  board[0][7] = createPiece('servant', BLACK);
  board[0][5] = createPiece('king', BLACK);
  board[0][3] = createPiece('servant', BLACK);
  board[0][1] = createPiece('servant', BLACK);
  board[2][5] = createPiece('saviour', BLACK);

  return board;
}
