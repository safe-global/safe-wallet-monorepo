import { ARMOR_TYPE_LABEL, ATTACK_TYPE_LABEL, DAMAGE_TABLE } from '../game/config/combat'
import type { EnemyDef, TowerDef, TowerLevel } from '../game/config/types'

export const TARGET_LABEL: Record<TowerDef['targets'], string> = {
  ground: 'Ground only',
  air: 'Air only',
  both: 'Ground & air',
  none: 'Support',
}

/** Human readable summary of a tower level's special effect. */
export const describeSpecial = (def: TowerDef, level: TowerLevel): string => {
  const parts: string[] = []
  if (level.splash) parts.push(`Splash ${level.splash.toFixed(1)} tiles`)
  if (level.slow) parts.push(`Slows to ${Math.round(level.slow.factor * 100)}% for ${level.slow.duration}s`)
  if (level.chain) parts.push(`Chains to ${level.chain} targets`)
  if (level.dot) parts.push(`Drains ${level.dot.dps}/s for ${level.dot.duration}s`)
  if (level.stun) parts.push(`Freezes for ${level.stun}s`)
  if (level.detectRange) parts.push('Reveals stealth')
  if (level.auraDamageBonus) parts.push(`+${Math.round(level.auraDamageBonus * 100)}% damage aura`)
  if (level.income) parts.push(`+${level.income} SAFE per wave`)
  if (parts.length === 0) parts.push(def.attackType === 'scan' ? 'Reliable single target' : 'No special effect')
  return parts.join(' · ')
}

export const attackTypeLabel = (def: TowerDef): string => ATTACK_TYPE_LABEL[def.attackType]

export const armorLabel = (def: EnemyDef): string => `${ARMOR_TYPE_LABEL[def.armor]} (${def.armorValue})`

/** Which attack types are strong against an enemy's armor (multiplier > 1). */
export const strongAgainst = (def: EnemyDef): string[] =>
  (Object.keys(DAMAGE_TABLE) as Array<keyof typeof DAMAGE_TABLE>)
    .filter((attack) => DAMAGE_TABLE[attack][def.armor] > 1)
    .map((attack) => ATTACK_TYPE_LABEL[attack])
