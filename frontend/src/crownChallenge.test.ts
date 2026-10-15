import {describe, expect, it} from 'vitest'
import {
  addCrown, analyzeBoard, createEmptyBoard, getColumnConflicts, getConflictingPlacements,
  getConflicts, getDiagonalConflicts, getHint, getRowConflicts, isBoardSize,
  isPuzzleComplete, isUnsolvablePartial, isValidCoordinate, removeCrown, resetBoard,
  type BoardSize, type CrownBoard, type CrownCoordinate,
} from './crownChallenge'

function board(size: BoardSize, columns: readonly number[]): CrownBoard {
  return columns.reduce((state, column, row) => addCrown(state, {row, column}), createEmptyBoard(size))
}

function partial(size: BoardSize, crowns: readonly CrownCoordinate[]): CrownBoard {
  return crowns.reduce((state, coordinate) => addCrown(state, coordinate), createEmptyBoard(size))
}

describe('Crown Challenge board state', () => {
  it('defaults to an empty 4×4 Apprentice Trial and creates an empty 8×8 Royal Trial explicitly', () => {
    expect(createEmptyBoard()).toEqual({size: 4, crowns: []})
    expect(createEmptyBoard(8)).toEqual({size: 8, crowns: []})
    expect(isPuzzleComplete(createEmptyBoard())).toBe(false)
  })

  it.each([4, 8] as const)('accepts only integer coordinates within a board of size %s', size => {
    expect(isValidCoordinate({row: 0, column: 0}, size)).toBe(true)
    expect(isValidCoordinate({row: size - 1, column: size - 1}, size)).toBe(true)
    for (const coordinate of [{row: -1, column: 0}, {row: size, column: 0}, {row: 0, column: size}, {row: 0, column: -1}, {row: .5, column: 1}, {row: 1, column: 1.5}, {row: NaN, column: 0}, {row: 0, column: Infinity}, {row: '0', column: 0}, {row: 0}, null, undefined]) {
      expect(isValidCoordinate(coordinate, size)).toBe(false)
    }
  })

  it.each([0, 1, 2, 3, 5, 7, 9, -4, 4.5, NaN, Infinity, '4', null])('rejects unsupported board size %s without coercion', size => {
    expect(isBoardSize(size)).toBe(false)
    expect(() => createEmptyBoard(size as BoardSize)).toThrow(RangeError)
  })

  it('rejects an invalid size in board analysis, editing, reset and hints', () => {
    const invalid = {size: 5, crowns: []} as unknown as CrownBoard
    expect(() => isValidCoordinate({row: 0, column: 0}, invalid.size)).toThrow(RangeError)
    expect(() => analyzeBoard(invalid)).toThrow(RangeError)
    expect(() => getConflicts(invalid)).toThrow(RangeError)
    expect(() => addCrown(invalid, {row: 0, column: 0})).toThrow(RangeError)
    expect(() => removeCrown(invalid, {row: 0, column: 0})).toThrow(RangeError)
    expect(() => resetBoard(invalid)).toThrow(RangeError)
    expect(() => getHint(invalid)).toThrow(RangeError)
  })

  it('adds and removes crowns with immutable updates, allowing conflicts during play', () => {
    const empty = createEmptyBoard()
    const first = addCrown(empty, {row: 0, column: 1})
    const conflict = addCrown(first, {row: 0, column: 3})
    const removed = removeCrown(conflict, {row: 0, column: 1})
    expect(empty.crowns).toEqual([])
    expect(first.crowns).toEqual([{row: 0, column: 1}])
    expect(conflict.crowns).toEqual([{row: 0, column: 1}, {row: 0, column: 3}])
    expect(removed.crowns).toEqual([{row: 0, column: 3}])
    expect(first).not.toBe(empty)
    expect(removed).not.toBe(conflict)
    expect(getRowConflicts(conflict)).toHaveLength(1)
  })

  it('treats occupied-square additions and empty-square removals as idempotent no-ops', () => {
    const state = partial(4, [{row: 0, column: 1}])
    expect(addCrown(state, {row: 0, column: 1})).toBe(state)
    expect(removeCrown(state, {row: 1, column: 3})).toBe(state)
    expect(state.crowns).toHaveLength(1)
  })

  it('rejects invalid placement and removal coordinates without changing the board', () => {
    const state = partial(4, [{row: 0, column: 1}])
    for (const coordinate of [{row: 4, column: 1}, {row: 0, column: -1}, {row: 1.5, column: 0}]) {
      expect(() => addCrown(state, coordinate)).toThrow(RangeError)
      expect(() => removeCrown(state, coordinate)).toThrow(RangeError)
    }
    expect(state.crowns).toEqual([{row: 0, column: 1}])
  })

  it('requires removal before adding more than N crowns, while allowing removal from a full board', () => {
    const full = board(4, [1, 3, 0, 2])
    expect(() => addCrown(full, {row: 0, column: 0})).toThrow(RangeError)
    expect(addCrown(full, {row: 0, column: 1})).toBe(full)
    const removed = removeCrown(full, {row: 0, column: 1})
    expect(addCrown(removed, {row: 0, column: 0}).crowns).toHaveLength(4)
    expect(isPuzzleComplete(removed)).toBe(false)
  })

  it('copies caller-owned coordinates and freezes generated snapshots without freezing the inputs', () => {
    const existing = {row: 0, column: 1}
    const selected = {row: 1, column: 3}
    const input: CrownBoard = {size: 4, crowns: [existing]}
    const state = addCrown(input, selected)
    existing.row = 3; selected.column = 0
    expect(state.crowns).toEqual([{row: 0, column: 1}, {row: 1, column: 3}])
    expect(Object.isFrozen(existing)).toBe(false)
    expect(Object.isFrozen(selected)).toBe(false)
    expect(Object.isFrozen(state)).toBe(true)
    expect(Object.isFrozen(state.crowns)).toBe(true)
    expect(state.crowns.every(Object.isFrozen)).toBe(true)
    expect(() => { (state.crowns[0] as {row: number}).row = 2 }).toThrow(TypeError)
  })

  it('resets a board while retaining size, with explicit size switches starting empty', () => {
    const apprentice = board(4, [1, 3, 0, 2])
    const reset = resetBoard(apprentice)
    expect(reset).toEqual({size: 4, crowns: []})
    const royal = addCrown(resetBoard(apprentice, 8), {row: 7, column: 7})
    expect(royal).toEqual({size: 8, crowns: [{row: 7, column: 7}]})
    expect(resetBoard(royal, 4)).toEqual({size: 4, crowns: []})
    expect(apprentice.crowns).toHaveLength(4)
    expect(royal.crowns).toHaveLength(1)
    expect(() => resetBoard(apprentice, 6 as BoardSize)).toThrow(RangeError)
  })
})

describe('Crown Challenge validation', () => {
  it.each([[1, 3, 0, 2], [2, 0, 3, 1]].map(columns => ({columns})))('accepts the 4×4 solution $columns', ({columns}) => {
    expect(isPuzzleComplete(board(4, columns))).toBe(true)
  })

  it.each([
    [0, 4, 7, 5, 2, 6, 1, 3], [0, 5, 7, 2, 6, 3, 1, 4],
    [0, 6, 3, 5, 7, 1, 4, 2], [7, 3, 0, 2, 5, 1, 6, 4],
  ].map(columns => ({columns})))('accepts the 8×8 solution $columns', ({columns}) => {
    expect(isPuzzleComplete(board(8, columns))).toBe(true)
  })

  it('identifies row, column and both diagonal directions without conflating safe pairs', () => {
    const row = partial(4, [{row: 0, column: 0}, {row: 0, column: 2}])
    const column = partial(4, [{row: 0, column: 1}, {row: 3, column: 1}])
    const down = partial(4, [{row: 0, column: 0}, {row: 2, column: 2}])
    const up = partial(4, [{row: 0, column: 3}, {row: 2, column: 1}])
    expect(getRowConflicts(row)[0].types).toEqual(['row'])
    expect(getColumnConflicts(column)[0].types).toEqual(['column'])
    expect(getDiagonalConflicts(down)[0].types).toEqual(['diagonal'])
    expect(getDiagonalConflicts(up)[0].types).toEqual(['diagonal'])
    expect(getConflicts(partial(4, [{row: 0, column: 1}, {row: 2, column: 0}]))).toEqual([])
    for (const state of [row, column, down, up]) expect(getHint(state).status).toBe('conflict')
  })

  it('identifies every conflicting placement and excludes unaffected crowns', () => {
    const state = partial(4, [{row: 0, column: 0}, {row: 0, column: 2}, {row: 3, column: 1}])
    expect(analyzeBoard(state).conflictingIndices).toEqual([0, 1])
    expect(getConflictingPlacements(state)).toEqual(state.crowns.slice(0, 2))
    const multiple = partial(4, [{row: 0, column: 0}, {row: 0, column: 2}, {row: 2, column: 2}, {row: 1, column: 3}])
    expect(getConflicts(multiple)).toHaveLength(5)
    expect(analyzeBoard(multiple).conflictingIndices).toEqual([0, 1, 2, 3])
  })

  it('rejects duplicate entries supplied outside the placement API, with explicit pair diagnostics', () => {
    const duplicate: CrownBoard = {size: 4, crowns: [{row: 0, column: 1}, {row: 0, column: 1}, {row: 2, column: 0}, {row: 3, column: 2}]}
    expect(isPuzzleComplete(duplicate)).toBe(false)
    expect(getConflicts(duplicate)).toContainEqual({indices: [0, 1], types: ['duplicate', 'row', 'column', 'diagonal']})
    const hint = getHint(duplicate)
    expect(hint.status).toBe('conflict')
    if (hint.status === 'conflict') expect(hint.conflictingIndices).toEqual([0, 1])
    expect(removeCrown(duplicate, {row: 0, column: 1}).crowns).toHaveLength(2)
  })

  it('rejects invalid coordinates and excess crowns in externally supplied boards', () => {
    const invalid: CrownBoard = {size: 4, crowns: [{row: 0, column: 1}, {row: 1, column: 3}, {row: 2, column: 0}, {row: 4, column: 2}]}
    expect(analyzeBoard(invalid).invalidIndices).toEqual([3])
    expect(isPuzzleComplete(invalid)).toBe(false)
    expect(getHint(invalid)).toEqual({status: 'invalid', invalidIndices: [3], tooManyCrowns: false})
    const excess: CrownBoard = {size: 4, crowns: [...board(4, [1, 3, 0, 2]).crowns, {row: 3, column: 3}]}
    expect(isPuzzleComplete(excess)).toBe(false)
    expect(getHint(excess)).toEqual({status: 'invalid', invalidIndices: [], tooManyCrowns: true})
  })

  it.each([4, 8] as const)('rejects partial and full conflicting boards of size %s', size => {
    expect(isPuzzleComplete(partial(size, [{row: 0, column: 1}]))).toBe(false)
    expect(isPuzzleComplete(board(size, Array.from({length: size}, (_, index) => index)))).toBe(false)
  })

  it('accepts exactly the two 4×4 and 92 8×8 solutions among all distinct-column arrangements', () => {
    function* permutations(values: readonly number[]): Generator<number[]> {
      if (values.length === 0) { yield []; return }
      for (const value of values) {
        for (const suffix of permutations(values.filter(candidate => candidate !== value))) yield [value, ...suffix]
      }
    }
    for (const [size, expected] of [[4, 2], [8, 92]] as const) {
      let count = 0
      for (const columns of permutations(Array.from({length: size}, (_, index) => index))) {
        const state: CrownBoard = {size, crowns: columns.map((column, row) => ({row, column}))}
        if (isPuzzleComplete(state)) count++
      }
      expect(count).toBe(expected)
    }
  })
})

describe('deterministic Crown Challenge hints', () => {
  it('returns one deterministic square, independently of insertion order, without exposing a solution', () => {
    const crowns = [{row: 1, column: 3}, {row: 3, column: 2}]
    const state = partial(4, crowns)
    const expected = {status: 'move', coordinate: {row: 0, column: 1}}
    expect(getHint(state)).toEqual(expected)
    expect(getHint(state)).toEqual(getHint(state))
    expect(getHint(partial(4, [...crowns].reverse()))).toEqual(expected)
    expect(getHint(createEmptyBoard())).toEqual(expected)
    expect(state.crowns).toEqual(crowns)
    expect(Object.keys(getHint(state))).toEqual(['status', 'coordinate'])
  })

  it.each([4, 8] as const)('produces a complete valid arrangement of size %s through one-square hints while preserving existing crowns', size => {
    const fixed = size === 4 ? {row: 3, column: 2} : {row: 7, column: 3}
    let state = partial(size, [fixed])
    for (let placed = 1; placed < size; placed++) {
      const previous = state
      const hint = getHint(state)
      expect(hint.status).toBe('move')
      if (hint.status !== 'move') throw new Error('Expected a viable next square')
      expect(isValidCoordinate(hint.coordinate, size)).toBe(true)
      expect(previous.crowns).toHaveLength(placed)
      state = addCrown(state, hint.coordinate)
      expect(state.crowns.slice(0, placed)).toEqual(previous.crowns)
      expect(state.crowns).toContainEqual(fixed)
      expect(getConflicts(state)).toEqual([])
      expect(isUnsolvablePartial(state)).toBe(false)
    }
    expect(isPuzzleComplete(state)).toBe(true)
    expect(getHint(state)).toEqual({status: 'complete'})
  })

  it.each([
    {size: 4 as const, crowns: [{row: 0, column: 0}]},
    {size: 8 as const, crowns: [{row: 0, column: 0}, {row: 1, column: 2}]},
  ])('detects a legal but unfinishable $size×$size partial arrangement without moving crowns', ({size, crowns}) => {
    const state = partial(size, crowns)
    expect(getConflicts(state)).toEqual([])
    expect(analyzeBoard(state).invalidIndices).toEqual([])
    expect(getHint(state)).toEqual({status: 'unsolvable'})
    expect(isUnsolvablePartial(state)).toBe(true)
    expect(state.crowns).toEqual(crowns)
  })

  it('distinguishes conflicts and invalid input from otherwise legal unsolvable partial arrangements', () => {
    const conflict = partial(4, [{row: 0, column: 0}, {row: 0, column: 1}])
    const invalid: CrownBoard = {size: 4, crowns: [{row: -1, column: 0}]}
    expect(getHint(conflict).status).toBe('conflict')
    expect(getHint(invalid).status).toBe('invalid')
    expect(isUnsolvablePartial(conflict)).toBe(false)
    expect(isUnsolvablePartial(invalid)).toBe(false)
    expect(isUnsolvablePartial(createEmptyBoard())).toBe(false)
    expect(isUnsolvablePartial(board(4, [1, 3, 0, 2]))).toBe(false)
  })
})
