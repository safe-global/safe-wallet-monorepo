import type { ArmorType, AttackType } from './types'

/** Warcraft-style attack vs armor table. */
export const DAMAGE_TABLE: Record<AttackType, Record<ArmorType, number>> = {
  scan: { unarmored: 1.25, light: 1.0, heavy: 0.7, fortified: 0.6 },
  impact: { unarmored: 0.9, light: 1.0, heavy: 1.4, fortified: 1.15 },
  magic: { unarmored: 1.0, light: 1.25, heavy: 0.9, fortified: 0.8 },
}

export const ATTACK_TYPE_LABEL: Record<AttackType, string> = {
  scan: 'Scan',
  impact: 'Impact',
  magic: 'Consensus',
}

export const ARMOR_TYPE_LABEL: Record<ArmorType, string> = {
  unarmored: 'Unarmored',
  light: 'Light',
  heavy: 'Heavy',
  fortified: 'Fortified',
}

/** Flat armor reduction, same curve as Warcraft 3: 6% per point with diminishing returns. */
export const armorReduction = (armorValue: number): number => {
  const k = armorValue * 0.06
  return k / (1 + k)
}

export const computeDamage = (
  baseDamage: number,
  attackType: AttackType,
  armorType: ArmorType,
  armorValue: number,
  bonusMultiplier = 1,
): number => {
  const typed = baseDamage * DAMAGE_TABLE[attackType][armorType]
  return Math.max(0, typed * (1 - armorReduction(armorValue)) * bonusMultiplier)
}
