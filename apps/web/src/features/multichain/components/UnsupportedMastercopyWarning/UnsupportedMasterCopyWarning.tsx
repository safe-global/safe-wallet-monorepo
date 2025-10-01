import { TxModalContext } from '@/components/tx-flow'
import { MigrateSafeL2Flow } from '@/components/tx-flow/flows'
import ErrorMessage from '@/components/tx/ErrorMessage'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsUpgradeableMasterCopy from '@/hooks/useIsUpgradeableMasterCopy'
import { Button, Stack, Typography } from '@mui/material'
import { useCallback, useContext } from 'react'
import CheckWallet from '@/components/common/CheckWallet'
import { isValidMasterCopy } from '@safe-global/utils/services/contracts/safeContracts'

export const UnsupportedMastercopyWarning = () => {
  const { safe } = useSafeInfo()
  const { isUpgradeable: isUpgradeableMasterCopy } = useIsUpgradeableMasterCopy()
  const isUnsupportedMasterCopy = !isValidMasterCopy(safe.implementationVersionState)

  const { setTxFlow } = useContext(TxModalContext)

  const openUpgradeModal = useCallback(() => setTxFlow(<MigrateSafeL2Flow />), [setTxFlow])

  if (!isUnsupportedMasterCopy || isUpgradeableMasterCopy === undefined) {
    return null
  }

  if (!isUpgradeableMasterCopy) {
    return (
      <ErrorMessage level="warning" title="Base contract is not supported">
        <Typography>
          Your Safe Account&apos;s base contract is not supported. Interacting with it from the web interface may not
          work correctly. We recommend using the Safe CLI instead.
        </Typography>
      </ErrorMessage>
    )
  }

  return (
    <ErrorMessage level="warning" title="Base contract is not supported">
      <Stack spacing={2}>
        <Typography display="inline" mr={1}>
          Your Safe Account&apos;s base contract is not supported. You should migrate it to a compatible version.
        </Typography>
        <CheckWallet>
          {(isOk) => (
            <Button variant="contained" style={{ textDecoration: 'none' }} onClick={openUpgradeModal} disabled={!isOk}>
              Migrate
            </Button>
          )}
        </CheckWallet>
      </Stack>
    </ErrorMessage>
  )
}
