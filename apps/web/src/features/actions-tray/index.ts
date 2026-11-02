import type { FeatureHandle } from '@/features/__core__/types'
import type { ActionsTrayContract } from './contract'

export { default as ActionsTray } from './components/ActionsTray'

export const ActionsTrayFeature: FeatureHandle<ActionsTrayContract> = {
  name: 'actions-tray',
  useIsEnabled: () => true,
  load: () => import(/* webpackMode: "lazy" */ './feature') as Promise<{ default: ActionsTrayContract }>,
}
