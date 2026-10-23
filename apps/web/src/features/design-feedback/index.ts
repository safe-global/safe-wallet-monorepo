import type { FeatureHandle } from '@/features/__core__'
import type implementation from './feature'

// A comment tool for design prototypes. Preview builds only.
export const DesignFeedbackFeature: FeatureHandle<typeof implementation> = {
  name: 'design-feedback',
  useIsEnabled: () => process.env.NEXT_PUBLIC_IS_PRODUCTION !== 'true',
  load: () => import('./feature'),
}

export type { FeedbackTarget, DesignFeedbackProps } from './types'
