import { useState } from 'react'
import type { ReactElement } from 'react'

import { NestedSafesPopover } from '@/components/nested-safes/NestedSafesPopover'
import { useOwnersGetSafesByOwnerV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { useHasFeature } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useNestedSafesVisibility } from '@/hooks/useNestedSafesVisibility'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useIsSafeBarControlDisabled } from '@/hooks/useIsSafeBarControlDisabled'
import { SpaceNestedSafesButtonView } from '@views/components/common/SpaceSafeBar/SpaceNestedSafesButtonView'

function SpaceNestedSafesButton(): ReactElement | null {
  const { safe } = useSafeInfo()
  const { chainId } = safe
  const safeAddress = safe.address.value
  const isEnabled = useHasFeature(FEATURES.NESTED_SAFES)
  const isDisabled = useIsSafeBarControlDisabled()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const { currentData: ownedSafes } = useOwnersGetSafesByOwnerV1Query(
    { chainId, ownerAddress: safeAddress },
    { skip: !isEnabled || !safeAddress },
  )
  const rawNestedSafes = ownedSafes?.safes ?? []
  const { visibleSafes, allSafesWithStatus, hasCompletedCuration, isLoading, startFiltering, hasStarted } =
    useNestedSafesVisibility(rawNestedSafes, chainId)

  if (!isEnabled || !safe.deployed) {
    return null
  }

  const displayCount = hasStarted && !isLoading ? visibleSafes.length : rawNestedSafes.length

  const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    startFiltering()
  }

  const onClose = () => {
    setAnchorEl(null)
  }

  return (
    <SpaceNestedSafesButtonView
      isDisabled={isDisabled}
      displayCount={displayCount}
      onClick={onClick}
      popover={
        <NestedSafesPopover
          anchorEl={anchorEl}
          onClose={onClose}
          rawNestedSafes={rawNestedSafes}
          allSafesWithStatus={allSafesWithStatus}
          visibleSafes={visibleSafes}
          hasCompletedCuration={hasCompletedCuration}
          isLoading={isLoading}
          centered
        />
      }
    />
  )
}

export default SpaceNestedSafesButton
