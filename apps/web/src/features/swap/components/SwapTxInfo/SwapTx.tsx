import type { Order, OrderToken } from '@safe-global/safe-gateway-typescript-sdk'
import type { ReactElement } from 'react'
import { Typography } from '@mui/material'
import TokenAmount from '@/components/common/TokenAmount'
import TokenIcon from '@/components/common/TokenIcon'

const Amount = ({ value, token }: { value: string; token: OrderToken }) => (
  <TokenAmount
    value={value}
    decimals={token.decimals}
    tokenSymbol={token.symbol}
    logoUri={token.logoUri ?? undefined}
  />
)

const OnlyToken = ({ token }: { token: OrderToken }) => (
  <Typography fontWeight="bold" component="span" display="flex" alignItems="center" gap={1}>
    <TokenIcon tokenSymbol={token.symbol} logoUri={token.logoUri ?? undefined} />
    {token.symbol}
  </Typography>
)

export const SwapTx = ({ info }: { info: Order }): ReactElement => {
  const { kind, sellToken, sellAmount, buyToken, buyAmount } = info
  const isSellOrder = kind === 'sell'

  let from = <Amount value={sellAmount} token={sellToken} />
  let to = <OnlyToken token={buyToken} />

  if (!isSellOrder) {
    from = <OnlyToken token={sellToken} />
    to = <Amount value={buyAmount} token={buyToken} />
  }

  return (
    <Typography
      component="div"
      display="flex"
      alignItems="center"
      fontWeight="bold"
      whiteSpace="nowrap"
      overflow="hidden"
      textOverflow="ellipsis"
      flexWrap="wrap"
      gap={0.5}
    >
      {from}
      <Typography component="span" mx={0.5}>
        &nbsp;to&nbsp;
      </Typography>
      {to}
    </Typography>
  )
}
