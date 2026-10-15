export type ContractPreview = {day: bigint; eventId: number; choiceId: number; outcomeId: number; xpDelta: number; trustDelta: number; scarsDelta: number; xpAfter: number; trustAfter: number; scarsAfter: number; streakAfter: number; unmarkedStreakAfter: number; newlyEarnedAchievementMask: bigint; achievementMaskAfter: bigint; titleId: number; canAct: boolean}
export type AdventureSession = {epoch: number; tokenId: bigint; address: `0x${string}`; day: bigint; eventIndex: number; choiceIndex: number; stage: 'interaction' | 'preview'}

// The preview is associated with a wallet/token/chain-scoped query by the parent.
// Validate its payload before displaying projections or enabling confirmation.
export function previewMatchesSession(value: ContractPreview | undefined, session: AdventureSession | undefined): value is ContractPreview {
  return !!value && !!session && value.day === session.day && value.eventId === session.eventIndex + 1 &&
    value.choiceId === session.choiceIndex + 1 && value.outcomeId === session.eventIndex * 3 + session.choiceIndex + 1 &&
    typeof value.canAct === 'boolean' && typeof value.newlyEarnedAchievementMask === 'bigint' && typeof value.achievementMaskAfter === 'bigint' &&
    [value.xpDelta, value.trustDelta, value.scarsDelta, value.xpAfter, value.trustAfter, value.scarsAfter, value.streakAfter, value.unmarkedStreakAfter, value.titleId].every(Number.isFinite)
}

export function samePreview(left: ContractPreview, right: ContractPreview) {
  return (Object.keys(left) as (keyof ContractPreview)[]).every(key => left[key] === right[key]) &&
    (Object.keys(right) as (keyof ContractPreview)[]).every(key => left[key] === right[key])
}
