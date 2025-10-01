import { useCallback, useContext, type ReactElement } from 'react'
import { Alert, AlertTitle, Button, Stack, Typography } from '@mui/material'
import { TxModalContext } from '@/components/tx-flow'
import { MigrateSafeL2Flow } from '@/components/tx-flow/flows'
import CheckWallet from '@/components/common/CheckWallet'
import useIsUpgradeableMasterCopy from '@/hooks/useIsUpgradeableMasterCopy'

const UnsupportedBaseContract = (): ReactElement | null => {
  const { setTxFlow } = useContext(TxModalContext)
  const isUpgradeableMasterCopy = useIsUpgradeableMasterCopy()

  const openUpgradeModal = useCallback(() => {
    setTxFlow(<MigrateSafeL2Flow />)
  }, [setTxFlow])

  if (isUpgradeableMasterCopy === undefined) {
    return null
  }

  if (!isUpgradeableMasterCopy) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        <AlertTitle>Unsupported base contract</AlertTitle>
        <Typography>
          Your Safe Account&apos;s base contract is not supported. Interacting with it from the web interface may not
          work correctly. We recommend using the Safe CLI instead.
        </Typography>
      </Alert>
    )
  }

  return (
    <Alert severity="warning" sx={{ mt: 2 }}>
      <AlertTitle>Unsupported base contract</AlertTitle>
      <Stack spacing={2}>
        <Typography>
          Your Safe Account&apos;s base contract is not supported. You should migrate it to a compatible version.
        </Typography>
        <CheckWallet>
          {(isOk) => (
            <Button variant="contained" onClick={openUpgradeModal} disabled={!isOk}>
              Migrate
            </Button>
          )}
        </CheckWallet>
      </Stack>
    </Alert>
  )
}

export default UnsupportedBaseContract
