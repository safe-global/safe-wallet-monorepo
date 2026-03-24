import type { FeatureHandle } from '@/features/__core__/types'
import type { GTFContract } from './contract'

// GTF is always enabled during prelaunch (no CGW config service dependency)
// TODO: switch to createFeatureHandle('gtf') when FEATURES.GTF is in the chain config
export const GTFFeature: FeatureHandle<GTFContract> = {
  name: 'gtf',
  useIsEnabled: () => true,
  load: () => import(/* webpackMode: "lazy" */ './feature') as Promise<{ default: GTFContract }>,
}

export type { GTFContract } from './contract'
export { useFeesPreview } from './hooks/useFeesPreview'
