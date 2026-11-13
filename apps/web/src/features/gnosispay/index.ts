/**
 * Gnosis Pay Feature - Public API
 *
 * Lazy-loaded. The handle (`GnosisPayFeature`) is tiny and always bundled.
 * Components (`GnosisPayBanner`, `GnosisPayQueue`, `GnosisPayExecutionForm`)
 * and the heavy `@gnosis.pm/zodiac` dependency only load when a Gnosis Pay
 * safe is detected via `useIsGnosisPaySafe()`.
 *
 * @example
 * ```typescript
 * import { GnosisPayFeature, useIsGnosisPaySafe } from '@/features/gnosispay'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const feature = useLoadFeature(GnosisPayFeature)
 *   return <feature.GnosisPayBanner />  // Stub returns null on non-GP safes
 * }
 * ```
 *
 * Hooks below are exported directly (always bundled, lightweight). They do
 * NOT import `@gnosis.pm/zodiac` or the protocol-kit heavy paths.
 */
import type { FeatureHandle } from '@/features/__core__'
import type { GnosisPayContract } from './contract'
import { useIsGnosisPaySafe } from './hooks/useIsGnosisPaySafe'

export const GnosisPayFeature: FeatureHandle<GnosisPayContract> = {
  name: 'gnosispay',
  // Gate on the safe detector so non–Gnosis Pay sessions never fetch the chunk.
  useIsEnabled: () => {
    const [isGnosisPaySafe] = useIsGnosisPaySafe()
    return Boolean(isGnosisPaySafe)
  },
  load: () => import(/* webpackMode: "lazy" */ './feature') as Promise<{ default: GnosisPayContract }>,
}

// Lightweight hooks — always bundled, no zodiac.
export { useIsGnosisPaySafe } from './hooks/useIsGnosisPaySafe'
export { useGnosisPayDelayModule } from './hooks/useGnosisPayDelayModule'

export type { GnosisPayContract } from './contract'
