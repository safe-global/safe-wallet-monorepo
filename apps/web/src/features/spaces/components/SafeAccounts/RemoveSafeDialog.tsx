import ModalDialog from '@/components/common/ModalDialog'
import { isMultiChainSafeItem, type SafeItem, type MultiChainSafeItem } from '@/hooks/safes'
import { useCurrentSpaceId } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useSpaceSafesDeleteV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useState } from 'react'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'

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
  const [error, setError] = useState('')
  const isDarkMode = useDarkMode()

  const handleConfirm = async () => {
    const safeAccounts = getToBeDeletedSafeAccounts(safeItem)
    trackEvent({ ...SPACE_EVENTS.DELETE_ACCOUNT })

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
      setError('Error removing safe account.')
    }
  }

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Remove Safe account" hideChainIndicator>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <div className="p-6">
          <Typography variant="paragraph">
            Are you sure you want to remove <b>{address}</b> from this space?
          </Typography>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 pb-6">
          <Button variant="ghost" data-testid="cancel-btn" onClick={handleClose}>
            Cancel
          </Button>
          <Button data-testid="delete-btn" onClick={handleConfirm} variant="destructive">
            Remove
          </Button>
        </div>
      </div>
    </ModalDialog>
  )
}

export default RemoveSafeDialog
