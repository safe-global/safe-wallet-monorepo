import { CounterfactualFeature } from '@/features/counterfactual'
import { useLoadFeature } from '@/features/__core__'
import { type ReactElement } from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

import useSafeInfo from '@/hooks/useSafeInfo'
import NewTxButton from '@/components/sidebar/NewTxButton'
import { useAppSelector } from '@/store'

import css from './styles.module.css'
import QrIconBold from '@/public/images/sidebar/qr-bold.svg'
import CopyIconBold from '@/public/images/sidebar/copy-bold.svg'
import LinkIconBold from '@/public/images/sidebar/link-bold.svg'

import { selectSettings } from '@/store/settingsSlice'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import QrCodeButton from '../QrCodeButton'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'
import { SvgIcon } from '@mui/material'
import EnvHintButton from '@/components/settings/EnvironmentVariables/EnvHintButton'
import useSafeAddress from '@/hooks/useSafeAddress'
import ExplorerButton from '@/components/common/ExplorerButton'
import CopyTooltip from '@/components/common/CopyTooltip'
import { NestedSafesButton } from '@/components/sidebar/NestedSafesButton'
import SafeHeaderInfo from './SafeHeaderInfo'

const SafeHeader = (): ReactElement => {
  const safeAddress = useSafeAddress()
  const { safe } = useSafeInfo()
  const chain = useCurrentChain()
  const settings = useAppSelector(selectSettings)
  const { CounterfactualStatusButton } = useLoadFeature(CounterfactualFeature)

  const addressCopyText = settings.shortName.copy && chain ? `${chain.shortName}:${safeAddress}` : safeAddress

  const blockExplorerLink = chain ? getBlockExplorerLink(chain, safeAddress) : undefined

  return (
    <div className={css.container}>
      <div className={css.info}>
        <SafeHeaderInfo />

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

      <NewTxButton />
    </div>
  )
}

export default SafeHeader
