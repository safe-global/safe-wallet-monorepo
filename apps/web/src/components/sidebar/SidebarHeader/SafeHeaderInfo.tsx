import { type ReactElement } from 'react'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'

import useSafeInfo from '@/hooks/useSafeInfo'
import SafeIcon from '@/components/common/SafeIcon'
import TokenAmount from '@/components/common/TokenAmount'
import EthHashInfo from '@/components/common/EthHashInfo'
import FiatValue from '@/components/common/FiatValue'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'

import css from './styles.module.css'

const SafeHeaderInfo = (): ReactElement => {
  const { balances } = useVisibleBalances()
  const safeAddress = useSafeAddress()
  const { safe } = useSafeInfo()
  const { threshold, owners } = safe
  const { ens } = useAddressResolver(safeAddress)

  return (
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
          <EthHashInfo address={safeAddress} shortAddress showAvatar={false} name={ens} />
        ) : (
          <Typography variant="body2">
            <Skeleton variant="text" width={86} />
            <Skeleton variant="text" width={120} />
          </Typography>
        )}

        <Typography data-testid="currency-section" variant="body2" fontWeight={700}>
          {safe.deployed ? (
            balances.fiatTotal ? (
              <FiatValue value={balances.fiatTotal} />
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
  )
}

export default SafeHeaderInfo
