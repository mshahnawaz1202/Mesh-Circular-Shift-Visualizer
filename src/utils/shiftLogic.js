/**
 * shiftLogic.js — Pure shift algorithm module (testable)
 * Implements circular q-shift on a 2D mesh topology.
 *
 * A circular q-shift: node i sends its data to node (i + q) mod p
 * On a √p × √p mesh:
 *   Stage 1 (Row Shift):    shift right by (q mod √p) within each row
 *   Stage 2 (Column Shift): shift down by ⌊q / √p⌋ within each column
 */

/**
 * Returns the side length of the mesh (√p).
 * @param {number} p - Total number of nodes (must be a perfect square)
 * @returns {number} side length
 */
export function getSide(p) {
  return Math.round(Math.sqrt(p));
}

/**
 * Validates whether a number is a perfect square.
 * @param {number} n
 * @returns {boolean}
 */
export function isPerfectSquare(n) {
  const s = Math.round(Math.sqrt(n));
  return s * s === n;
}

/**
 * Initialise an array of p nodes, each holding its own index as data.
 * Node i starts with data value i.
 * @param {number} p
 * @returns {number[]} array of length p
 */
export function initNodes(p) {
  return Array.from({ length: p }, (_, i) => i);
}

/**
 * Convert flat node index to [row, col] on a side×side mesh.
 * @param {number} idx
 * @param {number} side
 * @returns {[number, number]}
 */
export function indexToRC(idx, side) {
  return [Math.floor(idx / side), idx % side];
}

/**
 * Convert [row, col] to flat index.
 * @param {number} row
 * @param {number} col
 * @param {number} side
 * @returns {number}
 */
export function rcToIndex(row, col, side) {
  return row * side + col;
}

/**
 * Compute shift parameters for given p and q.
 * @param {number} p - total nodes
 * @param {number} q - shift amount
 * @returns {{ side: number, rowShift: number, colShift: number, ringSteps: number, meshSteps: number }}
 */
export function computeShiftParams(p, q) {
  const side = getSide(p);
  const rowShift = q % side;          // Stage 1: shift right by this in each row
  const colShift = Math.floor(q / side); // Stage 2: shift down by this in each column
  const ringSteps = Math.min(q, p - q);  // Naive ring shift best case
  const meshSteps = rowShift + colShift; // Mesh total steps
  return { side, rowShift, colShift, ringSteps, meshSteps };
}

/**
 * Apply Stage 1 — Row Shift.
 * Each row independently shifts right by rowShift positions (circular within row).
 * @param {number[]} data - current flat data array of length p
 * @param {number} side
 * @param {number} rowShift
 * @returns {number[]} new data array after row shift
 */
export function applyRowShift(data, side, rowShift) {
  const result = new Array(side * side);
  for (let r = 0; r < side; r++) {
    for (let c = 0; c < side; c++) {
      // data at (r, c) moves to (r, (c + rowShift) mod side)
      const srcIdx = rcToIndex(r, c, side);
      const dstCol = (c + rowShift) % side;
      const dstIdx = rcToIndex(r, dstCol, side);
      result[dstIdx] = data[srcIdx];
    }
  }
  return result;
}

/**
 * Apply Stage 2 — Column Shift.
 * Each column independently shifts down by colShift positions (circular within column).
 * @param {number[]} data - current flat data array after Stage 1
 * @param {number} side
 * @param {number} colShift
 * @returns {number[]} new data array after column shift
 */
export function applyColShift(data, side, colShift, rowShift) {
  const result = new Array(side * side);
  for (let c = 0; c < side; c++) {
    // Columns that wrapped around in Stage 1 need an extra shift (+1)
    const currentColShift = c < rowShift ? colShift + 1 : colShift;
    
    for (let r = 0; r < side; r++) {
      // data at (r, c) moves to ((r + currentColShift) mod side, c)
      const srcIdx = rcToIndex(r, c, side);
      const dstRow = (r + currentColShift) % side;
      const dstIdx = rcToIndex(dstRow, c, side);
      result[dstIdx] = data[srcIdx];
    }
  }
  return result;
}

/**
 * Compute the complete shift producing all three states:
 * initial → after row shift → after column shift (final).
 * Also verifies final result matches the direct formula node (i+q) mod p.
 * @param {number} p
 * @param {number} q
 * @returns {{ initial: number[], afterRow: number[], afterCol: number[], params: object, valid: boolean }}
 */
export function computeFullShift(p, q) {
  const params = computeShiftParams(p, q);
  const { side, rowShift, colShift } = params;

  const initial = initNodes(p);
  const afterRow = applyRowShift(initial, side, rowShift);
  const afterCol = applyColShift(afterRow, side, colShift, rowShift);

  // Validate: afterCol[i] should equal (i + q) % p when initial[i] = i
  const valid = afterCol.every((val, dst) => {
    // dst should receive data from src = (dst - q + p) % p
    const expectedSrc = ((dst - q) % p + p) % p;
    return val === expectedSrc;
  });

  return { initial, afterRow, afterCol, params, valid };
}

/**
 * Build row-shift arrow map: { fromNodeIdx: toNodeIdx } for Stage 1.
 * @param {number} p
 * @param {number} side
 * @param {number} rowShift
 * @returns {Object}
 */
export function buildRowArrows(p, side, rowShift) {
  const arrows = {};
  for (let i = 0; i < p; i++) {
    const [r, c] = indexToRC(i, side);
    const dstCol = (c + rowShift) % side;
    const dst = rcToIndex(r, dstCol, side);
    if (i !== dst) arrows[i] = dst;
  }
  return arrows;
}

/**
 * Build col-shift arrow map: { fromNodeIdx: toNodeIdx } for Stage 2.
 * @param {number} p
 * @param {number} side
 * @param {number} colShift
 * @returns {Object}
 */
export function buildColArrows(p, side, colShift, rowShift) {
  const arrows = {};
  for (let c = 0; c < side; c++) {
    const currentColShift = c < rowShift ? colShift + 1 : colShift;
    for (let r = 0; r < side; r++) {
      const i = rcToIndex(r, c, side);
      const dstRow = (r + currentColShift) % side;
      const dst = rcToIndex(dstRow, c, side);
      if (i !== dst) arrows[i] = dst;
    }
  }
  return arrows;
}
