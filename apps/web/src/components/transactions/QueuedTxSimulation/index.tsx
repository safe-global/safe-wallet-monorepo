import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { createExistingTx } from '@/services/tx/tx-sender'
import useChainId from '@/hooks/useChainId'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useSimulation } from '@/components/tx/security/tenderly/useSimulation'
import TenderlyIcon from '@/public/images/transactions/tenderly-small.svg'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { useSigner } from '@/hooks/wallets/useWallet'
import ExternalLink from '@/components/common/ExternalLink'
import CheckIcon from '@/public/images/common/check.svg'
import CloseIcon from '@/public/images/common/close.svg'
import WarningIcon from '@/public/images/notifications/warning.svg'
import { getSimulationStatus, isTxSimulationEnabled } from '@safe-global/utils/components/tx/security/tenderly/utils'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useMemo } from 'react'
import { useCurrentChain } from '@/hooks/useChains'

const getSimulationIcon = (isCallTraceError: boolean, isSuccess: boolean) => {
  if (isCallTraceError) {
    return { color: 'var(--color-warning-main)', Component: WarningIcon }
  }
  if (isSuccess) {
    return { color: 'var(--color-success-main)', Component: CheckIcon }
  }
  return { color: 'var(--color-error-main)', Component: CloseIcon }
}

const getSimulationStatusText = (isCallTraceError: boolean, isSuccess: boolean) => {
  if (isCallTraceError) {
    return 'Can execute (with warnings)'
  }
  if (isSuccess) {
    return 'Simulation successful'
  }
  return 'Simulation failed'
}

const CompactSimulationButton = ({
  label,
  iconComponent,
  disabled = false,
  onClick,
}: {
  label: string
  iconComponent: React.ReactNode
  disabled?: boolean
  onClick?: () => void
}) => {
  return (
    <Button
      variant="ghost"
      disabled={disabled}
      // visibility is required as the icon otherwise disappears when the first tx accordion is closed
      // eslint-disable-next-line no-restricted-syntax -- inline simulation toggle: custom size + surface bg; pending a variant
      className="flex flex-row items-center gap-1 rounded-lg !visible h-auto bg-[var(--color-background-main)] py-1 hover:bg-[var(--color-background-main)]"
      onClick={onClick}
    >
      {iconComponent}
      <Typography variant="paragraph-small-bold">{label}</Typography>
    </Button>
  )
}

const InlineTxSimulation = ({ transaction }: { transaction: TransactionDetails }) => {
  const { safe } = useSafeInfo()
  const isSafeOwner = useIsSafeOwner()
  const isNestedSafeOwner = useIsNestedSafeOwner()
  const chainId = useChainId()
  const signer = useSigner()
  const sdk = useSafeSDK()

  const canSimulate = isSafeOwner || isNestedSafeOwner

  const [safeTransaction, safeTransactionError] = useAsync(
    () => (sdk ? createExistingTx(chainId, transaction.txId, transaction) : undefined),
    [chainId, transaction, sdk],
  )

  const executionOwner = useMemo(
    () =>
      safe.owners.some((owner) => sameAddress(owner.value, signer?.address)) ? signer?.address : safe.owners[0]?.value,
    [safe.owners, signer?.address],
  )

  const simulation = useSimulation()
  const { simulationLink, simulateTransaction } = simulation
  const status = simulation ? getSimulationStatus(simulation) : undefined

  const handleSimulation = () => {
    if (safeTransaction && executionOwner) {
      simulateTransaction({ executionOwner, transactions: safeTransaction, safe: safe as SafeState })
    }
  }

  if (safeTransactionError || !canSimulate || !executionOwner) {
    return null
  }

  if (status?.isLoading) {
    return <CompactSimulationButton label="Simulating" iconComponent={<Spinner className="size-4" />} disabled={true} />
  }

  if (!status?.isFinished) {
    return (
      <CompactSimulationButton
        label="Simulate"
        iconComponent={<TenderlyIcon className="h-4" />}
        disabled={!safeTransaction}
        onClick={handleSimulation}
      />
    )
  }

  if (status?.isFinished && !status.isError) {
    const { color, Component } = getSimulationIcon(status.isCallTraceError, status.isSuccess)
    return (
      <ExternalLink href={simulationLink}>
        <div className="flex flex-row items-center gap-1">
          <Component className="h-4" style={{ color }} />
          {getSimulationStatusText(status.isCallTraceError, status.isSuccess)}
        </div>
      </ExternalLink>
    )
  }

  if (status?.isError) {
    return (
      <div className="flex flex-row items-center gap-1">
        <CloseIcon className="h-4 text-[var(--color-error-main)]" />
        Error while simulating
      </div>
    )
  }

  return null
}

export const QueuedTxSimulation = ({ transaction }: { transaction: TransactionDetails }) => {
  const chain = useCurrentChain()

  if (!chain || !isTxSimulationEnabled(chain)) {
    return null
  }

  return <InlineTxSimulation transaction={transaction} />
}
