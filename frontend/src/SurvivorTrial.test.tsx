import {cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {SurvivorTrial} from './SurvivorTrial'
import {MiniGamePanel} from './MiniGamePanel'
import {miniGameData} from './mini-game-data'
const config = miniGameData['Broken Bridge'].choices[0].interaction
const cell = (row: number, path: number) => screen.getByRole('button', {name: new RegExp(`^Row ${row}, path ${path},`)})
const solve = (difficulty = 'easy') => (difficulty === 'easy' ? [2, 2, 2] : [2, 2, 1, 1, 2]).forEach((path, step) => fireEvent.click(cell(step + 2, path)))
afterEach(cleanup)
const setup = () => {
  const onReadinessChange = vi.fn()
  return {...render(<SurvivorTrial config={config} onReadinessChange={onReadinessChange}/>), onReadinessChange}
}
describe('Survivor’s Trial', () => {
  it.each(['easy', 'medium', 'hard'])('completes %s without confirming an adventure', difficulty => {
    const {onReadinessChange} = setup()
    fireEvent.change(screen.getByLabelText('Difficulty'), {target: {value: difficulty}})
    solve(difficulty)
    expect(screen.getByRole('status')).toHaveTextContent('Trial complete')
    expect(screen.getByRole('status')).toHaveTextContent('not yet confirmed')
    expect(onReadinessChange.mock.lastCall?.[0]).toBe(true)
  })
  it('shows clear start, destination, current survivor, reachable paths and local progress', () => {
    setup()
    expect(screen.getByRole('grid')).toHaveAccessibleName('easy survival map')
    expect(cell(1, 2)).toHaveAttribute('aria-current', 'location')
    expect(cell(4, 2)).toHaveAccessibleName(/the far bank/)
    fireEvent.click(cell(2, 2))
    expect(cell(2, 2)).toHaveAttribute('aria-current', 'location')
    expect(cell(1, 2)).not.toHaveAttribute('aria-current')
    expect(screen.getByLabelText('Trial progress')).toHaveTextContent('Crossings 1/3')
  })
  it('rejects jumping ahead and describes nearby movement', () => {
    const {onReadinessChange} = setup(); fireEvent.click(cell(4, 2))
    expect(screen.getByRole('status')).toHaveTextContent('cannot jump ahead')
    expect(onReadinessChange.mock.lastCall?.[0]).toBe(false)
  })
  it('detects thematic hazards without moving the Chog', () => {
    setup(); fireEvent.change(screen.getByLabelText('Difficulty'), {target: {value: 'medium'}})
    expect(cell(2, 3)).toHaveAccessibleName(/broken planks/)
    fireEvent.click(cell(2, 3))
    expect(screen.getByRole('status')).toHaveTextContent('Hazard!')
    expect(cell(1, 2)).toHaveAttribute('aria-current', 'location')
    expect(screen.getByLabelText('Trial progress')).toHaveTextContent('Hazards 1')
  })
  it('exhausts hard supplies, blocks success, and retries with seven supplies', () => {
    const {onReadinessChange} = setup()
    fireEvent.change(screen.getByLabelText('Difficulty'), {target: {value: 'hard'}})
    for (let i = 0; i < 4; i++) fireEvent.click(cell(2, 3))
    expect(screen.getByRole('status')).toHaveTextContent('Supplies exhausted')
    expect(screen.getByLabelText('Trial progress')).toHaveTextContent('Trial supplies 0/7')
    fireEvent.click(cell(2, 2))
    expect(onReadinessChange.mock.lastCall?.[0]).toBe(false)
    fireEvent.click(screen.getByRole('button', {name: 'Retry'}))
    expect(screen.getByLabelText('Trial progress')).toHaveTextContent('Trial supplies 7/7')
    solve('hard'); expect(onReadinessChange.mock.lastCall?.[0]).toBe(true)
  })
  it.each(['Reset', 'Retry'])('%s clears readiness, route and hazard counters', control => {
    const {onReadinessChange} = setup(); solve()
    fireEvent.click(screen.getByRole('button', {name: control}))
    expect(cell(1, 2)).toHaveAttribute('aria-current', 'location')
    expect(screen.getByLabelText('Trial progress')).toHaveTextContent('Crossings 0/3')
    expect(onReadinessChange.mock.lastCall?.[0]).toBe(false)
  })
  it('resets state on difficulty changes', () => {
    const {onReadinessChange} = setup(); solve()
    fireEvent.change(screen.getByLabelText('Difficulty'), {target: {value: 'hard'}})
    expect(onReadinessChange.mock.lastCall?.[0]).toBe(false)
    expect(screen.getByLabelText('Trial progress')).toHaveTextContent('Crossings 0/5')
    expect(screen.getByLabelText('Trial progress')).toHaveTextContent('Trial supplies 7/7')
  })
  it('uses a single Tab stop, arrow navigation, Home/End and meaningful live feedback', () => {
    setup(); const grid = screen.getByRole('grid')
    expect(within(grid).getAllByRole('button').filter(button => button.tabIndex === 0)).toHaveLength(1)
    cell(1, 2).focus(); fireEvent.keyDown(cell(1, 2), {key: 'ArrowDown'})
    expect(cell(2, 2)).toHaveFocus()
    fireEvent.keyDown(cell(2, 2), {key: 'ArrowRight'}); expect(cell(2, 3)).toHaveFocus()
    fireEvent.keyDown(cell(2, 3), {key: 'Home'}); expect(cell(2, 1)).toHaveFocus()
    fireEvent.keyDown(cell(2, 1), {key: 'End'}); expect(cell(2, 3)).toHaveFocus()
    fireEvent.keyDown(cell(2, 3), {key: 'ArrowLeft'}); expect(cell(2, 2)).toHaveFocus()
    fireEvent.keyDown(cell(2, 2), {key: 'ArrowUp'}); expect(cell(1, 2)).toHaveFocus()
    expect(grid).toHaveAccessibleDescription(/Enter or Space/)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })
  it('presents only the supplied survivor ID and reuses existing illustrative artwork', () => {
    render(<SurvivorTrial config={config} tokenId={2002n} onReadinessChange={vi.fn()}/>)
    expect(screen.getByText('CHOG #2002')).toBeVisible()
    expect(screen.queryByText(/XP|Trust|Scars/)).not.toBeInTheDocument()
    const avatar = cell(1, 2).querySelector('img')!
    expect(avatar.getAttribute('src')).toContain('survivor-creature-refined-provisional.webp')
    expect(avatar).toHaveAttribute('alt', '')
    expect(cell(1, 2)).toHaveAccessibleName(/your Chog/)
  })
  it('draws the actual walked trail and distinguishes step, hazard and completion feedback', () => {
    const {container} = setup()
    const trail = () => container.querySelector('.trial-walked-path')!
    const liveRegion = screen.getByRole('status')
    expect(trail().getAttribute('points')).toBe('150,32')
    fireEvent.click(cell(2, 2))
    expect(trail().getAttribute('points')).toBe('150,32 150,96')
    expect(screen.getByRole('status')).toBe(liveRegion)
    expect(container.querySelector('.trial-chog-crossing')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Difficulty'), {target: {value: 'hard'}})
    fireEvent.click(cell(2, 3))
    expect(container.querySelector('.trial-chog-hazard')).toBeInTheDocument()
    expect(trail().getAttribute('points')).toBe('150,32')
    solve('hard')
    expect(container.querySelector('.trial-chog-complete')).toBeInTheDocument()
    expect(container.querySelector('.trial-map-complete')).toBeInTheDocument()
  })
  it('disables all controls after the panel finishes', () => {
    render(<SurvivorTrial config={config} disabled onReadinessChange={vi.fn()}/>)
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled()
    expect(screen.getByLabelText('Difficulty')).toBeDisabled()
  })
  it.each(Object.values(miniGameData).flatMap(event => event.choices.filter(choice => choice.interaction.kind === 'puzzle')))('keeps the $label encounter context', choice => {
    if (choice.interaction.kind !== 'puzzle') throw new Error('Puzzle expected')
    render(<SurvivorTrial config={choice.interaction} onReadinessChange={vi.fn()}/>)
    expect(screen.getByText(choice.interaction.prompt)).toBeVisible()
    expect(screen.getByRole('button', {name: new RegExp(`^Row 4, path 2, ${choice.interaction.destination}`)})).toBeVisible()
  })
})
describe('trial panel callbacks', () => {
  it('discards disposable progress when the displayed survivor changes', () => {
    const props = {config, onComplete: vi.fn(), onSkip: vi.fn()}
    const view = render(<MiniGamePanel {...props} tokenId={2002n}/>); solve()
    view.rerender(<MiniGamePanel {...props} tokenId={2003n}/>)
    expect(screen.getByText('CHOG #2003')).toBeVisible()
    expect(screen.queryByRole('button', {name: 'Continue'})).not.toBeInTheDocument()
    expect(cell(1, 2)).toHaveAttribute('aria-current', 'location')
    expect(props.onComplete).not.toHaveBeenCalled()
  })
  it.each(['Reset', 'Retry', 'difficulty'])('invalidates Continue after %s', control => {
    const onComplete = vi.fn()
    render(<MiniGamePanel config={config} onComplete={onComplete} onSkip={vi.fn()}/>); solve()
    expect(screen.getByRole('button', {name: 'Continue'})).toBeEnabled()
    if (control === 'difficulty') fireEvent.change(screen.getByLabelText('Difficulty'), {target: {value: 'hard'}})
    else fireEvent.click(screen.getByRole('button', {name: control}))
    expect(screen.queryByRole('button', {name: 'Continue'})).not.toBeInTheDocument()
    expect(screen.getByText('Progress: 0 of 1')).toBeVisible()
    expect(onComplete).not.toHaveBeenCalled()
  })
  it.each(['empty', 'hazard', 'failed', 'complete'])('skips %s with only the original no-argument callback', state => {
    const onComplete = vi.fn(), onSkip = vi.fn()
    render(<MiniGamePanel config={config} onComplete={onComplete} onSkip={onSkip}/>)
    if (state === 'complete') solve()
    if (state === 'hazard' || state === 'failed') {
      fireEvent.change(screen.getByLabelText('Difficulty'), {target: {value: 'hard'}})
      for (let i = 0; i < (state === 'failed' ? 4 : 1); i++) fireEvent.click(cell(2, 3))
    }
    const skip = screen.getByRole('button', {name: 'Skip interaction'})
    fireEvent.click(skip); fireEvent.click(skip)
    expect(onSkip.mock.calls).toEqual([[]]); expect(onComplete).not.toHaveBeenCalled()
  })
})
