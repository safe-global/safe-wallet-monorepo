import type {
  AttackType,
  TargetingMode,
  DotEffect,
  EnemyDef,
  EnemyId,
  GridCell,
  ProjectileKind,
  SlowEffect,
  TowerDef,
  TowerId,
  Vec2,
} from '../config/types'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export type Phase = 'building' | 'wave' | 'won' | 'lost'

export interface EnemyState {
  uid: number
  def: EnemyDef
  wave: number
  hp: number
  maxHp: number
  hpMult: number
  dist: number
  pos: Vec2
  slowFactor: number
  slowUntil: number
  stunUntil: number
  dotDps: number
  dotUntil: number
  shieldHits: number
  shieldRegenAt: number
  revealedUntil: number
  summonAt: number
  spawnedAt: number
}

export interface TowerState {
  uid: number
  def: TowerDef
  level: number
  cell: GridCell
  pos: Vec2
  cooldownLeft: number
  targetUid: number | null
  kills: number
  damageDealt: number
  builtAt: number
  targeting: TargetingMode
}

export interface ProjectileState {
  uid: number
  kind: ProjectileKind
  towerId: TowerId
  towerUid: number
  pos: Vec3
  targetUid: number
  lastTargetPos: Vec3
  speed: number
  damage: number
  attackType: AttackType
  bonus: number
  splash: number
  slow?: SlowEffect
  dot?: DotEffect
  color: number
}

export interface SpawnEntry {
  time: number
  enemy: EnemyId
  hpMult: number
  wave: number
}

export type SimEvent =
  | { type: 'shot'; towerUid: number; towerId: TowerId; from: Vec3; kind: ProjectileKind }
  | { type: 'hit'; pos: Vec3; color: number; kind: ProjectileKind; splash: number }
  | { type: 'beam'; points: Vec3[]; color: number }
  | { type: 'pulse'; pos: Vec2; radius: number; color: number; towerId: TowerId }
  | { type: 'shieldBlock'; pos: Vec2 }
  | { type: 'death'; pos: Vec2; enemyId: EnemyId; bounty: number; boss: boolean; scale: number; color: number }
  | { type: 'leak'; pos: Vec2; drain: number; enemyId: EnemyId }
  | { type: 'spawn'; enemyId: EnemyId; pos: Vec2; boss: boolean }
  | { type: 'build'; pos: Vec2; towerId: TowerId }
  | { type: 'upgrade'; pos: Vec2; towerId: TowerId; level: number }
  | { type: 'sell'; pos: Vec2; refund: number }
  | { type: 'waveStart'; index: number; title: string; earlyBonus: number }
  | { type: 'waveCleared'; index: number; bonus: number; income: number }
  | { type: 'won' }
  | { type: 'lost' }

export interface PlacementResult {
  ok: boolean
  reason?: 'outside' | 'path' | 'blocked' | 'occupied' | 'gold' | 'phase'
}
