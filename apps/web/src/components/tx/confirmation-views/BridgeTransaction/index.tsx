import ChainIndicator from '@/components/common/ChainIndicator'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { DataRow } from '@/components/common/Table/DataRow'
import { DataTable } from '@/components/common/Table/DataTable'
import TokenAmount from '@/components/common/TokenAmount'
import useChainId from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'
import { Stack, Typography } from '@mui/material'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { type BridgeAndSwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import { formatUnits } from 'ethers'
import { BridgeRecipientWarnings } from './BridgeRecipientWarnings'
import ExternalLink from '@/components/common/ExternalLink'
import css from './styles.module.css'

interface BridgeTransactionProps {
  txInfo: BridgeAndSwapTransactionInfo
  showWarnings?: boolean
}

const BridgeTxRecipientRow = ({ txInfo }: BridgeTransactionProps) => {
  return (
    <DataRow datatestid="recipient" key="recipient" title="Recipient">
      <Stack>
        <NamedAddressInfo
          address={txInfo.recipient.value}
          showCopyButton
          hasExplorer
          showAvatar={false}
          onlyName
          showPrefix
          chainId={txInfo.toChain}
        />
      </Stack>
    </DataRow>
  )
}

function pendingBridgeTransactionRows(txInfo: BridgeAndSwapTransactionInfo & { status: 'PENDING' }) {
  const actualFromAmount =
    BigInt(txInfo.fromAmount) + BigInt(txInfo.fees?.integratorFee ?? 0n) + BigInt(txInfo.fees?.lifiFee ?? 0n)

  return [
    <DataRow datatestid="amount" key="amount" title="Amount">
      <Typography display="flex" alignItems="center" flexDirection="row" gap={1}>
        Sending{' '}
        <TokenAmount
          value={actualFromAmount.toString()}
          decimals={txInfo.fromToken.decimals}
          logoUri={txInfo.fromToken.logoUri ?? ''}
          tokenSymbol={txInfo.fromToken.symbol}
        />{' '}
        to <ChainIndicator chainId={txInfo.toChain} inline />
      </Typography>
    </DataRow>,
  ]
}

function failedBridgeTransactionRows(txInfo: BridgeAndSwapTransactionInfo & { status: 'FAILED' }) {
  const actualFromAmount =
    BigInt(txInfo.fromAmount) + BigInt(txInfo.fees?.integratorFee ?? 0n) + BigInt(txInfo.fees?.lifiFee ?? 0n)
  return [
    <DataRow datatestid="amount" key="amount" title="Amount">
      <Typography display="flex" alignItems="center" flexDirection="row" gap={1}>
        Failed to send{' '}
        <TokenAmount
          value={actualFromAmount.toString()}
          decimals={txInfo.fromToken.decimals}
          logoUri={txInfo.fromToken.logoUri ?? ''}
          tokenSymbol={txInfo.fromToken.symbol}
        />{' '}
        to <ChainIndicator chainId={txInfo.toChain} inline />
      </Typography>
    </DataRow>,
    <DataRow datatestid="substatus" key="substatus" title="Substatus">
      {txInfo.substatus}
    </DataRow>,
  ]
}

function successfulBridgeTransactionRows(
  txInfo: BridgeAndSwapTransactionInfo & { status: 'DONE' },
  chainId: string,
  chainConfigs: ChainInfo[],
) {
  const actualFromAmount =
    BigInt(txInfo.fromAmount) + BigInt(txInfo.fees?.integratorFee ?? 0n) + BigInt(txInfo.fees?.lifiFee ?? 0n)
  const fromAmountDecimals = formatUnits(actualFromAmount, txInfo.fromToken.decimals)
  const toAmountDecimals =
    txInfo.toAmount && txInfo.toToken ? formatUnits(txInfo.toAmount, txInfo.toToken.decimals) : undefined
  const exchangeRate = toAmountDecimals ? Number(toAmountDecimals) / Number(fromAmountDecimals) : undefined

  const fromChainConfig = chainConfigs.find((config) => config.chainId === chainId)
  const toChainConfig = chainConfigs.find((config) => config.chainId === txInfo.toChain)

  const rows = []

  rows.push(
    <DataRow datatestid="amount" key="amount" title="Amount">
      <Stack spacing={0.5}>
        <Typography display="flex" alignItems="center" flexDirection="row" gap={1}>
          Sell{' '}
          <TokenAmount
            value={actualFromAmount.toString()}
            decimals={txInfo.fromToken.decimals}
            logoUri={txInfo.fromToken.logoUri ?? ''}
            tokenSymbol={txInfo.fromToken.symbol}
            chainId={chainId}
          />{' '}
          on {fromChainConfig?.chainName ?? 'Unknown Chain'}
        </Typography>
        <Typography display="flex" alignItems="center" flexDirection="row" gap={1}>
          {txInfo.toToken && txInfo.toAmount ? (
            <>
              For{' '}
              <TokenAmount
                value={txInfo.toAmount}
                decimals={txInfo.toToken.decimals}
                logoUri={txInfo.toToken.logoUri ?? ''}
                tokenSymbol={txInfo.toToken.symbol}
                chainId={txInfo.toChain}
              />{' '}
              on {toChainConfig?.chainName ?? 'Unknown Chain'}
            </>
          ) : (
            <>Could not find buy token information.</>
          )}
        </Typography>
      </Stack>
    </DataRow>,
  )
  if (exchangeRate) {
    rows.push(
      <DataRow datatestid="exchange-rate" key="Exchange Rate" title="Exchange Rate">
        1 {txInfo.fromToken.symbol} = {formatAmount(exchangeRate)} {txInfo.toToken!.symbol}
      </DataRow>,
    )
  }

  return rows
}

function BridgeTransaction({ txInfo, showWarnings = false }: BridgeTransactionProps) {
  const chainId = useChainId()
  const { configs } = useChains()

  const totalFee = formatUnits(
    BigInt(txInfo.fees?.integratorFee ?? 0n) + BigInt(txInfo.fees?.lifiFee ?? 0n),
    txInfo.fromToken.decimals,
  )

  let rows = []
  if (txInfo.status === 'PENDING' || txInfo.status === 'AWAITING_EXECUTION') {
    rows.push(...pendingBridgeTransactionRows(txInfo as BridgeAndSwapTransactionInfo & { status: 'PENDING' }))
  } else if (txInfo.status === 'FAILED') {
    rows.push(...failedBridgeTransactionRows(txInfo as BridgeAndSwapTransactionInfo & { status: 'FAILED' }))
  } else if (txInfo.status === 'DONE') {
    rows.push(
      ...successfulBridgeTransactionRows(txInfo as BridgeAndSwapTransactionInfo & { status: 'DONE' }, chainId, configs),
    )
  }
  rows.push(
    <BridgeTxRecipientRow txInfo={txInfo} />,
    <DataRow datatestid="total-fee" key="fees" title="Fees">
      {formatAmount(totalFee)} {txInfo.fromToken.symbol}
    </DataRow>,
  )

  if (txInfo.explorerUrl) {
    rows.push(
      <DataRow datatestid="lifi-explorer-url" key="lifi-explorer-url" title="Lifi Explorer">
        <ExternalLink className={css.externalLink} href={txInfo.explorerUrl}>
          View in LiFi Explorer
        </ExternalLink>
      </DataRow>,
    )
  }

  return (
    <Stack>
      <DataTable rows={rows} />
      {showWarnings && txInfo.status === 'AWAITING_EXECUTION' && <BridgeRecipientWarnings txInfo={txInfo} />}
    </Stack>
  )
}

export default BridgeTransaction
