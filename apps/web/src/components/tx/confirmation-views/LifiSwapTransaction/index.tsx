import { DataTable } from '@/components/common/Table/DataTable'
import { Stack } from '@mui/material'
import { type SwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { formatUnits } from 'ethers'
import SwapTokens from '@/features/swap/components/SwapTokens'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { DataRow } from '@/components/common/Table/DataRow'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'

export const LifiSwapTransaction = ({ txInfo }: { txInfo: SwapTransactionInfo }) => {
  const totalFee = formatUnits(
    BigInt(txInfo.fees?.integratorFee ?? 0n) + BigInt(txInfo.fees?.lifiFee ?? 0n),
    txInfo.fromToken.decimals,
  )

  return (
    <Stack>
      <DataTable
        rows={[
          <div key="amount">
            <SwapTokens
              first={{
                value: txInfo.fromAmount,
                label: 'Sell',
                tokenInfo: txInfo.fromToken,
              }}
              second={{
                value: txInfo.toAmount,
                label: 'For at least',
                tokenInfo: txInfo.toToken,
              }}
            />
          </div>,
          <DataRow datatestid="receiver" key="Receiver" title="Receiver">
            <NamedAddressInfo
              address={txInfo.recipient.value}
              name={txInfo.recipient.name}
              hasExplorer
              avatarSize={24}
            />
          </DataRow>,
          <DataRow datatestid="total-fee" key="fees" title="Fees">
            {formatAmount(totalFee)} {txInfo.fromToken.symbol}
          </DataRow>,
        ]}
      />
    </Stack>
  )
}
