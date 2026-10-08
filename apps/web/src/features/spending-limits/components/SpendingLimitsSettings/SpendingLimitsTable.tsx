import EthHashInfo from '@/components/common/EthHashInfo'
import { useCallback, useContext } from 'react'
import type { SpendingLimitState } from '../../types'
import { RemoveSpendingLimitFlow } from '@/components/tx-flow/flows'
import { TxModalContext } from '@/components/tx-flow'
import CheckWallet from '@/components/common/CheckWallet'
import { SpendingLimitsTableView } from '@views/features/spending-limits/components/SpendingLimitsSettings/SpendingLimitsTableView'

export const SpendingLimitsTable = ({
  spendingLimits,
  isLoading,
}: {
  spendingLimits: SpendingLimitState[]
  isLoading: boolean
}) => {
  const { setTxFlow } = useContext(TxModalContext)

  const onRemove = useCallback(
    (spendingLimit: SpendingLimitState) => setTxFlow(<RemoveSpendingLimitFlow spendingLimit={spendingLimit} />),
    [setTxFlow],
  )

  const renderBeneficiary = useCallback(
    (address: string) => <EthHashInfo address={address} shortAddress={false} hasExplorer showCopyButton />,
    [],
  )

  const renderCheckWallet = useCallback(
    (children: Parameters<typeof CheckWallet>[0]['children']) => <CheckWallet>{children}</CheckWallet>,
    [],
  )

  return (
    <SpendingLimitsTableView
      spendingLimits={spendingLimits}
      isLoading={isLoading}
      onRemove={onRemove}
      renderBeneficiary={renderBeneficiary}
      renderCheckWallet={renderCheckWallet}
    />
  )
}
