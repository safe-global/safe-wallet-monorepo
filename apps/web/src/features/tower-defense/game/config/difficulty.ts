import type { Difficulty, DifficultyDef } from './types'

export const DIFFICULTIES: Record<Difficulty, DifficultyDef> = {
  testnet: {
    id: 'testnet',
    name: 'Testnet',
    description: 'Relaxed. Attackers are weaker and you start with extra SAFE and a deeper treasury.',
    startingGold: 360,
    treasury: 25,
    hpMultiplier: 0.8,
    bountyMultiplier: 1.1,
    buildTime: 35,
  },
  mainnet: {
    id: 'mainnet',
    name: 'Mainnet',
    description: 'The intended experience. Real funds, real attackers.',
    startingGold: 300,
    treasury: 20,
    hpMultiplier: 1,
    bountyMultiplier: 1,
    buildTime: 30,
  },
  darkForest: {
    id: 'darkForest',
    name: 'Dark forest',
    description: 'Every mempool is hostile. Tougher attackers, tighter budgets and less time between waves.',
    startingGold: 250,
    treasury: 15,
    hpMultiplier: 1.3,
    bountyMultiplier: 0.9,
    buildTime: 22,
  },
}

export const DIFFICULTY_ORDER: Difficulty[] = ['testnet', 'mainnet', 'darkForest']
