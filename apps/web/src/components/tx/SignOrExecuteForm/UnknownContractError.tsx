import { useCallback, useContext, useMemo, type ReactElement } from 'react'
import type { TransactionData } from '@safe-global/safe-gateway-typescript-sdk'
import ExternalLink from '@/components/common/ExternalLink'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getExplorerLink } from '@/utils/gateway'
import ErrorMessage from '../ErrorMessage'
import { isMigrationToL2Possible, isValidMasterCopy } from '@/services/contracts/safeContracts'
import { AlertTitle, Box, Button, Stack, Typography } from '@mui/material'
import { isMigrateL2SingletonCall } from '@/features/multichain/utils/extract-migration-data'
import { TxModalContext } from '@/components/tx-flow'
import MigrateSafeL2Flow from '@/components/tx-flow/flows/MigrateSafeL2'

const UnknownContractError = ({ txData }: { txData: TransactionData | undefined }): ReactElement | null => {
  const { safe, safeAddress } = useSafeInfo()
  const currentChain = useCurrentChain()

  const { setTxFlow } = useContext(TxModalContext)
  const isMigrationTx = useMemo((): boolean => {
    return txData !== undefined && isMigrateL2SingletonCall(txData)
  }, [txData])

  const createAndSetMigrationTx = useCallback(() => {
    setTxFlow(<MigrateSafeL2Flow />, undefined, false)
  }, [setTxFlow])

  // Unsupported base contract
  const isUnknown = !isValidMasterCopy(safe.implementationVersionState)

  if (!isUnknown || isMigrationTx) return null

  const isMigrationPossible = isMigrationToL2Possible(safe)

  return (
    <ErrorMessage level={isMigrationPossible ? 'info' : 'error'}>
      <AlertTitle>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
          }}
        >
          This Safe Account was created with an unsupported base contract.
        </Typography>
      </AlertTitle>
      {isMigrationPossible ? (
        <Stack spacing={2}>
          <Typography>
            It is possible to migrate it to a compatible base contract. This will restore its full functionalities. This
            requires transaction to the SafeMigration contract to set the correct base contract.
          </Typography>
          <Box>
            <Button variant="contained" onClick={createAndSetMigrationTx}>
              Migrate Safe contract
            </Button>
          </Box>
        </Stack>
      ) : (
        <>
          It should <b>ONLY</b> be used for fund recovery. Transactions will execute but the transaction list may not
          update. Transaction success can be verified on the{' '}
          <ExternalLink
            href={currentChain ? getExplorerLink(safeAddress, currentChain.blockExplorerUriTemplate).href : ''}
          >
            {currentChain?.chainName} explorer
          </ExternalLink>
          .
        </>
      )}
    </ErrorMessage>
  )
}

export default UnknownContractError
