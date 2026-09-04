/** Emergency powers. Everything a Safe treasury can reach for when the towers are not enough. */
export const HARD_FORK = {
  name: 'Hard fork',
  hotkey: 'K',
  /** Only usable while the treasury is at or below this share of its maximum. */
  direThreshold: 0.3,
  /** The treasury is restored to at least this share of its maximum. */
  restoreRatio: 0.5,
  description:
    'Roll back the chain. Every attacker on the map is reorged out of existence and the treasury is restored to half. Once per game, only when the treasury is below 30%.',
}

export interface FundraiseRound {
  name: string
  /** ETH added to the treasury. */
  eth: number
  /** SAFE handed to the investors. */
  cost: number
}

export const FUNDRAISE = {
  name: 'Fundraise',
  hotkey: 'R',
  cooldown: 45,
  rounds: [
    { name: 'Seed', eth: 3, cost: 90 },
    { name: 'Series A', eth: 4, cost: 140 },
    { name: 'Series B', eth: 5, cost: 200 },
    { name: 'Series C', eth: 7, cost: 280 },
  ] as FundraiseRound[],
  description:
    'Raise ETH into the treasury by handing SAFE to investors. Seed, then Series A, B and C, each bigger than the last. 45 second cooldown.',
}

export const VITALIK_NUKE = {
  name: 'Call Vitalik',
  hotkey: 'V',
  cooldown: 120,
  /** Seconds between the call and the impact while Vitalik flies in. */
  flightTime: 2.6,
  damageRatio: 0.4,
  bossDamageRatio: 0.15,
  stun: 1.5,
  description:
    'Vitalik flies in and nukes the mempool: every attacker loses 40% of its health (bosses 15%) and is frozen for 1.5 seconds. 2 minute cooldown.',
}
