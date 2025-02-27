import TokenAmount from '@/components/common/TokenAmount'
import CounterfactualStatusButton from '@/features/counterfactual/CounterfactualStatusButton'
import { type ReactElement } from 'react'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Tooltip from '@mui/material/Tooltip'

import useSafeInfo from '@/hooks/useSafeInfo'
import SafeIcon from '@/components/common/SafeIcon'
import NewTxButton from '@/components/sidebar/NewTxButton'
import { useAppSelector } from '@/store'

import css from './styles.module.css'
import QrIconBold from '@/public/images/sidebar/qr-bold.svg'
import CopyIconBold from '@/public/images/sidebar/copy-bold.svg'
import LinkIconBold from '@/public/images/sidebar/link-bold.svg'

import { selectSettings } from '@/store/settingsSlice'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@/utils/chains'
import EthHashInfo from '@/components/common/EthHashInfo'
import QrCodeButton from '../QrCodeButton'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { SvgIcon } from '@mui/material'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import EnvHintButton from '@/components/settings/EnvironmentVariables/EnvHintButton'
import useSafeAddress from '@/hooks/useSafeAddress'
import ExplorerButton from '@/components/common/ExplorerButton'
import CopyTooltip from '@/components/common/CopyTooltip'
import FiatValue from '@/components/common/FiatValue'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import { NestedSafesButton } from '@/components/sidebar/NestedSafesButton'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'

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

          <Track {...NESTED_SAFE_EVENTS.OPEN_LIST} label={NESTED_SAFE_LABELS.header}>
            <NestedSafesButton chainId={safe.chainId} safeAddress={safe.address.value} />
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
