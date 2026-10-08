import type { CustomTransactionInfo, TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactElement } from 'react'
import React, { useMemo } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useCurrentChain } from '@/hooks/useChains'
import useBalances from '@/hooks/useBalances'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SpendingLimitMethods } from '@/utils/transaction-guards'
import { isSetAllowance } from '@/utils/transaction-guards'
import { getResetTimeOptions } from '@/features/spending-limits'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { SpendingLimitsView } from '@views/components/transactions/TxDetails/TxData/SpendingLimits/SpendingLimitsView'

type SpendingLimitsProps = {
  txData?: TransactionData | null
  txInfo: CustomTransactionInfo
  type: SpendingLimitMethods
}

export const SpendingLimits = ({ txData, type }: SpendingLimitsProps): ReactElement | null => {
  const chain = useCurrentChain()
  const { balances } = useBalances()
  const tokens = useMemo(() => balances.items.map(({ tokenInfo }) => tokenInfo), [balances.items])
  const isSetAllowanceMethod = useMemo(() => isSetAllowance(type), [type])

  const [beneficiary, tokenAddress, amount, resetTimeMin] =
    txData?.dataDecoded?.parameters?.map(({ value }) => value) || []

  const resetTimeLabel = useMemo(
    () => getResetTimeOptions(chain?.chainId).find(({ value }) => +value === +resetTimeMin)?.label,
    [chain?.chainId, resetTimeMin],
  )
  const tokenInfo = useMemo(
    () => tokens.find(({ address }) => sameAddress(address, tokenAddress as string)),
    [tokenAddress, tokens],
  )

  if (!txData) return null

  return (
    <SpendingLimitsView
      isSetAllowanceMethod={isSetAllowanceMethod}
      beneficiary={
        <EthHashInfo
          address={(beneficiary as string) || ZERO_ADDRESS}
          shortAddress={false}
          showCopyButton
          hasExplorer
        />
      }
      tokenInfo={tokenInfo}
      amount={amount}
      resetTimeLabel={resetTimeLabel}
    />
  )
}
