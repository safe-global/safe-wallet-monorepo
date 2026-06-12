import type { TokenInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import type { ReactElement } from 'react'
import TokenAmount from '@/components/common/TokenAmount'
import TokenIcon from '@/components/common/TokenIcon'

const Amount = ({ value, token }: { value: string; token: TokenInfo }) => (
  <TokenAmount
    value={value}
    decimals={token.decimals}
    tokenSymbol={token.symbol}
    logoUri={token.logoUri ?? undefined}
  />
)

const OnlyToken = ({ token }: { token: TokenInfo }) => (
  <span className="flex items-center gap-2 font-bold">
    <TokenIcon tokenSymbol={token.symbol} logoUri={token.logoUri ?? undefined} />
    {token.symbol}
  </span>
)

export const SwapTx = ({ info }: { info: OrderTransactionInfo }): ReactElement => {
  const { kind, sellToken, sellAmount, buyToken, buyAmount } = info
  const isSellOrder = kind === 'sell'

  let from = <Amount value={sellAmount} token={sellToken} />
  let to = <OnlyToken token={buyToken} />

  if (!isSellOrder) {
    from = <OnlyToken token={sellToken} />
    to = <Amount value={buyAmount} token={buyToken} />
  }

  return (
    <div className="flex flex-wrap items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap font-bold">
      {from}
      <span className="mx-1">&nbsp;to&nbsp;</span>
      {to}
    </div>
  )
}
