export const WHITE = 'white';
export const BLACK = 'black';

export function inBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

export function isGreenSquare(row, col) {
  return (row + col) % 2 === 1;
}

export function deepCloneBoard(board) {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

export function oppositeColor(color) {
  return color === WHITE ? BLACK : WHITE;
}
