import { useMemo, type ReactElement } from 'react'
import type { TransactionData } from '@safe-global/safe-gateway-typescript-sdk'
import ExternalLink from '@/components/common/ExternalLink'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getExplorerLink } from '@/utils/gateway'
import ErrorMessage from '../ErrorMessage'
import { isMigrationToL2Possible, isValidMasterCopy } from '@/services/contracts/safeContracts'
import { AlertTitle, Typography } from '@mui/material'
import { isMigrateL2SingletonCall } from '@/utils/safe-migrations'

const UnknownContractError = ({ txData }: { txData: TransactionData | undefined }): ReactElement | null => {
  const { safe, safeAddress } = useSafeInfo()
  const currentChain = useCurrentChain()

  const isMigrationTx = useMemo((): boolean => {
    return txData !== undefined && isMigrateL2SingletonCall(txData)
  }, [txData])

  // Unsupported base contract
  const isUnknown = !isValidMasterCopy(safe.implementationVersionState)
  const isMigrationPossible = isMigrationToL2Possible(safe)

  if (!isUnknown || isMigrationTx) return null

  return (
    <ErrorMessage level="error">
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
        <>
          The Safe Account can be migrated to use the supported base contract. We advise to do that in the Safe&apos;s
          settings before executing other transactions.
        </>
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
