import {act, cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {MiniGamePanel} from './MiniGamePanel'
import {miniGameData, type MiniGameConfig} from './mini-game-data'

const [puzzle, timing, story] = miniGameData['Broken Bridge'].choices.map(choice => choice.interaction)
let media: {matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn>}
beforeEach(() => {
  media = {matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn()}
  vi.stubGlobal('matchMedia', vi.fn(() => media))
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

function setup(config: MiniGameConfig = puzzle) {
  const onComplete = vi.fn(), onSkip = vi.fn()
  return {...render(<MiniGamePanel config={config} onComplete={onComplete} onSkip={onSkip}/>), onComplete, onSkip}
}
function tick(ms: number) { act(() => { vi.advanceTimersByTime(ms) }) }

describe('MiniGamePanel', () => {
  it('retries a hazardous route, then reports success and completes once without arguments', () => {
    const {onComplete, onSkip} = setup()
    expect(screen.getByText(/do not affect on-chain rewards/)).toBeVisible()
    expect(screen.getByText('Progress: 0 of 1')).toBeVisible()
    expect(screen.getByRole('grid', {name: 'easy survival map'})).toBeVisible()
    fireEvent.change(screen.getByLabelText('Difficulty'), {target: {value: 'medium'}}); fireEvent.click(screen.getByRole('button', {name: /^Row 2, path 3/}))
    expect(screen.getByRole('status')).toHaveTextContent('Hazard!')
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Difficulty'), {target: {value: 'easy'}}); [2, 3, 4].forEach(row => fireEvent.click(screen.getByRole('button', {name: new RegExp(`^Row ${row}, path 2`)})))
    expect(screen.getByRole('status')).toHaveTextContent('Trial complete')
    expect(screen.getByText(/Progress: 1 of 1/)).toBeVisible()
    const button = screen.getByRole('button', {name: 'Continue'})
    expect(button).toHaveFocus()
    fireEvent.click(button); fireEvent.click(button)
    expect(onComplete.mock.calls).toEqual([[]])
    expect(onSkip).not.toHaveBeenCalled()
  })

  it.each([0, 1])('completes the same Story interaction using response %s', index => {
    const {onComplete, onSkip} = setup(story)
    if (story.kind !== 'story') throw new Error('Story fixture expected')
    fireEvent.click(screen.getByRole('button', {name: story.responses[index]}))
    expect(screen.getByRole('status')).toHaveTextContent('Your selected choice is unchanged')
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', {name: 'Continue'}))
    expect(onComplete.mock.calls).toEqual([[]])
    expect(onSkip).not.toHaveBeenCalled()
  })

  it('retries an early Timing stop and succeeds in the forgiving center zone', () => {
    vi.useFakeTimers()
    const {onComplete} = setup(timing)
    fireEvent.click(screen.getByRole('button', {name: 'Start'})); tick(200)
    fireEvent.click(screen.getByRole('button', {name: 'Stop'}))
    expect(screen.getByRole('status')).toHaveTextContent('Outside the center zone')
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', {name: 'Start'})); tick(1500)
    expect(screen.getByRole('meter', {name: 'Readiness indicator'})).toHaveAttribute('aria-valuenow', '50')
    fireEvent.click(screen.getByRole('button', {name: 'Stop'}))
    tick(0) // Flush focus-related jsdom work after Continue receives focus.
    expect(screen.getByRole('status')).toHaveTextContent('Ready!')
    expect(vi.getTimerCount()).toBe(0)
    fireEvent.click(screen.getByRole('button', {name: 'Continue'}))
    expect(onComplete.mock.calls).toEqual([[]])
  })

  it.each([900, 2100])('accepts the Timing center-zone boundary at %s ms', ms => {
    vi.useFakeTimers(); setup(timing)
    fireEvent.click(screen.getByRole('button', {name: 'Start'})); tick(ms)
    fireEvent.click(screen.getByRole('button', {name: 'Stop'}))
    expect(screen.getByRole('status')).toHaveTextContent('Ready!')
  })

  it('expires a pulse without completing and allows another attempt', () => {
    vi.useFakeTimers()
    const {onComplete} = setup(timing)
    fireEvent.click(screen.getByRole('button', {name: 'Start'})); tick(3000)
    expect(screen.getByRole('status')).toHaveTextContent('The pulse finished')
    expect(onComplete).not.toHaveBeenCalled()
    expect(screen.getByRole('button', {name: 'Start'})).toBeEnabled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each([puzzle, timing, story])('skips $kind with a no-argument callback and no completion', config => {
    const {onComplete, onSkip} = setup(config)
    const button = screen.getByRole('button', {name: 'Skip interaction'})
    expect(button).toBeVisible()
    fireEvent.click(button); fireEvent.click(button)
    expect(onSkip.mock.calls).toEqual([[]])
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('cleans up running timers on skip, unmount, and configuration change', () => {
    vi.useFakeTimers()
    const view = setup(timing)
    fireEvent.click(screen.getByRole('button', {name: 'Start'}))
    expect(vi.getTimerCount()).toBe(1)
    fireEvent.click(screen.getByRole('button', {name: 'Skip interaction'}))
    expect(vi.getTimerCount()).toBe(0)
    view.rerender(<MiniGamePanel config={puzzle} onComplete={view.onComplete} onSkip={view.onSkip}/>)
    expect(screen.getByText('Progress: 0 of 1')).toBeVisible()
    view.rerender(<MiniGamePanel config={timing} onComplete={view.onComplete} onSkip={view.onSkip}/>)
    fireEvent.click(screen.getByRole('button', {name: 'Start'}))
    view.rerender(<MiniGamePanel config={story} onComplete={view.onComplete} onSkip={view.onSkip}/>)
    expect(vi.getTimerCount()).toBe(0)
    view.rerender(<MiniGamePanel config={timing} onComplete={view.onComplete} onSkip={view.onSkip}/>)
    fireEvent.click(screen.getByRole('button', {name: 'Start'})); view.unmount()
    expect(vi.getTimerCount()).toBe(0)
    expect(media.removeEventListener).toHaveBeenCalled()
  })

  it('provides static, untimed readiness when reduced motion is preferred', () => {
    vi.useFakeTimers(); media.matches = true
    const {onComplete} = setup(timing)
    expect(screen.getByText(/No moving indicator or time limit/)).toBeVisible()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Start'})).not.toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(0)
    tick(60_000)
    fireEvent.click(screen.getByRole('button', {name: 'I am ready'}))
    expect(screen.getByRole('status')).toHaveTextContent('Untimed interaction complete')
    fireEvent.click(screen.getByRole('button', {name: 'Continue'}))
    expect(onComplete.mock.calls).toEqual([[]])
  })

  it('cancels motion immediately when the preference changes during a pulse', () => {
    vi.useFakeTimers(); setup(timing)
    fireEvent.click(screen.getByRole('button', {name: 'Start'})); tick(200)
    media.matches = true
    act(() => { media.addEventListener.mock.calls[0][1]() })
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'I am ready'})).toBeEnabled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('uses ordinary focusable buttons without global keyboard handlers or form submission', () => {
    setup()
    const buttons = screen.getAllByRole('button')
    for (const button of buttons) {
      expect(button.tagName).toBe('BUTTON')
      expect(button).toHaveAttribute('type', 'button')
      // Board cells use a roving Tab stop and remain arrow-key focusable.
      button.focus(); expect(button).toHaveFocus()
    }
    // Browser-native Tab/Enter/Space activation is verified in the browser smoke check.
    const keyboard = new KeyboardEvent('keydown', {key: ' ', bubbles: true, cancelable: true})
    expect(buttons[0].dispatchEvent(keyboard)).toBe(true)
  })

  it('has no network, persistence, audio or game-result events; callbacks carry no reward data', () => {
    const fetchSpy = vi.fn(); vi.stubGlobal('fetch', fetchSpy)
    const storage = vi.spyOn(Storage.prototype, 'setItem')
    const dispatch = vi.spyOn(window, 'dispatchEvent')
    const {onComplete, onSkip} = setup()
    fireEvent.change(screen.getByLabelText('Difficulty'), {target: {value: 'medium'}}); fireEvent.click(screen.getByRole('button', {name: /^Row 2, path 3/}))
    fireEvent.change(screen.getByLabelText('Difficulty'), {target: {value: 'easy'}}); [2, 3, 4].forEach(row => fireEvent.click(screen.getByRole('button', {name: new RegExp(`^Row ${row}, path 2`)})))
    fireEvent.click(screen.getByRole('button', {name: 'Continue'}))
    expect(onComplete.mock.calls).toEqual([[]]); expect(onSkip).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled()
  })
})
