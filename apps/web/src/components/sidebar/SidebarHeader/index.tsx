import TokenAmount from '@/components/common/TokenAmount'
import CounterfactualStatusButton from '@/features/counterfactual/CounterfactualStatusButton'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { type ReactElement } from 'react'

import SafeIcon from '@/components/common/SafeIcon'
import NewTxButton from '@/components/sidebar/NewTxButton'
import useSafeInfo from '@/hooks/useSafeInfo'
import CopyIconBold from '@/public/images/sidebar/copy-bold.svg'
import LinkIconBold from '@/public/images/sidebar/link-bold.svg'
import QrIconBold from '@/public/images/sidebar/qr-bold.svg'
import { useAppSelector } from '@/store'
import css from './styles.module.css'

import CopyTooltip from '@/components/common/CopyTooltip'
import EthHashInfo from '@/components/common/EthHashInfo'
import ExplorerButton from '@/components/common/ExplorerButton'
import FiatValue from '@/components/common/FiatValue'
import Track from '@/components/common/Track'
import EnvHintButton from '@/components/settings/EnvironmentVariables/EnvHintButton'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { selectSettings } from '@/store/settingsSlice'
import { getBlockExplorerLink } from '@/utils/chains'
import { SvgIcon } from '@mui/material'
import QrCodeButton from '../QrCodeButton'

const SafeHeader = (): ReactElement => {
  const { balances } = useVisibleBalances()
  const safeAddress = useSafeAddress()
  const { safe } = useSafeInfo()
  const { threshold, owners } = safe
  const chain = useCurrentChain()
  const settings = useAppSelector(selectSettings)
  const { ens } = useAddressResolver(safeAddress)

  const addressCopyText = settings.shortName.copy && chain ? `${chain.shortName}:${safeAddress}` : safeAddress

  const blockExplorerLink = chain ? getBlockExplorerLink(chain, safeAddress) : undefined

  return (
    <div className={css.container}>
      <div className={css.info}>
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

        <div className={css.iconButtons}>
          <Track {...OVERVIEW_EVENTS.SHOW_QR} label="sidebar">
            <QrCodeButton>
              <Tooltip title="Open QR code" placement="top">
                <IconButton className={css.iconButton}>
                  <SvgIcon component={QrIconBold} inheritViewBox color="primary" fontSize="small" />
                </IconButton>
              </Tooltip>
            </QrCodeButton>
          </Track>

          <Track {...OVERVIEW_EVENTS.COPY_ADDRESS}>
            <CopyTooltip text={addressCopyText}>
              <IconButton data-testid="copy-address-btn" className={css.iconButton}>
                <SvgIcon component={CopyIconBold} inheritViewBox color="primary" fontSize="small" />
              </IconButton>
            </CopyTooltip>
          </Track>

          <Track {...OVERVIEW_EVENTS.OPEN_EXPLORER}>
            <ExplorerButton {...blockExplorerLink} className={css.iconButton} icon={LinkIconBold} />
          </Track>

          <CounterfactualStatusButton />

          <EnvHintButton />
        </div>
      </div>

      <NewTxButton />
    </div>
  )
}

export default SafeHeader
