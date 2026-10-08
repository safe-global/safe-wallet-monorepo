import Track from '@/components/common/Track'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import type { ReactElement, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import ExternalLink from '@/components/common/ExternalLink'
import EthHashInfo from '@/components/common/EthHashInfo'
import EnhancedTable from '@/components/common/EnhancedTable'
import InfoIcon from '@/public/images/notifications/info.svg'
import { getDetailedPeriod } from '@safe-global/utils/utils/date'
import { TOOLTIP_TITLES } from '@/components/tx-flow/common/constants'

import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import { HelpCenterArticle, HelperCenterArticleTitles } from '@safe-global/utils/config/constants'
import SettingsCard from '@/components/settings/SettingsCard'

enum HeadCells {
  Recoverer = 'recoverer',
  Delay = 'delay',
  Expiry = 'expiry',
  Actions = 'actions',
}

const headCells = [
  { id: HeadCells.Recoverer, label: 'Recoverer' },
  {
    id: HeadCells.Delay,
    label: (
      <>
        Review window{' '}
        <Tooltip>
          <TooltipTrigger render={<span />}>
            <InfoIcon className="ml-1 inline size-4 fill-current align-middle text-[var(--color-border-main)]" />
          </TooltipTrigger>
          <TooltipContent>{TOOLTIP_TITLES.REVIEW_WINDOW}</TooltipContent>
        </Tooltip>
      </>
    ),
  },
  {
    id: HeadCells.Expiry,
    label: (
      <>
        Proposal expiry{' '}
        <Tooltip>
          <TooltipTrigger render={<span />}>
            <InfoIcon className="ml-1 inline size-4 fill-current align-middle text-[var(--color-border-main)]" />
          </TooltipTrigger>
          <TooltipContent>{TOOLTIP_TITLES.PROPOSAL_EXPIRY}</TooltipContent>
        </Tooltip>
      </>
    ),
  },
  { id: HeadCells.Actions, label: '', sticky: true },
]

export type RecovererRow = {
  recoverer: string
  delaySeconds: number
  expirySeconds: number
  actions: ReactNode
}

export type RecoverySettingsViewProps = {
  isRecoveryEnabled: boolean
  /** Undefined while recovery state is loading. */
  recovererRows?: RecovererRow[]
  setupButton: ReactNode
}

export function RecoverySettingsView({
  isRecoveryEnabled,
  recovererRows,
  setupButton,
}: RecoverySettingsViewProps): ReactElement {
  const rows = recovererRows?.map(({ recoverer, delaySeconds, expirySeconds, actions }) => ({
    cells: {
      [HeadCells.Recoverer]: {
        rawValue: recoverer,
        content: <EthHashInfo address={recoverer} showCopyButton hasExplorer />,
      },
      [HeadCells.Delay]: {
        rawValue: delaySeconds,
        content: <Typography>{delaySeconds === 0 ? 'none' : getDetailedPeriod(delaySeconds)}</Typography>,
      },
      [HeadCells.Expiry]: {
        rawValue: expirySeconds,
        content: <Typography>{expirySeconds === 0 ? 'never' : getDetailedPeriod(expirySeconds)}</Typography>,
      },
      [HeadCells.Actions]: {
        rawValue: '',
        content: <div className={tableCss.actions}>{actions}</div>,
      },
    },
  }))

  return (
    <SettingsCard title="Account recovery" titleClassName="mb-2">
      <Typography className="mb-4">
        {isRecoveryEnabled
          ? 'The trusted Recoverer will be able to recover your Safe account if you ever lose access. You can change Recoverers or alter your recovery setup at any time.'
          : 'Choose a trusted Recoverer to recover your Safe account if you ever lose access. Enabling the Account recovery module will require a transaction.'}{' '}
        <Track {...RECOVERY_EVENTS.LEARN_MORE} label="settings">
          <ExternalLink
            className="font-bold hover:text-muted-foreground"
            href={HelpCenterArticle.RECOVERY}
            title={HelperCenterArticleTitles.RECOVERY}
          >
            Learn more
          </ExternalLink>
        </Track>
      </Typography>

      {!isRecoveryEnabled ? setupButton : rows ? <EnhancedTable rows={rows} headCells={headCells} /> : null}
    </SettingsCard>
  )
}

export type SetupRecoveryButtonViewProps = {
  eventLabel: string
  onSetup: () => void
  renderCheckWallet: (children: (isOk: boolean) => ReactElement) => ReactNode
}

export const SetupRecoveryButtonView = ({ eventLabel, onSetup, renderCheckWallet }: SetupRecoveryButtonViewProps) => {
  return (
    <>
      {renderCheckWallet((isOk) => (
        <Track {...RECOVERY_EVENTS.SETUP_RECOVERY} label={eventLabel}>
          <Button
            data-testid="setup-recovery-btn"
            variant="default"
            disabled={!isOk}
            onClick={onSetup}
            className="mt-4"
          >
            Set up recovery
          </Button>
        </Track>
      ))}
    </>
  )
}
