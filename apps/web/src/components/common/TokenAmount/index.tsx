import { type ReactElement } from 'react'
import { TransferDirection } from '@safe-global/store/gateway/types'
import TokenIcon from '../TokenIcon'
import type { TransferTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenAmountView } from '@views/components/common/TokenAmount/TokenAmountView'

const TokenAmount = ({
  value,
  decimals,
  logoUri,
  tokenSymbol,
  direction,
  fallbackSrc,
  preciseAmount,
  iconSize,
  chainId,
}: {
  value: string
  decimals?: number | null
  logoUri?: string | null
  tokenSymbol?: string | null
  direction?: TransferTransactionInfo['direction']
  fallbackSrc?: string
  preciseAmount?: boolean
  iconSize?: number
  chainId?: string
}): ReactElement => {
  return (
    <TokenAmountView
      value={value}
      decimals={decimals}
      logoUri={logoUri}
      tokenSymbol={tokenSymbol}
      isOutgoing={direction === TransferDirection.OUTGOING}
      fallbackSrc={fallbackSrc}
      preciseAmount={preciseAmount}
      iconSize={iconSize}
      chainId={chainId}
      renderTokenIcon={(props) => <TokenIcon {...props} />}
    />
  )
}

export default TokenAmount
