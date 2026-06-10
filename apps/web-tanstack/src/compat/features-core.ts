// Vite-only replacement for apps/web/src/features/__core__/index.ts.
// The original barrel re-exports `createFeatureHandle` from a relative
// path which can't be intercepted by Vite aliases; this fork re-exports
// everything from the original barrel but swaps in the Vite-native
// createFeatureHandle that uses import.meta.glob.

export type { FeatureHandle, FeatureImplementation } from '@/features/__core__/types'
export { useLoadFeature } from '@/features/__core__/useLoadFeature'
export { createFeatureHandle } from './createFeatureHandle'
