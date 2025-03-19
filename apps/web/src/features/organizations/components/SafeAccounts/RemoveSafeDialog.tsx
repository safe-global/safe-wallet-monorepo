import ModalDialog from '@/components/common/ModalDialog'
import { isMultiChainSafeItem } from '@/features/multichain/utils/utils'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import type { MultiChainSafeItem } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { useCurrentOrgId } from '@/features/organizations/hooks/useCurrentOrgId'
import { trackEvent } from '@/services/analytics'
import { ORG_EVENTS } from '@/services/analytics/events/organizations'
import { Alert } from '@mui/material'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'
import { useOrganizationSafesDeleteV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useState } from 'react'

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
  const orgId = useCurrentOrgId()
  const [removeSafeAccounts] = useOrganizationSafesDeleteV1Mutation()
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    const safeAccounts = getToBeDeletedSafeAccounts(safeItem)
    trackEvent({ ...ORG_EVENTS.DELETE_ACCOUNT })

    try {
      const result = await removeSafeAccounts({
        organizationId: Number(orgId),
        deleteOrganizationSafesDto: { safes: safeAccounts },
      })

      if (result.error) {
        throw result.error
      }
    } catch (e) {
      setError('Error removing safe account.')
    }
  }

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Remove Safe Account" hideChainIndicator>
      <DialogContent sx={{ p: '24px !important' }}>
        <Typography>
          Are you sure you want to remove <b>{address}</b> from this organization?
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button data-testid="cancel-btn" onClick={handleClose}>
          Cancel
        </Button>
        <Button data-testid="delete-btn" onClick={handleConfirm} variant="danger" disableElevation>
          Remove
        </Button>
      </DialogActions>
    </ModalDialog>
  )
}

export default RemoveSafeDialog
