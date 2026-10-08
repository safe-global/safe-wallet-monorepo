import type { ReactNode } from 'react'
import { type NativeToken, type Erc20Token } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Typography } from '@/components/ui/typography'

import MaliciousTxWarning from '@/components/transactions/MaliciousTxWarning'
import { ImitationTransactionWarning } from '@/components/transactions/ImitationTransactionWarning'
import TokenAmount from '@/components/common/TokenAmount'

export type TransferTxInfoMainViewProps = {
  isIncoming: boolean
  isQueued: boolean
  transferTx: ReactNode
  fiatValue?: ReactNode
  showMaliciousWarning: boolean
}

export const TransferTxInfoMainView = ({
  isIncoming,
  isQueued,
  transferTx,
  fiatValue,
  showMaliciousWarning,
}: TransferTxInfoMainViewProps) => {
  return (
    <div className="flex flex-row items-center gap-2 [&_b]:font-normal">
      <Typography variant="paragraph-small-bold" className="min-w-10">
        {isIncoming ? 'Received' : isQueued ? 'Send' : 'Sent'}
      </Typography>
      {transferTx}
      {fiatValue != null && (
        <Typography variant="paragraph-small" className="text-muted-foreground">
          ({fiatValue})
        </Typography>
      )}
      {showMaliciousWarning && <MaliciousTxWarning />}
    </div>
  )
}

export type TransferTxInfoViewProps = {
  main: ReactNode
  isIncoming: boolean
  address: ReactNode
  imitation: boolean
}

export const TransferTxInfoView = ({ main, isIncoming, address, imitation }: TransferTxInfoViewProps) => {
  const directionLabel = isIncoming ? 'From' : 'To'

  return (
    <div className="flex flex-col gap-2">
      {main}

      <div className="flex w-full items-center gap-2 [&_.ethHashInfo-name]:font-bold">
        <Typography variant="paragraph-small-bold" className="min-w-10 whitespace-nowrap">
          {directionLabel}
        </Typography>
        {/* min-w-0 so the address yields to the label beside it. Without it this block kept its full
            content width and the row overflowed by exactly the label + gap (48px), pushing the
            trailing actions menu outside the panel. The address ellipsizes instead. */}
        <div className="min-w-0 flex-1">{address}</div>
      </div>
      {imitation && <ImitationTransactionWarning />}
    </div>
  )
}

export type InlineTransferTxInfoViewProps = {
  value: string
  tokenInfo: Erc20Token | NativeToken
  recipient: ReactNode
}

export const InlineTransferTxInfoView = ({ value, tokenInfo, recipient }: InlineTransferTxInfoViewProps) => {
  return (
    <div className="flex flex-row items-center gap-2">
      <Typography>Send</Typography>
      <TokenAmount
        value={value}
        decimals={tokenInfo.decimals}
        logoUri={tokenInfo.logoUri}
        tokenSymbol={tokenInfo.symbol}
        iconSize={16}
      />
      <Typography>to</Typography>
      {recipient}
    </div>
  )
}
