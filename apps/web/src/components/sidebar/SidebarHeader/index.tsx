import CounterfactualStatusButton from '@/features/counterfactual/CounterfactualStatusButton'
import { type ReactElement, useState } from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useTheme, useMediaQuery } from '@mui/material'
import { useRouter } from 'next/router'

import useSafeInfo from '@/hooks/useSafeInfo'
import NewTxButton from '@/components/sidebar/NewTxButton'
import { useAppSelector } from '@/store'
import { trackEvent, OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'

import css from './styles.module.css'
import QrIconBold from '@/public/images/sidebar/qr-bold.svg'
import CopyIconBold from '@/public/images/sidebar/copy-bold.svg'
import LinkIconBold from '@/public/images/sidebar/link-bold.svg'

import { selectSettings } from '@/store/settingsSlice'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import QrCodeButton from '../QrCodeButton'
import Track from '@/components/common/Track'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'
import { SvgIcon } from '@mui/material'
import EnvHintButton from '@/components/settings/EnvironmentVariables/EnvHintButton'
import useSafeAddress from '@/hooks/useSafeAddress'
import ExplorerButton from '@/components/common/ExplorerButton'
import CopyTooltip from '@/components/common/CopyTooltip'
import { NestedSafesButton } from '@/components/sidebar/NestedSafesButton'
import SafeHeaderInfo from './SafeHeaderInfo'
import SafeAccountsDropdown from './SafeAccountsDropdown'

const SafeHeader = (): ReactElement => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const router = useRouter()

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (isMobile) {
      // On mobile, navigate to full screen view
      router.push(AppRoutes.welcome.accounts)
      trackEvent({
        ...OVERVIEW_EVENTS.OPEN_SAFE_LIST,
        label: OVERVIEW_LABELS.sidebar_dropdown,
      })
    } else {
      // On desktop, open dropdown
      setAnchorEl(event.currentTarget)
      trackEvent({
        ...OVERVIEW_EVENTS.OPEN_SAFE_LIST,
        label: OVERVIEW_LABELS.sidebar_dropdown,
      })
    }
  }

  const handleClose = () => {
    setAnchorEl(null)
  }
  const safeAddress = useSafeAddress()
  const { safe } = useSafeInfo()
  const chain = useCurrentChain()
  const settings = useAppSelector(selectSettings)

  const addressCopyText = settings.shortName.copy && chain ? `${chain.shortName}:${safeAddress}` : safeAddress

  const blockExplorerLink = chain ? getBlockExplorerLink(chain, safeAddress) : undefined

  return (
    <div className={css.container}>
      <div className={css.info}>
        <SafeHeaderInfo onClick={handleOpen} open={open} />

        <div className={css.iconButtons}>
          <Track
            {...OVERVIEW_EVENTS.SHOW_QR}
            label="sidebar"
            mixpanelParams={{ [MixpanelEventParams.SIDEBAR_ELEMENT]: 'QR Code' }}
          >
            <QrCodeButton>
              <Tooltip title="Open QR code" placement="top">
                <IconButton className={css.iconButton}>
                  <SvgIcon component={QrIconBold} inheritViewBox color="primary" fontSize="small" />
                </IconButton>
              </Tooltip>
            </QrCodeButton>
          </Track>

          <Track
            {...OVERVIEW_EVENTS.COPY_ADDRESS}
            mixpanelParams={{ [MixpanelEventParams.SIDEBAR_ELEMENT]: 'Copy Address' }}
          >
            <CopyTooltip text={addressCopyText}>
              <IconButton data-testid="copy-address-btn" className={css.iconButton}>
                <SvgIcon component={CopyIconBold} inheritViewBox color="primary" fontSize="small" />
              </IconButton>
            </CopyTooltip>
          </Track>

          <Track
            {...OVERVIEW_EVENTS.OPEN_EXPLORER}
            mixpanelParams={{ [MixpanelEventParams.SIDEBAR_ELEMENT]: 'Block Explorer' }}
          >
            <ExplorerButton {...blockExplorerLink} className={css.iconButton} icon={LinkIconBold} />
          </Track>

          <Track
            {...NESTED_SAFE_EVENTS.OPEN_LIST}
            label={NESTED_SAFE_LABELS.header}
            mixpanelParams={{ [MixpanelEventParams.SIDEBAR_ELEMENT]: 'Nested Safes' }}
          >
            <NestedSafesButton chainId={safe.chainId} safeAddress={safe.address.value} />
          </Track>

          <CounterfactualStatusButton />

          <EnvHintButton />
        </div>
      </div>

      <div className={css.newTxButtonWrapper}>
        <NewTxButton />
      </div>

      <SafeAccountsDropdown anchorEl={anchorEl} open={open} onClose={handleClose} />
    </div>
  )
}

export default SafeHeader
