/**
 * Actions Tray Feature - Public API
 *
 * Provides Send, Swap, and Receive action buttons.
 * Always enabled (no feature flag).
 *
 * @example
 * ```typescript
 * import { ActionsTrayFeature } from '@/features/actions-tray'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const { ActionsTray } = useLoadFeature(ActionsTrayFeature)
 *   return <ActionsTray noAssets={false} />
 * }
 * ```
 */
import type { FeatureHandle } from '@/features/__core__'
import type { ActionsTrayContract } from './contract'

export type { ActionsTrayContract } from './contract'

export { default as ActionsTray } from './components/ActionsTray'

export const ActionsTrayFeature: FeatureHandle<ActionsTrayContract> = {
  name: 'actions-tray',
  useIsEnabled: () => true,
  load: () => import(/* webpackMode: "lazy" */ './feature') as Promise<{ default: ActionsTrayContract }>,
}
