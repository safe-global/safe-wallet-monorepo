import type { Difficulty } from '../game/config/types'

const KEY = 'safe-td-best-scores'

export type BestScores = Partial<Record<Difficulty, { score: number; wave: number; won: boolean }>>

export const loadBestScores = (): BestScores => {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as BestScores) : {}
  } catch {
    return {}
  }
}

export const recordScore = (
  difficulty: Difficulty,
  entry: { score: number; wave: number; won: boolean },
): { best: BestScores; isNewBest: boolean } => {
  const best = loadBestScores()
  const previous = best[difficulty]
  const isNewBest = !previous || entry.score > previous.score
  if (isNewBest) best[difficulty] = entry
  try {
    localStorage.setItem(KEY, JSON.stringify(best))
  } catch {
    // storage unavailable – scores just aren't persisted
  }
  return { best, isNewBest }
}
