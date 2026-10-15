import {cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {journalEntries, SurvivorJournal} from './SurvivorJournal'
import type {AdventureHistory, AchievementHistory} from './survivalHistory'
const oldOwner = '0x1111111111111111111111111111111111111111', newOwner = '0x2222222222222222222222222222222222222222'
const hash = `0x${'a'.repeat(64)}` as const
const entry: AdventureHistory = {kind: 'adventure', tokenId: 2006n, owner: oldOwner, day: 100n, eventId: 1, choiceId: 2, outcomeId: 2, xpDelta: 99, trustDelta: -2, scarsDelta: 0, xpAfter: 99, trustAfter: 0, scarsAfter: 100, streakAfter: 1, unmarkedStreakAfter: 0, achievementMaskAfter: 1n, blockNumber: 10n, transactionIndex: 0, logIndex: 0, transactionHash: hash, timestamp: 8640012n}
const badge: AchievementHistory = {kind: 'achievement', tokenId: 2006n, achievementId: 0, day: 100n, blockNumber: 10n, transactionIndex: 0, logIndex: 1, transactionHash: hash, timestamp: entry.timestamp}
afterEach(cleanup)
describe('permanent survivor diary', () => {
  it('presents recorded choices, actual deltas and state instead of base values', () => {
    render(<SurvivorJournal tokenId={2006n} currentOwner={newOwner} records={[entry]}/>)
    expect(screen.getByText('Broken Bridge · Leap the gap')).toBeVisible()
    expect(screen.getByText(/I took the leap/)).toHaveTextContent('Trust fell. Scars stayed unchanged.')
    expect(screen.getByLabelText('Recorded changes')).toHaveTextContent('XP +99Trust -2Scars 0')
    expect(screen.getByText(/Recorded state:/)).toHaveTextContent('99 XP · 0/100 Trust · 100/100 Scars · streak 1 day')
    expect(screen.getByText(/UTC day 100/)).toBeVisible()
    expect(screen.getByText('Sat, 11 Apr 1970 00:00:12 GMT')).toBeDefined()
  })
  it('retains the same history on transfer and labels historical and current owners separately', () => {
    const view = render(<SurvivorJournal tokenId={2006n} currentOwner={oldOwner} records={[entry, badge]}/>)
    const reflection = screen.getByText(/I took the leap/).textContent
    view.rerender(<SurvivorJournal tokenId={2006n} currentOwner={newOwner} records={[entry, badge]}/>)
    expect(screen.getByText(/Current verified owner/)).toHaveTextContent(newOwner)
    expect(screen.getByText(/Historical acting owner/)).toHaveTextContent(oldOwner)
    expect(screen.getByText(/I took the leap/)).toHaveTextContent(reflection!)
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })
  it('groups only same-transaction, same-day, same-token achievement evidence', () => {
    const records = [entry, badge, badge, {...badge, tokenId: 2007n}, {...badge, day: 101n, logIndex: 3}, {...badge, transactionHash: `0x${'b'.repeat(64)}` as const, logIndex: 4}]
    const grouped = journalEntries(records, 2006n)
    expect(grouped).toHaveLength(3); expect(grouped[0].earned).toEqual([0])
    render(<SurvivorJournal tokenId={2006n} currentOwner={newOwner} records={[entry, badge]}/>)
    expect(screen.getByText('Achievements earned: First Light')).toBeVisible()
  })
  it('does not infer newly earned badges from the cumulative mask or partial journal', () => {
    render(<SurvivorJournal tokenId={2006n} currentOwner={newOwner} records={[{...entry, achievementMaskAfter: 255n}]}/>)
    expect(screen.queryByText(/Achievements earned:/)).not.toBeInTheDocument()
  })
  it('preserves complete transaction, block, log, UTC and outcome evidence behind a keyboard disclosure', () => {
    render(<SurvivorJournal tokenId={2006n} currentOwner={newOwner} records={[entry, badge]}/>)
    const disclosure = screen.getByText('Verified transaction evidence')
    disclosure.focus(); expect(disclosure).toHaveFocus(); fireEvent.click(disclosure)
    const evidence = disclosure.closest('details')!
    expect(within(evidence).getByText(hash)).toBeInTheDocument()
    expect(evidence).toHaveTextContent('10 · 0 · 0')
    expect(evidence).toHaveTextContent('1 · 2 · 2')
    expect(evidence).toHaveTextContent('Achievement 0 · log 1')
    expect(evidence).toHaveTextContent('8640012')
  })
  it('never reassigns records to another token or fabricates an unsupported outcome', () => {
    const view = render(<SurvivorJournal tokenId={2007n} currentOwner={newOwner} records={[entry]}/>)
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    view.rerender(<SurvivorJournal tokenId={2006n} currentOwner={newOwner} records={[{...entry, eventId: 99, outcomeId: 999}]}/>)
    expect(screen.getByText(/Event 99/)).toBeVisible()
    expect(screen.queryByText(/I took/)).not.toBeInTheDocument()
  })
  it('has no write, storage, wallet or generated history side effects', () => {
    const fetch = vi.spyOn(globalThis, 'fetch'), storage = vi.spyOn(Storage.prototype, 'setItem')
    render(<SurvivorJournal tokenId={2006n} currentOwner={newOwner} records={[]}/>)
    expect(fetch).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled()
    fetch.mockRestore(); storage.mockRestore()
  })
})
