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
  // min-w-0 lets the symbol shrink enough to ellipsis; the icon stays shrink-0 (a squashed logo reads as a bug).
  <span className="flex min-w-0 items-center gap-2 font-bold">
    <span className="shrink-0">
      <TokenIcon tokenSymbol={token.symbol} logoUri={token.logoUri ?? undefined} />
    </span>
    <span className="overflow-hidden text-ellipsis whitespace-nowrap">{token.symbol}</span>
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
    // A swap names two tokens but must stay one line: `flex-wrap` grew the row and misaligned the queue
    // grid. Nowrap + min-w-0 hands overflow to the children, which truncate it themselves.
    <div className="flex min-w-0 items-center gap-1 overflow-hidden font-bold whitespace-nowrap">
      {from}
      <span className="mx-1 shrink-0">&nbsp;to&nbsp;</span>
      {to}
    </div>
  )
}
