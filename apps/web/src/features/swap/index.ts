import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { SwapContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// FEATURE HANDLE (lazy-loads components and services)
// ─────────────────────────────────────────────────────────────────

// Feature flag already mapped in createFeatureHandle: swap → FEATURES.NATIVE_SWAPS
export const SwapFeature = createFeatureHandle<SwapContract>('swap')

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

export * from './constants'
