import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useMemo, type ReactElement } from 'react'
import ExternalLink from '@/components/common/ExternalLink'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { AlertTitle, Typography } from '@mui/material'
import { isSafeMigrationCall } from '@/utils/safe-migrations'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import { useMastercopyMigration } from '@/features/multichain'

const UnknownContractError = ({ txData }: { txData: TransactionData | undefined }): ReactElement | null => {
  const { safeAddress } = useSafeInfo()
  const currentChain = useCurrentChain()
  const { action } = useMastercopyMigration()

  const isMigrationTx = useMemo((): boolean => {
    return txData !== undefined && isSafeMigrationCall(txData)
  }, [txData])

  // Unsupported base contract
  const isUnknown = action === 'migrate' || action === 'cli'

  const isMigrationPossible = action === 'migrate'

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
          This Safe account was created with an unsupported base contract.
        </Typography>
      </AlertTitle>
      {isMigrationPossible ? (
        <>
          The Safe account can be migrated to use the supported base contract. We advise to do that in the Safe&apos;s
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
