export function DailyTrailGuide({state}: {state?: {streak: number; scars: number; achievementMask: bigint}}) {
  const complete = state && Number.isInteger(state.streak) && Number.isInteger(state.scars) && typeof state.achievementMask==='bigint'
  return <aside className="how-it-works" aria-label="The next dawn">
    <details><summary>The next dawn is another choice — streaks and Scars</summary>
    <p>Return after 00:00 UTC to discover your next daily encounter. Will you protect your Chog or risk another scar? The contract determines the encounter for that token and day; it may repeat.</p>
    <p>Consecutive UTC-day actions build your streak. A consecutive action adds the previous streak to XP, capped at +7; a missed day restarts the next action’s streak at 1. Seven Suns is earned at a streak of 7. Unmarked Week requires 7 consecutive actions that request no additional Scars.</p>
    <p>Scars change the choices ahead: at 20 or more prior Scars, reckless decisions request 2 extra Scars and cautious decisions request 1 fewer. Actual changes are clamped by the contract. Achievements are badges, not token payouts.</p>
    {complete && state && <p>Verified record: streak {state.streak} · Scars {state.scars}. Seven Suns: {(state.achievementMask & 64n)!==0n?'earned':'not earned'}. Unmarked Week: {(state.achievementMask & 128n)!==0n?'earned':'not earned'}. {state.scars>=20?'The 20-Scar modifier applies to this recorded state.':''}</p>}
    <p>Other existing badges mark your first action, repeated bridge repairs, high Trust, 30 Scars, repeated gate encounters and all six encounter types. Your recorded achievements and title remain in Character.</p>
  </details></aside>
}
