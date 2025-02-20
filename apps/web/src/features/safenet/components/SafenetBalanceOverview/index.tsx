import ChainIndicator from '@/components/common/ChainIndicator'
import FiatValue from '@/components/common/FiatValue'
import useBalances from '@/hooks/useBalances'
import { useDarkMode } from '@/hooks/useDarkMode'
import InfoIcon from '@/public/images/notifications/info.svg'
import SafenetDarkIcon from '@/public/images/safenet/safenet-icon-dark.svg'
import SafenetIcon from '@/public/images/safenet/safenet-icon.svg'
import type { SafenetBalance } from '@/utils/safenet'
import { Box, Divider, SvgIcon, Tooltip, Typography } from '@mui/material'
import { useMemo } from 'react'
import css from './styles.module.css'

function sumBalancesByChainId(balances: SafenetBalance[]): { [chainId: string]: number } {
  return balances.reduce(
    (acc, { chainId, fiatBalance }) => {
      acc[chainId] = (acc[chainId] || 0) + parseFloat(fiatBalance)
      return acc
    },
    {} as { [chainId: string]: number },
  )
}

const SafenetBalanceOverview = () => {
  const { balances } = useBalances()
  const isDarkMode = useDarkMode()

  const totalSafenetValueFiat = useMemo(() => {
    const safenetTokens = balances.items.filter((token) => !!token.safenetBalance)
    const safenetTokenBalances = safenetTokens.map((token) => token.safenetBalance!).flat()
    return safenetTokenBalances.reduce((acc, value) => acc + parseFloat(value.fiatBalance), 0)
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
        <FiatValue value={totalSafenetValueFiat} precise />
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
            <Box className={css.row}>
              <Typography fontSize={14}>Total</Typography>
              <FiatValue value={totalSafenetValueFiat} precise />
            </Box>
            <Divider className={css.divider} />
            {Object.entries(safenetBalancesByChain).map(([chainId, fiatValue]) => (
              <Box className={css.row} key={chainId}>
                <ChainIndicator chainId={chainId} />
                <FiatValue value={fiatValue} precise />
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
