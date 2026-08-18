import { FEATURES } from '@safe-global/utils/utils/chains'

/**
 * The flags this build declares — the single source of truth for "known" across the feature.
 *
 * Overrides are persisted, so they outlive the enum: a flag overridden on a branch that declares it
 * stays in localStorage after switching to a branch that never did. Every reader of the overrides
 * filters through here, so such a leftover is neither counted, applied to a chain, listed in the
 * editor, nor cleared by the branch that cannot see it.
 */
const KNOWN_FEATURES = new Set<string>(Object.values(FEATURES))

export const isKnownFeature = (feature: string): feature is FEATURES => KNOWN_FEATURES.has(feature)

// The flag list is a fixed enum, so sort it once at module scope rather than on every render.
export const SORTED_FEATURES: FEATURES[] = [...Object.values(FEATURES)].sort((a, b) => a.localeCompare(b))
