import { type ReactElement, useMemo } from 'react'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

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
import { Box, LinearProgress, Skeleton, SvgIcon } from '@mui/material'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import useSafeAddress from '@/hooks/useSafeAddress'
import ExplorerButton from '@/components/common/ExplorerButton'
import CopyTooltip from '@/components/common/CopyTooltip'
import NounsAvatar from '@/components/common/NounsAvatar'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'

const SafeHeader = (): ReactElement => {
  const currency = useAppSelector(selectCurrency)
  const { balances } = useVisibleBalances()
  const safeAddress = useSafeAddress()
  const { safe } = useSafeInfo()
  const chain = useCurrentChain()
  const settings = useAppSelector(selectSettings)
  const superChainSmartAccount = useAppSelector(selectSuperChainAccount)

  const addressCopyText = settings.shortName.copy && chain ? `${chain.shortName}:${safeAddress}` : safeAddress

  const blockExplorerLink = chain ? getBlockExplorerLink(chain, safeAddress) : undefined

  const nounSeed = useMemo(() => {
    return {
      background: Number(superChainSmartAccount.data.noun[0]),
      body: Number(superChainSmartAccount.data.noun[1]),
      accessory: Number(superChainSmartAccount.data.noun[2]),
      head: Number(superChainSmartAccount.data.noun[3]),
      glasses: Number(superChainSmartAccount.data.noun[4]),
    }
  }, [superChainSmartAccount])

  if (superChainSmartAccount.loading)
    return (
      <div className={css.container}>
        <div className={css.info}>
          <div data-testid="safe-header-info" className={css.safe}>
            <div className={css.nouns}>
              <Skeleton variant="rectangular" width="100%" height="100%" />
            </div>
            <div className={css.superchainInfo}>
              <span className={css.superchainLevel}>
                <Skeleton width="100%" />
              </span>
              <div className={css.superChainData}>
                <p className={css.superChainId}>
                  <Skeleton width="100px" height="16px" />
                </p>
                <p className={css.superChainData_points}>
                  <Skeleton width="100px" height="16px" />
                </p>
                <p className={css.superChainData_points}>
                  <Skeleton width="100px" height="16px" />
                </p>
              </div>
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

  return (
    <div className={css.container}>
      <div className={css.info}>
        <div data-testid="safe-header-info" className={css.safe}>
          <div className={css.nouns}>
            <NounsAvatar seed={nounSeed} />
          </div>
          <div className={css.superchainInfo}>
            <span className={css.superchainLevel}>
              Level: <span>{Number(superChainSmartAccount.data.level)}</span>
            </span>
            <div className={css.superChainData}>
              <p className={css.superChainId}>
                {superChainSmartAccount.data.superChainID.split('.superchain')[0]}
                <span>.superchain</span>
              </p>
              <p className={css.superChainData_points}>
                SC points: <span>{Number(superChainSmartAccount.data.points)}</span>
              </p>
              <p className={css.superChainData_points}>
                Points to level up:{' '}
                <span>
                  {Number(superChainSmartAccount.data.pointsToNextLevel ?? superChainSmartAccount.data.points)}
                </span>
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
