import { type ReactElement, useMemo } from 'react'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

import { formatCurrency } from '@/utils/formatNumber'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'

import css from './styles.module.css'
import QrIconBold from '@/public/images/sidebar/qr-bold.svg'
import CopyIconBold from '@/public/images/sidebar/copy-bold.svg'
import LinkIconBold from '@/public/images/sidebar/link-bold.svg'

import { selectSettings } from '@/store/settingsSlice'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@/utils/chains'
import QrCodeButton from '../QrCodeButton'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { Box, LinearProgress, SvgIcon } from '@mui/material'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import useSafeAddress from '@/hooks/useSafeAddress'
import ExplorerButton from '@/components/common/ExplorerButton'
import CopyTooltip from '@/components/common/CopyTooltip'
import NounsAvatar from '@/components/common/NounsAvatar'

const SafeHeader = (): ReactElement => {
  const currency = useAppSelector(selectCurrency)
  const { balances } = useVisibleBalances()
  const safeAddress = useSafeAddress()
  const { safe } = useSafeInfo()
  const { threshold, owners } = safe
  const chain = useCurrentChain()
  const settings = useAppSelector(selectSettings)

  const fiatTotal = useMemo(
    () => (balances.fiatTotal ? formatCurrency(balances.fiatTotal, currency) : ''),
    [currency, balances.fiatTotal],
  )

  const addressCopyText = settings.shortName.copy && chain ? `${chain.shortName}:${safeAddress}` : safeAddress

  const blockExplorerLink = chain ? getBlockExplorerLink(chain, safeAddress) : undefined

  return (
    <div className={css.container}>
      <div className={css.info}>
        <div data-testid="safe-header-info" className={css.safe}>
          <div className={css.nouns}>
            <NounsAvatar
              seed={{
                accessory: 0,
                body: 0,
                background: 0,
                glasses: 0,
                head: 0,
              }}
            />
          </div>
          <div className={css.superchainInfo}>
            <span className={css.superchainLevel}>
              Level: <span>1</span>
            </span>
            <div className={css.superChainData}>
              <p className={css.superChainId}>
                luuk<span>.superchain</span>
              </p>
              <p className={css.superChainData_points}>
                SC points: <span>0</span>
              </p>
              <p className={css.superChainData_points}>
                Points to level up: <span>100</span>
              </p>
            </div>
          </div>
          {/* <div data-testid="safe-icon">
            {safeAddress ? (
              <SafeIcon address={safeAddress} threshold={threshold} owners={owners?.length} />
            ) : (
              <Skeleton variant="circular" width={40} height={40} />
            )}
          </div>

          <div className={css.address}>
            {safeAddress ? (
              <EthHashInfo address={safeAddress} shortAddress showAvatar={false} />
            ) : (
              <Typography variant="body2">
                <Skeleton variant="text" width={86} />
                <Skeleton variant="text" width={120} />
              </Typography>
            )}

            <Typography data-testid="currency-section" variant="body2" fontWeight={700}>
              {safe.deployed ? (
                fiatTotal || <Skeleton variant="text" width={60} />
              ) : (
                <TokenAmount
                  value={balances.items[0]?.balance}
                  decimals={balances.items[0]?.tokenInfo.decimals}
                  tokenSymbol={balances.items[0]?.tokenInfo.symbol}
                />
              )}
            </Typography>
          </div> */}
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
          <Tooltip title={<Typography align="center">Remaining weekly gas covered by Superchain Eco</Typography>}>
            <Box
              sx={{
                width: '158px',
                height: '34px',
                borderRadius: '6px',
                border: '2px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <LinearProgress
                variant="determinate"
                color="inherit"
                value={70}
                sx={{ width: '100%', height: 34, backgroundColor: 'white', color: '#E8EDF5', borderRadius: '6px' }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <Typography color="black" fontWeight={600} variant="body2" component="div">
                  Wk. Gas balance
                </Typography>
              </Box>
            </Box>
          </Tooltip>

          {/* <CounterfactualStatusButton /> */}

          {/* <EnvHintButton /> */}
        </div>
      </div>

      {/* <NewTxButton /> */}
    </div>
  )
}

export default SafeHeader
