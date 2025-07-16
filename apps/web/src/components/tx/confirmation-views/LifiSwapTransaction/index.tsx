import { DataTable } from '@/components/common/Table/DataTable'
import { Stack, Typography } from '@mui/material'
import { type SwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { formatUnits } from 'ethers'
import SwapTokens from '@/features/swap/components/SwapTokens'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { DataRow } from '@/components/common/Table/DataRow'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import TokenAmount from '@/components/common/TokenAmount'
import ExternalLink from '@/components/common/ExternalLink'
import css from './styles.module.css'

const PreviewSwapAmount = ({ txInfo }: { txInfo: SwapTransactionInfo }) => (
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
  </div>
)

const ListSwapAmount = ({ txInfo }: { txInfo: SwapTransactionInfo }) => (
  <DataRow datatestid="amount" key="amount" title="Amount">
    <Stack spacing={0.5}>
      <Typography display="flex" alignItems="center" flexDirection="row" gap={1}>
        Sell{' '}
        <TokenAmount
          value={txInfo.fromAmount}
          decimals={txInfo.fromToken.decimals}
          logoUri={txInfo.fromToken.logoUri ?? ''}
          tokenSymbol={txInfo.fromToken.symbol}
        />
      </Typography>
      <Typography display="flex" alignItems="center" flexDirection="row" gap={1}>
        For{' '}
        <TokenAmount
          value={txInfo.toAmount}
          decimals={txInfo.toToken.decimals}
          logoUri={txInfo.toToken.logoUri ?? ''}
          tokenSymbol={txInfo.toToken.symbol}
        />
      </Typography>
    </Stack>
  </DataRow>
)

export const LifiSwapTransaction = ({ txInfo, isPreview }: { txInfo: SwapTransactionInfo; isPreview: boolean }) => {
  const totalFee = formatUnits(
    BigInt(txInfo.fees?.integratorFee ?? 0n) + BigInt(txInfo.fees?.lifiFee ?? 0n),
    txInfo.fromToken.decimals,
  )

  const fromAmountDecimals = formatUnits(txInfo.fromAmount, txInfo.fromToken.decimals)
  const toAmountDecimals = formatUnits(txInfo.toAmount, txInfo.toToken.decimals)
  const exchangeRate = Number(toAmountDecimals) / Number(fromAmountDecimals)

  const rows = [
    isPreview ? <PreviewSwapAmount txInfo={txInfo} /> : <ListSwapAmount txInfo={txInfo} />,
    <DataRow datatestid="price" key="price" title="Price">
      1 {txInfo.fromToken.symbol} = {formatAmount(exchangeRate)} {txInfo.toToken!.symbol}
    </DataRow>,
    <DataRow datatestid="receiver" key="Receiver" title="Receiver">
      <NamedAddressInfo
        address={txInfo.recipient.value}
        name={txInfo.recipient.name}
        hasExplorer
        showAvatar={false}
        onlyName
        showCopyButton
      />
    </DataRow>,
    <DataRow datatestid="total-fee" key="fees" title="Fees">
      {formatAmount(totalFee)} {txInfo.fromToken.symbol}
    </DataRow>,
  ]

  if (txInfo.lifiExplorerUrl) {
    rows.push(
      <DataRow datatestid="lifi-explorer-url" key="lifi-explorer-url" title="Lifi Explorer">
        <ExternalLink className={css.externalLink} href={txInfo.lifiExplorerUrl}>
          View in LiFi explorer
        </ExternalLink>
      </DataRow>,
    )
  }

  return (
    <Stack>
      <DataTable rows={rows} />
    </Stack>
  )
}
