import { useState, type ReactElement } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import type { SafeAnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { SeverityIcon } from '../SeverityIcon'
import AddTrustedSafeDialog from '@/features/myAccounts/components/NonPinnedWarning/AddTrustedSafeDialog'
import { useSimilarAddressDetection } from '@/features/myAccounts'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectAddressBookByChain } from '@/store/addressBookSlice'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { OVERVIEW_EVENTS, TRUSTED_SAFE_LABELS, trackEvent } from '@/services/analytics'

type UntrustedSafeWarningProps = {
  safeAnalysis: SafeAnalysisResult
  onAddToTrustedList: () => void
}

/**
 * Warning component displayed when the current Safe is not in the user's trusted list.
 * Shows the warning message and provides a button to add the Safe to the trusted list
 * with a confirmation dialog.
 */
const UntrustedSafeWarning = ({ safeAnalysis, onAddToTrustedList }: UntrustedSafeWarningProps): ReactElement => {
  const dispatch = useAppDispatch()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const { safe, safeAddress } = useSafeInfo()
  const chainId = safe?.chainId ?? ''
  const addressBook = useAppSelector((state) => selectAddressBookByChain(state, chainId))
  const safeName = safeAddress ? addressBook?.[safeAddress] : undefined
  const { hasSimilarAddress, similarAddresses } = useSimilarAddressDetection(safeAddress)

  const handleOpenConfirmDialog = () => {
    setIsConfirmDialogOpen(true)
    trackEvent({ ...OVERVIEW_EVENTS.TRUSTED_SAFES_ADD_SINGLE, label: TRUSTED_SAFE_LABELS.safe_shield })
  }
  const handleCloseConfirmDialog = () => setIsConfirmDialogOpen(false)
  const handleConfirmAddToTrustedList = (name: string) => {
    const canUpdateAddressBook = name && safeAddress && chainId
    if (canUpdateAddressBook) {
      dispatch(upsertAddressBookEntries({ chainIds: [chainId], address: safeAddress, name: name.trim() }))
    }
    onAddToTrustedList()
    setIsConfirmDialogOpen(false)
  }

  return (
    <>
      <Box data-testid="untrusted-safe-warning" sx={{ padding: '12px' }}>
        <Box sx={{ backgroundColor: 'background.main', borderRadius: '4px', p: 2 }}>
          <Stack direction="row" alignItems="flex-start" gap={1}>
            <SeverityIcon severity={safeAnalysis.severity} />
            <Stack gap={1} flex={1}>
              <Typography variant="body2" color="primary.light" fontWeight={500}>
                {safeAnalysis.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {safeAnalysis.description}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleOpenConfirmDialog}
                sx={{ alignSelf: 'flex-start', mt: 1 }}
              >
                Trust this Safe
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {safeAddress && (
        <AddTrustedSafeDialog
          open={isConfirmDialogOpen}
          safeAddress={safeAddress}
          safeName={safeName}
          chainId={chainId}
          hasSimilarAddress={hasSimilarAddress}
          similarAddresses={similarAddresses}
          onConfirm={handleConfirmAddToTrustedList}
          onCancel={handleCloseConfirmDialog}
        />
      )}
    </>
  )
}

export default UntrustedSafeWarning
