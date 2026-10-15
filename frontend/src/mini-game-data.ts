import type {events} from './game-data'

type Encounter = (typeof events)[number]
export type MiniGameCategory = Encounter['tags'][number]
export const miniGameKindByCategory = {
  cautious: 'puzzle', reckless: 'timing', compassionate: 'story',
} as const satisfies Record<MiniGameCategory, string>

export type PuzzleConfig = {
  readonly kind: 'puzzle'
  readonly prompt: string
  readonly theme: 'bridge' | 'camp' | 'storm' | 'runes' | 'forest' | 'shadow'
  readonly destination: string
  readonly hazard: string
}
export type TimingConfig = {
  readonly kind: 'timing'
  readonly cue: string
  readonly durationMs: number
}
export type StoryConfig = {
  readonly kind: 'story'
  readonly prompt: string
  // Both responses belong to the same selected choice; neither selects another action.
  readonly responses: readonly [string, string]
}
export type MiniGameConfig = PuzzleConfig | TimingConfig | StoryConfig
type ConfigByCategory = {cautious: PuzzleConfig; reckless: TimingConfig; compassionate: StoryConfig}
type ChoiceConfig<E extends Encounter, I extends 0 | 1 | 2, Id extends 1 | 2 | 3> = {
  readonly choiceId: Id
  readonly label: E['choices'][I]
  readonly category: E['tags'][I]
  readonly interaction: ConfigByCategory[E['tags'][I]]
}
type EncounterConfigs = {
  readonly [E in Encounter as E['name']]: {
    readonly encounterId: 1 | 2 | 3 | 4 | 5 | 6
    readonly choices: readonly [ChoiceConfig<E, 0, 1>, ChoiceConfig<E, 1, 2>, ChoiceConfig<E, 2, 3>]
  }
}

// Presentation data only. IDs and order mirror game-data; interaction results
// cannot carry rewards, eligibility, or a replacement contract choice.
// The type-only import keeps this module independent of contract configuration.
export const miniGameData = {
  'Broken Bridge': {
    encounterId: 1,
    choices: [
      {choiceId: 1, label: 'Reinforce', category: 'cautious', interaction: {kind: 'puzzle', prompt: 'Guide your Chog across the broken crossing to secure the supports.', theme: 'bridge', destination: 'the far bank', hazard: 'broken planks'}},
      {choiceId: 2, label: 'Leap the gap', category: 'reckless', interaction: {kind: 'timing', cue: 'Stop the readiness pulse at its center before the leap.', durationMs: 3000}},
      {choiceId: 3, label: 'Guide others around', category: 'compassionate', interaction: {kind: 'story', prompt: 'What do you say as you guide the group along the bank?', responses: ['Follow my lantern along the bank.', 'Stay together; we will take the longer path.']}},
    ],
  },
  'Hungry Stranger': {
    encounterId: 2,
    choices: [
      {choiceId: 1, label: 'Share rations', category: 'compassionate', interaction: {kind: 'story', prompt: 'What do you say as you offer your rations?', responses: ['Take a seat; we can share this meal.', 'Here is a little food for the road.']}},
      {choiceId: 2, label: 'Question them', category: 'cautious', interaction: {kind: 'puzzle', prompt: 'Scout a safe approach before questioning the hungry stranger.', theme: 'camp', destination: 'the watch post', hazard: 'unsteady ground'}},
      {choiceId: 3, label: 'Drive them away', category: 'reckless', interaction: {kind: 'timing', cue: 'Stop the lantern pulse at its center to send a warning signal.', durationMs: 2500}},
    ],
  },
  'Midnight Storm': {
    encounterId: 3,
    choices: [
      {choiceId: 1, label: 'Hold the shelter', category: 'cautious', interaction: {kind: 'puzzle', prompt: 'Find a protected route to anchor the shelter against the storm.', theme: 'storm', destination: 'the shelter', hazard: 'lightning'}},
      {choiceId: 2, label: 'Rescue a call', category: 'compassionate', interaction: {kind: 'story', prompt: 'How do you answer the voice beyond the shelter?', responses: ['Keep calling; I am coming toward you.', 'Look for my lantern through the rain.']}},
      {choiceId: 3, label: 'Run through it', category: 'reckless', interaction: {kind: 'timing', cue: 'Stop the storm pulse at its center to prepare your dash.', durationMs: 3000}},
    ],
  },
  'Ancient Gate': {
    encounterId: 4,
    choices: [
      {choiceId: 1, label: 'Solve the runes', category: 'cautious', interaction: {kind: 'puzzle', prompt: 'Follow the warded passage to understand the ancient gate.', theme: 'runes', destination: 'the gate', hazard: 'unstable runes'}},
      {choiceId: 2, label: 'Open it for all', category: 'compassionate', interaction: {kind: 'story', prompt: 'What do you say to those waiting at the gate?', responses: ['Gather close; we will open the way together.', 'Hold your lanterns high so everyone can follow.']}},
      {choiceId: 3, label: 'Force the seal', category: 'reckless', interaction: {kind: 'timing', cue: 'Stop the pressure pulse at its center as you brace against the seal.', durationMs: 3500}},
    ],
  },
  'Lost Chog': {
    encounterId: 5,
    choices: [
      {choiceId: 1, label: 'Lead them home', category: 'compassionate', interaction: {kind: 'story', prompt: 'How do you reassure the lost Chog as you lead them home?', responses: ['Stay beside me; we will find the camp.', 'Follow my lantern, one step at a time.']}},
      {choiceId: 2, label: 'Mark a safe path', category: 'cautious', interaction: {kind: 'puzzle', prompt: 'Guide your Chog along a safe trail and mark the way home.', theme: 'forest', destination: 'home camp', hazard: 'thorn thicket'}},
      {choiceId: 3, label: 'Chase the distant cry', category: 'reckless', interaction: {kind: 'timing', cue: 'Stop the listening pulse at its center before following the distant cry.', durationMs: 3000}},
    ],
  },
  'Shadow Beast': {
    encounterId: 6,
    choices: [
      {choiceId: 1, label: 'Set a ward', category: 'cautious', interaction: {kind: 'puzzle', prompt: 'Cross the clearing to place a ward between the beast and camp.', theme: 'shadow', destination: 'the ward stone', hazard: 'shadow ambush'}},
      {choiceId: 2, label: 'Distract it away', category: 'compassionate', interaction: {kind: 'story', prompt: 'What do you call as you draw the beast away from camp?', responses: ['Over here, beyond the lanterns!', 'Follow my voice toward the empty clearing!']}},
      {choiceId: 3, label: 'Face it head-on', category: 'reckless', interaction: {kind: 'timing', cue: 'Stop the steadying pulse at its center as you face the shadow beast.', durationMs: 3500}},
    ],
  },
} as const satisfies EncounterConfigs
