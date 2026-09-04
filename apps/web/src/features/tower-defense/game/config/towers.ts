import type { TowerDef, TowerId } from './types'

/**
 * Every tower is a Safe security primitive. Costs are in SAFE, ranges in grid cells,
 * cooldowns in seconds and damage per hit (or per pulse for area towers).
 */
export const TOWERS: Record<TowerId, TowerDef> = {
  shield: {
    id: 'shield',
    name: 'Safe{Shield}',
    tagline: 'Transaction scanner',
    description:
      'Scans every incoming transaction and flags malicious calldata. Cheap, fast and hits both ground and air.',
    attackType: 'scan',
    targets: 'both',
    projectile: 'bolt',
    hotkey: '1',
    color: 0x12ff80,
    levels: [
      { cost: 60, damage: 14, range: 3, cooldown: 0.55, projectileSpeed: 16 },
      { cost: 70, damage: 31, range: 3.3, cooldown: 0.5, projectileSpeed: 18 },
      { cost: 110, damage: 67, range: 3.6, cooldown: 0.45, projectileSpeed: 20 },
    ],
  },
  hypernative: {
    id: 'hypernative',
    name: 'Hypernative Guard',
    tagline: 'Real-time threat detection',
    description:
      'Emits detection pulses that damage and slow every attacker in range. The Guardian is active on every pulse.',
    attackType: 'magic',
    targets: 'both',
    projectile: 'pulse',
    hotkey: '2',
    color: 0x00bfe5,
    levels: [
      { cost: 90, damage: 11, range: 2.8, cooldown: 1.2, slow: { factor: 0.55, duration: 2 } },
      { cost: 100, damage: 22, range: 3.1, cooldown: 1.1, slow: { factor: 0.5, duration: 2.4 } },
      { cost: 150, damage: 43, range: 3.4, cooldown: 1.0, slow: { factor: 0.42, duration: 2.8 } },
    ],
  },
  multisig: {
    id: 'multisig',
    name: 'Multisig Cannon',
    tagline: 'Threshold enforcement',
    description:
      'Fires heavy signature bundles that explode on impact. Slow to reload but devastating against armored attackers. Ground only.',
    attackType: 'impact',
    targets: 'ground',
    projectile: 'shell',
    hotkey: '3',
    color: 0xff8c00,
    levels: [
      { cost: 120, damage: 54, range: 3.2, cooldown: 2.0, projectileSpeed: 9, splash: 1.1 },
      { cost: 140, damage: 120, range: 3.5, cooldown: 1.9, projectileSpeed: 9.5, splash: 1.25 },
      { cost: 200, damage: 252, range: 3.8, cooldown: 1.8, projectileSpeed: 10, splash: 1.45 },
    ],
  },
  simulator: {
    id: 'simulator',
    name: 'Safenet Sentinel',
    tagline: 'Sentinel oracle',
    description:
      'A Safenet Sentinel oracle simulates every transaction before it lands: long range, huge single shots, and its risk signals reveal stealthy social engineers for the other towers.',
    attackType: 'scan',
    targets: 'both',
    projectile: 'tracer',
    hotkey: '4',
    color: 0x84d9a0,
    levels: [
      { cost: 130, damage: 90, range: 5.5, cooldown: 1.8, projectileSpeed: 34, detectRange: 5.5 },
      { cost: 160, damage: 198, range: 6, cooldown: 1.7, projectileSpeed: 36, detectRange: 6 },
      { cost: 230, damage: 420, range: 6.5, cooldown: 1.6, projectileSpeed: 38, detectRange: 6.5 },
    ],
  },
  safenet: {
    id: 'safenet',
    name: 'Safenet Validators',
    tagline: 'Cryptographic attestations',
    description:
      'A Byzantine fault tolerant set of Validators arcs consensus between attackers. Each attestation jumps to another target for slightly less damage.',
    attackType: 'magic',
    targets: 'both',
    projectile: 'beam',
    hotkey: '5',
    color: 0xb388ff,
    levels: [
      { cost: 140, damage: 29, range: 3.4, cooldown: 1.0, chain: 3 },
      { cost: 170, damage: 58, range: 3.7, cooldown: 0.95, chain: 4 },
      { cost: 240, damage: 108, range: 4, cooldown: 0.9, chain: 6 },
    ],
  },
  timelock: {
    id: 'timelock',
    name: 'Timelock Module',
    tagline: 'Zodiac delay modifier',
    description: 'Deals no damage but periodically freezes every attacker in range. Buys your signers time to react.',
    attackType: 'magic',
    targets: 'both',
    projectile: 'pulse',
    hotkey: '6',
    color: 0xd6a100,
    levels: [
      { cost: 110, damage: 0, range: 2.6, cooldown: 5, stun: 1.0 },
      { cost: 130, damage: 0, range: 2.9, cooldown: 4.5, stun: 1.3 },
      { cost: 190, damage: 0, range: 3.2, cooldown: 4, stun: 1.7 },
    ],
  },
  recovery: {
    id: 'recovery',
    name: 'Delegator Pool',
    tagline: 'Stake SAFE, earn rewards',
    description:
      'Does not attack. Delegators stake SAFE behind every tower in its aura, boosting their damage, and pay out staking rewards at the end of each wave.',
    attackType: 'magic',
    targets: 'none',
    projectile: 'none',
    hotkey: '7',
    color: 0xeafff2,
    levels: [
      { cost: 100, damage: 0, range: 2.2, cooldown: 1, auraDamageBonus: 0.15, income: 12 },
      { cost: 150, damage: 0, range: 2.5, cooldown: 1, auraDamageBonus: 0.28, income: 24 },
      { cost: 220, damage: 0, range: 2.8, cooldown: 1, auraDamageBonus: 0.45, income: 40 },
    ],
  },
  guard: {
    id: 'guard',
    name: 'Safe Guard',
    tagline: 'Onchain enforcement',
    description:
      'The Guard verifies attestations onchain. Anything without one keeps bleeding after impact. Excellent against regenerating threats.',
    attackType: 'magic',
    targets: 'both',
    projectile: 'dart',
    hotkey: '8',
    color: 0x9dff00,
    levels: [
      { cost: 80, damage: 8, range: 3, cooldown: 0.9, projectileSpeed: 13, dot: { dps: 9, duration: 3 } },
      { cost: 100, damage: 17, range: 3.3, cooldown: 0.85, projectileSpeed: 14, dot: { dps: 20, duration: 3.2 } },
      { cost: 150, damage: 34, range: 3.6, cooldown: 0.8, projectileSpeed: 15, dot: { dps: 42, duration: 3.5 } },
    ],
  },
}

export const TOWER_ORDER: TowerId[] = [
  'shield',
  'hypernative',
  'multisig',
  'simulator',
  'safenet',
  'timelock',
  'recovery',
  'guard',
]

export const SELL_REFUND_RATIO = 0.7

export const totalInvested = (id: TowerId, level: number): number =>
  TOWERS[id].levels.slice(0, level).reduce((sum, lvl) => sum + lvl.cost, 0)

export const sellValue = (id: TowerId, level: number): number =>
  Math.floor(totalInvested(id, level) * SELL_REFUND_RATIO)
