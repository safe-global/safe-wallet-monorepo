import { TxModalContext } from '@/components/tx-flow'
import { MigrateSafeL2Flow } from '@/components/tx-flow/flows'
import ErrorMessage from '@/components/tx/ErrorMessage'
import useSafeInfo from '@/hooks/useSafeInfo'
import { isMigrationToL2Possible } from '@/services/contracts/safeContracts'
import { Button, Stack, Typography } from '@mui/material'
import { useCallback, useContext } from 'react'
import { isValidMasterCopy } from '@safe-global/utils/services/contracts/safeContracts'

export const UnsupportedMastercopyWarning = () => {
  const { safe } = useSafeInfo()

  const showWarning = !isValidMasterCopy(safe.implementationVersionState) && isMigrationToL2Possible(safe)

  const { setTxFlow } = useContext(TxModalContext)

  const openUpgradeModal = useCallback(() => setTxFlow(<MigrateSafeL2Flow />), [setTxFlow])

  if (!showWarning) return

  return (
    <ErrorMessage level="warning" title="Base contract is not supported">
      <Stack spacing={2}>
        <Typography display="inline" mr={1}>
          Your Safe Account&apos;s base contract is not supported. You should migrate it to a compatible version.
        </Typography>
        <div>
          <Button variant="contained" onClick={openUpgradeModal}>
            Migrate
          </Button>
        </div>
      </Stack>
    </ErrorMessage>
  )
}
