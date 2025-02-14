import { useEffect } from 'react'
import { useTargetedMessagingGetTargetedSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/targeted-messages'

import { useHasFeature } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { sameAddress } from '@/utils/addresses'
import { TARGETED_FEATURES } from '../constants'

const UNLOCKED_FEATURES_LS_KEY = 'unlockedFeatures'

export function useIsTargetedSafe(outreachId: (typeof TARGETED_FEATURES)[number]['id']): boolean {
  const { safe } = useSafeInfo()
  const { data } = useTargetedMessagingGetTargetedSafeV1Query(
    {
      outreachId,
      chainId: safe.chainId,
      safeAddress: safe.address.value,
    },
    { skip: !safe.address.value },
  )

  return data?.outreachId === outreachId && sameAddress(data.address, safe.address.value)
}

type TargetedFeatures = (typeof TARGETED_FEATURES)[number]['feature']

export function useIsTargetedFeature(feature: TargetedFeatures): boolean {
  const hasFeature = useHasFeature(feature)

  const outreachId = TARGETED_FEATURES.find((f) => f.feature === feature)!.id
  const isTargeted = useIsTargetedSafe(outreachId)

  // Should a targeted Safe have been opened, we "unlock" the feature across the app
  const [unlockedFeatures = [], setUnlockedFeatures] =
    useLocalStorage<Array<TargetedFeatures>>(UNLOCKED_FEATURES_LS_KEY)
  const isUnlocked = unlockedFeatures.includes(feature)
  useEffect(() => {
    if (hasFeature && isTargeted && !isUnlocked) {
      setUnlockedFeatures([...unlockedFeatures, feature])
    } else {
      setUnlockedFeatures(unlockedFeatures.filter((f) => f !== feature))
    }
  }, [feature, hasFeature, isTargeted, isUnlocked, setUnlockedFeatures, unlockedFeatures])

  return !!hasFeature && (isTargeted || isUnlocked)
}
