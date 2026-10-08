import { isMultiChainSafeItem, type SafeItem, type MultiChainSafeItem } from '@/hooks/safes'
import { getChainIdsParam, useCurrentSpaceId } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useSpaceSafesDeleteV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useState } from 'react'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import { RemoveSafeDialogView } from '@views/features/spaces/components/SafeAccounts/RemoveSafeDialogView'

function getToBeDeletedSafeAccounts(safeItem: SafeItem | MultiChainSafeItem) {
  if (isMultiChainSafeItem(safeItem)) {
    return safeItem.safes.map((safe) => ({ chainId: safe.chainId, address: safe.address }))
  }

  return [{ chainId: safeItem.chainId, address: safeItem.address }]
}

const RemoveSafeDialog = ({
  safeItem,
  handleClose,
}: {
  safeItem: SafeItem | MultiChainSafeItem
  handleClose: () => void
}) => {
  const { address } = safeItem
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [removeSafeAccounts] = useSpaceSafesDeleteV1Mutation()
  const [hasError, setHasError] = useState(false)
  const isDarkMode = useDarkMode()

  const handleConfirm = async () => {
    const safeAccounts = getToBeDeletedSafeAccounts(safeItem)
    trackEvent(SPACE_EVENTS.DELETE_ACCOUNT, {
      [MixpanelEventParams.ACCOUNT_COUNT]: safeAccounts.length,
      [MixpanelEventParams.CHAIN_ID]: getChainIdsParam(safeAccounts),
    })

    try {
      const result = await removeSafeAccounts({
        spaceId: spaceId ?? '',
        deleteSpaceSafesDto: { safes: safeAccounts },
      })

      if (result.error) {
        throw result.error
      }

      safeAccounts.forEach(({ chainId, address }) => {
        trackEvent(
          { ...SPACE_EVENTS.WORKSPACE_SAFE_UNLINKED, label: spaceId },
          { workspace_id: spaceId, safe_address: address, chain_id: chainId },
        )
      })

      dispatch(
        showNotification({
          message: `Removed safe account from space`,
          variant: 'success',
          groupKey: 'remove-safe-account-success',
        }),
      )
    } catch (e) {
      if (isElevationRequiredError(e)) return
      setHasError(true)
    }
  }

  return (
    <RemoveSafeDialogView
      address={address}
      hasError={hasError}
      isDarkMode={isDarkMode}
      onClose={handleClose}
      onConfirm={handleConfirm}
    />
  )
}

export default RemoveSafeDialog
