import ChainIndicator from '@/components/common/ChainIndicator'
import TokenAmount from '@/components/common/TokenAmount'
import useBalances from '@/hooks/useBalances'
import { useDarkMode } from '@/hooks/useDarkMode'
import InfoIcon from '@/public/images/notifications/info.svg'
import SafenetDarkIcon from '@/public/images/safenet/safenet-icon-dark.svg'
import SafenetIcon from '@/public/images/safenet/safenet-icon.svg'
import type { SafenetBalance } from '@/utils/safenet'
import { Box, Divider, SvgIcon, Tooltip, Typography } from '@mui/material'
import classnames from 'classnames'
import { useMemo } from 'react'
import css from './styles.module.css'

// Once there are fiat conversions for Safenet tokens, replace `balance` with `fiatBalance`
function sumBalancesByChainId(balances: SafenetBalance[]): {
  [chainId: string]: { balance: number }
} {
  return balances.reduce(
    (acc, { chainId, balance }) => {
      if (!acc[chainId]) {
        acc[chainId] = { balance: 0 }
      }
      acc[chainId].balance += parseFloat(balance)
      return acc
    },
    {} as { [chainId: string]: { balance: number } },
  )
}

const SafenetBalanceOverview = () => {
  const { balances } = useBalances()
  const isDarkMode = useDarkMode()

  // Once there are fiat conversions for Safenet tokens, replace `balance` with `fiatBalance`
  const totalSafenetBalance = useMemo(() => {
    const safenetTokens = balances.items.filter((token) => !!token.safenetBalance)
    const safenetTokenBalances = safenetTokens.map((token) => token.safenetBalance!).flat()
    return safenetTokenBalances.reduce(
      (acc, { balance }) => {
        acc.balance += parseFloat(balance)
        return acc
      },
      { balance: 0 },
    )
  }, [balances])

  const safenetBalancesByChain = useMemo(() => {
    const safenetTokens = balances.items.filter((token) => !!token.safenetBalance)
    const safenetTokenBalances = safenetTokens.map((token) => token.safenetBalance!).flat()
    return sumBalancesByChainId(safenetTokenBalances)
  }, [balances])

  return (
    <Box className={css.container}>
      <SafenetIcon height="20" />
      <Typography color="text.secondary">Available Cross-Chain</Typography>
      <b>
        {/*<FiatValue value={totalSafenetBalance.fiatBalance} precise />*/}
        <TokenAmount value={totalSafenetBalance.balance.toString()} decimals={6} tokenSymbol="USDC" />
      </b>
      <Tooltip
        title={
          <Box className={css.chains}>
            <Box className={css.title}>
              {isDarkMode ? <SafenetIcon height="20" /> : <SafenetDarkIcon height="20" />}
              <Typography fontWeight={700} fontSize={11}>
                SAFENET BALANCE
              </Typography>
            </Box>
            <Divider className={css.divider} />
            <Box className={classnames(css.row, isDarkMode ? css.darkTotal : css.lightTotal)}>
              <Typography fontSize={14}>Total</Typography>
              {/*<FiatValue value={totalSafenetBalance.fiatBalance} precise />*/}
              <TokenAmount
                value={totalSafenetBalance.balance.toString()}
                decimals={6}
                tokenSymbol="USDC"
                hasTooltip={false}
              />
            </Box>
            <Divider className={css.divider} />
            {Object.entries(safenetBalancesByChain).map(([chainId, { balance }]) => (
              <Box className={css.row} key={chainId}>
                <ChainIndicator chainId={chainId} />
                {/*<FiatValue value={fiatBalance} precise />*/}
                <TokenAmount value={balance.toString()} decimals={6} tokenSymbol="USDC" hasTooltip={false} />
              </Box>
            ))}
          </Box>
        }
        placement="right"
        arrow
      >
        <SvgIcon fontSize="small" component={InfoIcon} inheritViewBox />
      </Tooltip>
    </Box>
  )
}

export default SafenetBalanceOverview
