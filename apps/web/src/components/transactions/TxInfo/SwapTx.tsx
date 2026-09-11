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
  // min-w-0 so the symbol can shrink far enough for its own ellipsis to engage; the icon keeps its
  // size (shrink-0) because a squashed logo reads as a rendering fault rather than truncation.
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
    // A swap names two tokens where every other tx type names one, so this is the widest `info` cell
    // in the list. It must still resolve to a single line: `flex-wrap` let it break instead, which
    // grew the row taller than its neighbours and knocked the queue grid out of alignment. Nowrap
    // plus min-w-0 hands the overflow to the children, whose own `text-overflow` truncates it —
    // `text-ellipsis` on this flex container never applied, since text-overflow needs a block box.
    <div className="flex min-w-0 items-center gap-1 overflow-hidden font-bold whitespace-nowrap">
      {from}
      <span className="mx-1 shrink-0">&nbsp;to&nbsp;</span>
      {to}
    </div>
  )
}
