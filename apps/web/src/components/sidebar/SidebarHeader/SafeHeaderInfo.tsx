import { type ReactElement } from 'react'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import ButtonBase from '@mui/material/ButtonBase'
import Box from '@mui/material/Box'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

import useSafeInfo from '@/hooks/useSafeInfo'
import SafeIcon from '@/components/common/SafeIcon'
import TokenAmount from '@/components/common/TokenAmount'
import EthHashInfo from '@/components/common/EthHashInfo'
import FiatValue from '@/components/common/FiatValue'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { InfoTooltip } from '@/features/stake/components/InfoTooltip'

import css from './styles.module.css'
import { useIsHypernativeGuard } from '@/features/hypernative/hooks'

type SafeHeaderInfoProps = {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
  open?: boolean
}

const SafeHeaderInfo = ({ onClick, open }: SafeHeaderInfoProps = {}): ReactElement => {
  const { balances } = useVisibleBalances()
  const safeAddress = useSafeAddress()
  const { safe } = useSafeInfo()
  const { threshold, owners } = safe
  const { ens } = useAddressResolver(safeAddress)
  const { isHypernativeGuard } = useIsHypernativeGuard()

  return (
    <ButtonBase className={css.safeHeaderButton} onClick={onClick} disabled={!onClick}>
      <div data-testid="safe-header-info" className={css.safe}>
        <div data-testid="safe-icon">
          {safeAddress ? (
            <SafeIcon address={safeAddress} threshold={threshold} owners={owners?.length} />
          ) : (
            <Skeleton variant="circular" width={40} height={40} />
          )}
        </div>

        <div className={css.address}>
          {safeAddress ? (
            <EthHashInfo
              address={safeAddress}
              shortAddress
              showAvatar={false}
              name={ens}
              showShieldIcon={isHypernativeGuard}
              copyAddress={false}
            />
          ) : (
            <Typography variant="body2">
              <Skeleton variant="text" width={86} />
              <Skeleton variant="text" width={120} />
            </Typography>
          )}

          <Typography data-testid="currency-section" variant="body2" fontWeight={700}>
            {safe.deployed ? (
              balances.fiatTotal ? (
                <>
                  <FiatValue value={balances.fiatTotal} />
                  {balances.isAllTokensMode && <InfoTooltip title="Total based on default tokens and positions." />}
                </>
              ) : (
                <Skeleton variant="text" width={60} />
              )
            ) : (
              <TokenAmount
                value={balances.items[0]?.balance}
                decimals={balances.items[0]?.tokenInfo.decimals}
                tokenSymbol={balances.items[0]?.tokenInfo.symbol}
              />
            )}
          </Typography>
        </div>
      </div>

      {onClick && (
        <Box
          className={css.chevron}
          sx={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease-in-out',
          }}
        >
          <ChevronRightIcon fontSize="small" />
        </Box>
      )}
    </ButtonBase>
  )
}

export default SafeHeaderInfo
