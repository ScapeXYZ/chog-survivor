import type {Address} from 'viem'
import {achievements, events} from './game-data'
import type {AchievementHistory, AdventureHistory, HistoryRecord} from './survivalHistory'
import {survivorReflection, utcEvidence} from './survivorReflection'
import {signed} from './utils'

const changes = [{label: 'XP', key: 'xpDelta'}, {label: 'Trust', key: 'trustDelta'}, {label: 'Scars', key: 'scarsDelta'}] as const

export function journalEntries(records: readonly HistoryRecord[], tokenId: bigint) {
  const own = records.filter(record => record.tokenId === tokenId)
  const adventures = own.filter((record): record is AdventureHistory => record.kind === 'adventure')
  const matching = (badge: AchievementHistory, adventure: AdventureHistory) => badge.transactionHash === adventure.transactionHash && badge.blockNumber === adventure.blockNumber && badge.day === adventure.day
  return own.flatMap(record => {
    if (record.kind === 'achievement' && adventures.some(adventure => matching(record, adventure))) return []
    return [{record, earned: record.kind === 'adventure' ? [...new Set(own.filter((badge): badge is AchievementHistory => badge.kind === 'achievement' && matching(badge, record)).map(badge => badge.achievementId))] : []}]
  })
}
export function SurvivorJournal({tokenId, currentOwner, records}: {tokenId: bigint; currentOwner: Address; records: readonly HistoryRecord[]}) {
  const entries = journalEntries(records, tokenId)
  return <div className="survivor-diary">
    <p className="survivor-small">CHOG #{tokenId.toString()} carries these recorded decisions across owners. Reflections describe verified choices; they add no progression.</p>
    <p className="survivor-small journal-current-owner">Current verified owner: <span className="survivor-address">{currentOwner}</span></p>
    <ol className="survivor-history-list">{entries.map(({record, earned}) => {
      const date = utcEvidence(record.timestamp)
      const reflection = record.kind === 'adventure' ? survivorReflection(record) : undefined
      return <li className={`journal-entry journal-${record.kind}`} key={`${record.transactionHash}:${record.logIndex}`}>
        <div className="journal-date"><span>UTC day {record.day.toString()}</span>{date && <time dateTime={date.iso}>{date.label}</time>}</div>
        <strong>{record.kind === 'adventure' ? `${events[record.eventId - 1]?.name ?? `Event ${record.eventId}`} · ${events[record.eventId - 1]?.choices[record.choiceId - 1] ?? `Choice ${record.choiceId}`}` : `Achievement earned · ${achievements[record.achievementId] ?? `Achievement ID ${record.achievementId}`}`}</strong>
        {reflection && <p className="journal-reflection">“{reflection}”</p>}
        {record.kind === 'adventure' && <>
          <div className="journal-deltas" aria-label="Recorded changes">{changes.map(({label, key}) => <span key={label} className={`survivor-change survivor-change-${label.toLowerCase()}`} data-direction={record[key] > 0 ? 'increase' : record[key] < 0 ? 'decrease' : 'unchanged'}>{label} {signed(record[key])}</span>)}</div>
          <span>Recorded state: {record.xpAfter} XP · {record.trustAfter}/100 Trust · {record.scarsAfter}/100 Scars · streak {record.streakAfter} {record.streakAfter === 1 ? 'day' : 'days'}</span>
          <small className="journal-controller">Historical acting owner: <span className="survivor-address">{record.owner}</span></small>
        </>}
        {earned.length > 0 && <p className="journal-achievements">Achievements earned: {earned.map(id => achievements[id] ?? `Achievement ID ${id}`).join(', ')}</p>}
        <details className="journal-evidence"><summary>Verified transaction evidence</summary>
          <dl><dt>Token ID</dt><dd>{record.tokenId.toString()}</dd><dt>Transaction hash</dt><dd><code>{record.transactionHash}</code></dd><dt>Block · transaction index · log index</dt><dd>{record.blockNumber.toString()} · {record.transactionIndex} · {record.logIndex}</dd>
            {record.kind === 'adventure' && <><dt>Encounter · choice · outcome IDs</dt><dd>{record.eventId} · {record.choiceId} · {record.outcomeId}</dd></>}
            <dt>Block timestamp (UTC seconds)</dt><dd>{record.timestamp.toString()}</dd>
            {earned.length > 0 && <><dt>Achievement event evidence</dt><dd>{records.filter(item => item.kind === 'achievement' && item.tokenId === tokenId && item.transactionHash === record.transactionHash && item.blockNumber === record.blockNumber && item.day === record.day).map(item => `Achievement ${item.kind === 'achievement' ? item.achievementId : ''} · log ${item.logIndex}`).join('; ')}</dd></>}
          </dl>
        </details>
      </li>
    })}</ol>
  </div>
}
