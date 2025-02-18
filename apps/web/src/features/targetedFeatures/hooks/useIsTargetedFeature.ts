import { useEffect } from 'react'

import { useIsOutreachSafe } from '@/features/targetedFeatures/hooks/useIsOutreachSafe'
import { useHasFeature } from '@/hooks/useChains'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { TARGETED_FEATURES } from '../constants'

const UNLOCKED_FEATURES_LS_KEY = 'unlockedFeatures'

type TargetedFeatures = (typeof TARGETED_FEATURES)[number]['feature']

export function useIsTargetedFeature(feature: TargetedFeatures): boolean {
  const hasFeature = useHasFeature(feature)

  const outreachId = TARGETED_FEATURES.find((f) => f.feature === feature)!.id
  const isTargeted = useIsOutreachSafe(outreachId)

  // Should a targeted Safe have been opened, we "unlock" the feature across the app
  const [unlockedFeatures = [], setUnlockedFeatures] =
    useLocalStorage<Array<TargetedFeatures>>(UNLOCKED_FEATURES_LS_KEY)
  const isUnlocked = unlockedFeatures.includes(feature)
  useEffect(() => {
    if (hasFeature && isTargeted && !isUnlocked) {
      setUnlockedFeatures([...unlockedFeatures, feature])
    }
  }, [feature, hasFeature, isTargeted, isUnlocked, setUnlockedFeatures, unlockedFeatures])

  return !!hasFeature && (isTargeted || isUnlocked)
}
