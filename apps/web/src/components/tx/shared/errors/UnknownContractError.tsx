import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useMemo, type ReactElement } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { isSafeMigrationCall } from '@/utils/safe-migrations'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import { useMastercopyMigration } from '@/features/multichain'
import { UnknownContractErrorView } from '@views/components/tx/shared/errors/UnknownContractErrorView'

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
    <UnknownContractErrorView
      isMigrationPossible={isMigrationPossible}
      explorerHref={currentChain ? getExplorerLink(safeAddress, currentChain.blockExplorerUriTemplate).href : ''}
      chainName={currentChain?.chainName}
    />
  )
}

export default UnknownContractError
