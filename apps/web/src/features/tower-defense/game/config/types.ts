export type Difficulty = 'testnet' | 'mainnet' | 'darkForest'

export type ArmorType = 'unarmored' | 'light' | 'heavy' | 'fortified'
export type AttackType = 'scan' | 'impact' | 'magic'
export type TargetMode = 'ground' | 'air' | 'both' | 'none'

export type TowerId =
  | 'shield'
  | 'hypernative'
  | 'multisig'
  | 'simulator'
  | 'safenet'
  | 'timelock'
  | 'recovery'
  | 'guard'

export type EnemyId =
  | 'phisher'
  | 'dust'
  | 'poisoner'
  | 'drainer'
  | 'blindSigner'
  | 'lazarus'
  | 'socialEngineer'
  | 'delegatecall'
  | 'mevBot'
  | 'spoofedUi'
  | 'approvalHijacker'
  | 'rugWhale'
  | 'supplyWorm'
  | 'lazarusCommander'

export type ProjectileKind = 'bolt' | 'shell' | 'tracer' | 'dart'

export interface GridCell {
  c: number
  r: number
}

export interface Vec2 {
  x: number
  z: number
}

export interface SlowEffect {
  factor: number
  duration: number
}

export interface DotEffect {
  dps: number
  duration: number
}

export interface TowerLevel {
  cost: number
  damage: number
  range: number
  cooldown: number
  projectileSpeed?: number
  splash?: number
  slow?: SlowEffect
  chain?: number
  dot?: DotEffect
  stun?: number
  auraDamageBonus?: number
  income?: number
  detectRange?: number
}

export interface TowerDef {
  id: TowerId
  name: string
  tagline: string
  description: string
  attackType: AttackType
  targets: TargetMode
  projectile: ProjectileKind | 'beam' | 'pulse' | 'none'
  hotkey: string
  color: number
  levels: [TowerLevel, TowerLevel, TowerLevel]
}

export interface SplitSpawn {
  enemy: EnemyId
  count: number
}

export interface EnemyDef {
  id: EnemyId
  name: string
  description: string
  hp: number
  speed: number
  armor: ArmorType
  armorValue: number
  bounty: number
  drain: number
  scale: number
  color: number
  flying?: boolean
  stealth?: boolean
  shieldHits?: number
  shieldRegenSeconds?: number
  regen?: number
  splitsInto?: SplitSpawn
  summons?: { enemy: EnemyId; count: number; everySeconds: number }
  boss?: boolean
}

export interface WaveGroup {
  enemy: EnemyId
  count: number
  interval: number
  delay: number
}

export interface WaveDef {
  index: number
  title: string
  intel: string
  hpMultiplier: number
  groups: WaveGroup[]
}

export interface DifficultyDef {
  id: Difficulty
  name: string
  description: string
  startingGold: number
  treasury: number
  hpMultiplier: number
  bountyMultiplier: number
  buildTime: number
}
