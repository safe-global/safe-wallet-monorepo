import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { StakeContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// FEATURE HANDLE (lazy-loads components and services)
// ─────────────────────────────────────────────────────────────────

// Feature flag already mapped in createFeatureHandle: stake → FEATURES.STAKING
export const StakeFeature = createFeatureHandle<StakeContract>('stake')

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

export * from './constants'
