/**
 * Gnosis Pay Feature Implementation - LAZY LOADED
 *
 * This file is lazy-loaded via the `GnosisPayFeature` handle in `index.ts`.
 * Use direct imports — do NOT use `lazy()` / `dynamic()` here. Pulling in
 * `@gnosis.pm/zodiac`, `getDelayModifierContract`, the form, the queue, and
 * the per-tx warnings into a single deferred chunk is the whole point.
 */
import type { GnosisPayContract } from './contract'

import GnosisPayBanner from './GnosisPayBanner'
import GnosisPayQueue from './GnosisPayQueue'
import GnosisPayExecutionForm from './GnosisPayExecutionForm'

export default {
  GnosisPayBanner,
  GnosisPayQueue,
  GnosisPayExecutionForm,
} satisfies GnosisPayContract
