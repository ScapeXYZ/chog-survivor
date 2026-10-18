// Guest fiction only. This module has no wallet, contract or persistence dependency.
export const guestStories = [
  [
    'Beneath your knots, the broken planks stop shivering, and you lead the crossing one careful step at a time.',
    'The ledge catches your claws as the last loose stone disappears into the black water below.',
    'You mark a trail through the reeds, and the travellers behind you follow your lantern to the far bank.',
  ],
  [
    'You split your last rations beside the ruined milepost, and the stranger speaks your name like a promise.',
    'You keep the fire between you until the stranger’s story stops changing, then point them toward a safer road.',
    'You brandish a burning branch until the stranger retreats, leaving only their empty bowl beside the trail.',
  ],
  [
    'The shelter groans under the gale, but your braced shoulders keep the sleeping camp beneath its roof.',
    'You follow the thin cry beyond the lantern light and bring a shivering traveller back through the rain.',
    'You race the lightning through the trees, reaching higher ground as the old path disappears beneath the flood.',
  ],
  [
    'You trace the faded runes until a hidden latch sighs open, revealing a path untouched by the wind.',
    'You hold the groaning gate while the waiting travellers slip through, their lanterns gathering on the other side.',
    'Your blow splits the ancient seal, and the gate answers with a shower of stone and a long, hollow echo.',
  ],
  [
    'You guide the lost Chog toward familiar camp smoke, and it refuses to leave your side until the lights are near.',
    'You score clear arrows into the bark and watch the lost Chog find its way along your careful signs.',
    'You follow the distant cry into thorn-dark woods, finding a new trail where the safe road ends.',
  ],
  [
    'Your ward burns across the camp’s edge, and the beast circles beyond its pale boundary until dawn.',
    'You send your lantern rolling into the brush, drawing the beast away while the camp escapes behind you.',
    'You stand where the lantern light ends, meeting the beast’s charge before it can reach the sleeping camp.',
  ],
  [
    'You tuck the sprite beneath your cloak, and it brushes your palms with a cool thread of moonlight.',
    'You leave the seed rooted in silver moss and learn the slow rhythm of its light before walking on.',
    'You tear the seed from its roots, and the sprite’s last glimmer vanishes into the hollow trees.',
  ],
] as const

export function guestStory(scene: number, choice: number, effects: readonly number[]): string {
  const story = guestStories[scene]?.[choice]
  if (!story || effects.length !== 3 || !effects.every(Number.isFinite)) throw Error('Guest story requires a resolved guest choice')
  const [xp, trust, scars] = effects
  const trustText = trust > 0 ? `Trust rises by ${trust}` : trust < 0 ? `Trust falls by ${-trust}` : 'Trust holds steady'
  const scarText = scars > 0 ? `you carry ${scars} new ${scars === 1 ? 'Scar' : 'Scars'}` : scars < 0 ? `${-scars} ${scars === -1 ? 'Scar heals' : 'Scars heal'}` : 'your Scars are unchanged'
  return `${story} You gain ${xp} XP; ${trustText}, and ${scarText}.`
}
