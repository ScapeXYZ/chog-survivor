export const titles = ['Wandering Chog', 'Scarred Pathfinder', 'Trusted Trailblazer', 'Mythic Survivor']

export const achievements = [
  'First Light',
  'Bridge Builder',
  'Kindred Spirit',
  'Stormforged',
  'Gatekeeper',
  'Pathfinder',
  'Seven Suns',
  'Unmarked Week',
]

export const events = [
  {
    name: 'Broken Bridge', choices: ['Reinforce', 'Leap the gap', 'Guide others around'],
    narrative: 'A broken crossing interrupts the trail. Beyond the gap, the forest waits. How will you make your way?',
    tags: ['cautious', 'reckless', 'compassionate'],
    baseDeltas: [[12, 5, 0], [22, -2, 5], [9, 9, 1]],
    consequences: ['The low-XP route protects Trust and avoids base Scars.', 'More base XP comes at a cost to Trust and Scars.', 'The strongest Bridge Trust gain trades away XP and adds a Scar.'],
  },
  {
    name: 'Hungry Stranger', choices: ['Share rations', 'Question them', 'Drive them away'],
    narrative: 'A hungry stranger waits beside the ruined path. The night is cold, and your next choice matters.',
    tags: ['compassionate', 'cautious', 'reckless'],
    baseDeltas: [[10, 10, 0], [15, 2, 1], [19, -6, 3]],
    consequences: ['The strongest Hungry Stranger Trust gain avoids base Scars, with less XP.', 'A middle-XP compromise offers modest Trust and adds a Scar.', 'The highest base XP for this encounter costs Trust and adds Scars.'],
  },
  {
    name: 'Midnight Storm', choices: ['Hold the shelter', 'Rescue a call', 'Run through it'],
    narrative: 'A storm moves through the midnight forest. A call carries through the darkness beyond the shelter.',
    tags: ['cautious', 'compassionate', 'reckless'],
    baseDeltas: [[13, 3, 0], [17, 8, 3], [24, -3, 6]],
    consequences: ['The lower-risk Storm route avoids base Scars.', 'More XP and Trust than holding the shelter comes with three base Scars.', 'The strongest Storm base XP gain costs Trust and adds six base Scars.'],
  },
  {
    name: 'Ancient Gate', choices: ['Solve the runes', 'Open it for all', 'Force the seal'],
    narrative: 'Moonlight catches the runes of an ancient gate. Its weathered seal stands between you and the trail beyond.',
    tags: ['cautious', 'compassionate', 'reckless'],
    baseDeltas: [[18, 4, 0], [12, 11, 1], [26, -4, 5]],
    consequences: ['A low-scar route favours XP over the greater Trust gain of opening the gate.', 'The strongest Gate Trust gain trades away XP and adds a Scar.', 'The strongest Gate base XP gain costs Trust and adds Scars.'],
  },
  {
    name: 'Lost Chog', choices: ['Lead them home', 'Mark a safe path', 'Chase the distant cry'],
    narrative: 'A lost Chog lingers among the twisted trees. Farther into the forest, a distant cry breaks the silence.',
    tags: ['compassionate', 'cautious', 'reckless'],
    baseDeltas: [[11, 12, 1], [16, 5, 0], [23, -1, 4]],
    consequences: ['The strongest Lost Chog Trust gain adds a Scar and gives up XP.', 'Moderate XP and Trust come without base Scars.', 'The highest base XP for this encounter costs Trust and adds Scars.'],
  },
  {
    name: 'Shadow Beast', choices: ['Set a ward', 'Distract it away', 'Face it head-on'],
    narrative: 'A shadow beast stirs beyond the camp. The lantern light reaches only so far into the trees.',
    tags: ['cautious', 'compassionate', 'reckless'],
    baseDeltas: [[17, 3, 0], [14, 9, 2], [27, -5, 7]],
    consequences: ['The low-scar Beast route offers XP without base Scars.', 'Greater Trust than setting a ward trades away XP and adds two base Scars.', 'The highest base XP in the rulebook costs Trust and adds seven base Scars.'],
  },
] as const
