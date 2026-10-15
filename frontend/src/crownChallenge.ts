/** Frontend-only crown placement logic. Coordinates are zero-based. */
export type BoardSize = 4 | 8
export type CrownCoordinate = Readonly<{row: number; column: number}>
export type CrownBoard = Readonly<{size: BoardSize; crowns: readonly CrownCoordinate[]}>
export type ConflictType = 'duplicate' | 'row' | 'column' | 'diagonal'
export type CrownConflict = Readonly<{
  /** Indices into the board's crowns, including distinct duplicate entries. */
  indices: readonly [number, number]
  types: readonly ConflictType[]
}>
export type BoardAnalysis = Readonly<{
  invalidIndices: readonly number[]
  conflicts: readonly CrownConflict[]
  conflictingIndices: readonly number[]
  tooManyCrowns: boolean
  complete: boolean
}>
export type CrownHint =
  | Readonly<{status: 'invalid'; invalidIndices: readonly number[]; tooManyCrowns: boolean}>
  | Readonly<{status: 'conflict'; conflicts: readonly CrownConflict[]; conflictingIndices: readonly number[]}>
  | Readonly<{status: 'unsolvable'}>
  | Readonly<{status: 'complete'}>
  | Readonly<{status: 'move'; coordinate: CrownCoordinate}>

export function isBoardSize(value: unknown): value is BoardSize {
  return value === 4 || value === 8
}

function assertBoardSize(size: BoardSize) {
  if (!isBoardSize(size)) throw new RangeError('Crown Challenge supports only 4×4 and 8×8 boards.')
}

export function isValidCoordinate(coordinate: unknown, size: BoardSize): coordinate is CrownCoordinate {
  assertBoardSize(size)
  if (typeof coordinate !== 'object' || coordinate === null) return false
  const position = coordinate as Partial<CrownCoordinate>
  return typeof position.row === 'number' && typeof position.column === 'number' &&
    Number.isInteger(position.row) && Number.isInteger(position.column) &&
    position.row >= 0 && position.row < size && position.column >= 0 && position.column < size
}

function snapshot(size: BoardSize, crowns: readonly CrownCoordinate[]): CrownBoard {
  // Copy coordinates before freezing so caller-owned input is never frozen or retained.
  return Object.freeze({size, crowns: Object.freeze(crowns.map(position => Object.freeze({row: position.row, column: position.column})))})
}

/** Apprentice Trial is the default; Royal Trial must be selected explicitly. */
export function createEmptyBoard(size: BoardSize = 4): CrownBoard {
  assertBoardSize(size)
  return snapshot(size, [])
}

function sameSquare(left: CrownCoordinate, right: CrownCoordinate) {
  return left.row === right.row && left.column === right.column
}

/** Conflicts are allowed during play. Occupied squares are a no-op; capacity is N. */
export function addCrown(board: CrownBoard, coordinate: CrownCoordinate): CrownBoard {
  assertBoardSize(board.size)
  if (!isValidCoordinate(coordinate, board.size)) throw new RangeError('Crown coordinate is outside the board or is not an integer.')
  if (board.crowns.some(position => sameSquare(position, coordinate))) return board
  if (board.crowns.length >= board.size) throw new RangeError('Remove a crown before placing another: this board already has N crowns.')
  return snapshot(board.size, [...board.crowns, coordinate])
}

/** Removing an empty square is a no-op. Never modifies the original board. */
export function removeCrown(board: CrownBoard, coordinate: CrownCoordinate): CrownBoard {
  assertBoardSize(board.size)
  if (!isValidCoordinate(coordinate, board.size)) throw new RangeError('Crown coordinate is outside the board or is not an integer.')
  const crowns = board.crowns.filter(position => !sameSquare(position, coordinate))
  return crowns.length === board.crowns.length ? board : snapshot(board.size, crowns)
}

/** Reset also supports explicit difficulty changes; placements never carry across sizes. */
export function resetBoard(board: CrownBoard, size: BoardSize = board.size): CrownBoard {
  return createEmptyBoard(size)
}

/** Invalid coordinates are reported by analyzeBoard, never treated as board geometry. */
export function getConflicts(board: CrownBoard): readonly CrownConflict[] {
  assertBoardSize(board.size)
  const conflicts: CrownConflict[] = []
  for (let first = 0; first < board.crowns.length; first++) {
    const left = board.crowns[first]
    if (!isValidCoordinate(left, board.size)) continue
    for (let second = first + 1; second < board.crowns.length; second++) {
      const right = board.crowns[second]
      if (!isValidCoordinate(right, board.size)) continue
      const types: ConflictType[] = []
      if (sameSquare(left, right)) types.push('duplicate')
      if (left.row === right.row) types.push('row')
      if (left.column === right.column) types.push('column')
      if (Math.abs(left.row - right.row) === Math.abs(left.column - right.column)) types.push('diagonal')
      if (types.length) conflicts.push(Object.freeze({indices: Object.freeze([first, second] as const), types: Object.freeze(types)}))
    }
  }
  return Object.freeze(conflicts)
}

export function getRowConflicts(board: CrownBoard): readonly CrownConflict[] {
  return Object.freeze(getConflicts(board).filter(conflict => conflict.types.includes('row')))
}

export function getColumnConflicts(board: CrownBoard): readonly CrownConflict[] {
  return Object.freeze(getConflicts(board).filter(conflict => conflict.types.includes('column')))
}

export function getDiagonalConflicts(board: CrownBoard): readonly CrownConflict[] {
  return Object.freeze(getConflicts(board).filter(conflict => conflict.types.includes('diagonal')))
}

export function analyzeBoard(board: CrownBoard): BoardAnalysis {
  assertBoardSize(board.size)
  const invalidIndices = board.crowns.flatMap((coordinate, index) => isValidCoordinate(coordinate, board.size) ? [] : [index])
  const conflicts = getConflicts(board)
  const conflictingIndices = [...new Set(conflicts.flatMap(conflict => [...conflict.indices]))].sort((left, right) => left - right)
  return Object.freeze({
    invalidIndices: Object.freeze(invalidIndices), conflicts, conflictingIndices: Object.freeze(conflictingIndices),
    tooManyCrowns: board.crowns.length > board.size,
    complete: board.crowns.length === board.size && invalidIndices.length === 0 && conflicts.length === 0,
  })
}

export function getConflictingPlacements(board: CrownBoard): readonly CrownCoordinate[] {
  return Object.freeze(analyzeBoard(board).conflictingIndices.map(index => Object.freeze({row: board.crowns[index].row, column: board.crowns[index].column})))
}

export function isPuzzleComplete(board: CrownBoard): boolean {
  return analyzeBoard(board).complete
}

// Search rows and columns in ascending order, keeping every existing crown fixed.
// A full solution remains private: the public hint reveals just one new square.
function findCompletion(board: CrownBoard): readonly number[] | undefined {
  const fixed = new Map(board.crowns.map(position => [position.row, position.column]))
  const columns = new Set<number>()
  const descending = new Set<number>()
  const ascending = new Set<number>()
  const solution: number[] = []

  function search(row: number): boolean {
    if (row === board.size) return true
    const fixedColumn = fixed.get(row)
    for (let column = 0; column < board.size; column++) {
      if (fixedColumn !== undefined && column !== fixedColumn) continue
      const down = row - column, up = row + column
      if (columns.has(column) || descending.has(down) || ascending.has(up)) continue
      solution[row] = column
      columns.add(column); descending.add(down); ascending.add(up)
      if (search(row + 1)) return true
      columns.delete(column); descending.delete(down); ascending.delete(up)
    }
    return false
  }

  return search(0) ? solution : undefined
}

export function getHint(board: CrownBoard): CrownHint {
  const analysis = analyzeBoard(board)
  if (analysis.invalidIndices.length || analysis.tooManyCrowns) return Object.freeze({status: 'invalid', invalidIndices: analysis.invalidIndices, tooManyCrowns: analysis.tooManyCrowns})
  if (analysis.conflicts.length) return Object.freeze({status: 'conflict', conflicts: analysis.conflicts, conflictingIndices: analysis.conflictingIndices})
  if (analysis.complete) return Object.freeze({status: 'complete'})
  const solution = findCompletion(board)
  if (!solution) return Object.freeze({status: 'unsolvable'})
  const row = solution.findIndex((_, index) => !board.crowns.some(position => position.row === index))
  return Object.freeze({status: 'move', coordinate: Object.freeze({row, column: solution[row]})})
}

/** Only legal, conflict-free partial arrangements can have this status. */
export function isUnsolvablePartial(board: CrownBoard): boolean {
  return getHint(board).status === 'unsolvable'
}
