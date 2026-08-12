import Track from '@/components/common/Track'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { type ReactElement, useContext, useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import ExternalLink from '@/components/common/ExternalLink'
import { DelayModifierRow } from './DelayModifierRow'
import useRecovery from '../../hooks/useRecovery'
import EthHashInfo from '@/components/common/EthHashInfo'
import EnhancedTable from '@/components/common/EnhancedTable'
import InfoIcon from '@/public/images/notifications/info.svg'
import CheckWallet from '@/components/common/CheckWallet'
import { getPeriod } from '@safe-global/utils/utils/date'
import { TOOLTIP_TITLES } from '@/components/tx-flow/common/constants'

import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import { HelpCenterArticle, HelperCenterArticleTitles } from '@safe-global/utils/config/constants'
import { TxModalContext } from '@/components/tx-flow'
import UpsertRecoveryFlow from '@/components/tx-flow/flows/UpsertRecovery'

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

function RecoverySettings(): ReactElement {
  const [recovery] = useRecovery()

  const isRecoveryEnabled = recovery && recovery.length > 0

  const rows = useMemo(() => {
    return recovery?.flatMap((delayModifier) => {
      const { recoverers, delay, expiry } = delayModifier

      return recoverers.map((recoverer) => {
        const delaySeconds = Number(delay)
        const expirySeconds = Number(expiry)

        return {
          cells: {
            [HeadCells.Recoverer]: {
              rawValue: recoverer,
              content: <EthHashInfo address={recoverer} showCopyButton hasExplorer />,
            },
            [HeadCells.Delay]: {
              rawValue: delaySeconds,
              content: <Typography>{delaySeconds === 0 ? 'none' : getPeriod(delaySeconds)}</Typography>,
            },
            [HeadCells.Expiry]: {
              rawValue: expirySeconds,
              content: <Typography>{expirySeconds === 0 ? 'never' : getPeriod(expirySeconds)}</Typography>,
            },
            [HeadCells.Actions]: {
              rawValue: '',
              sticky: true,
              content: (
                <div className={tableCss.actions}>
                  <DelayModifierRow delayModifier={delayModifier} />
                </div>
              ),
            },
          },
        }
      })
    })
  }, [recovery])

  return (
    <div className="bg-card rounded-lg p-8">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4">
          <div className="mb-2 flex items-center gap-2">
            <Typography variant="h4">Account recovery</Typography>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <Typography className="mb-4">
            {isRecoveryEnabled
              ? 'The trusted Recoverer will be able to recover your Safe account if you ever lose access. You can change Recoverers or alter your recovery setup at any time.'
              : 'Choose a trusted Recoverer to recover your Safe account if you ever lose access. Enabling the Account recovery module will require a transaction.'}{' '}
            <Track {...RECOVERY_EVENTS.LEARN_MORE} label="settings">
              <ExternalLink href={HelpCenterArticle.RECOVERY} title={HelperCenterArticleTitles.RECOVERY}>
                Learn more
              </ExternalLink>
            </Track>
          </Typography>

          {!isRecoveryEnabled ? (
            <SetupRecoveryButton eventLabel="settings" />
          ) : rows ? (
            <EnhancedTable rows={rows} headCells={headCells} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

const SetupRecoveryButton = ({ eventLabel }: { eventLabel: string }) => {
  const { setTxFlow } = useContext(TxModalContext)
  return (
    <>
      <CheckWallet>
        {(isOk) => (
          <Track {...RECOVERY_EVENTS.SETUP_RECOVERY} label={eventLabel}>
            <Button
              data-testid="setup-recovery-btn"
              variant="default"
              disabled={!isOk}
              onClick={() => setTxFlow(<UpsertRecoveryFlow />)}
              className="mt-4"
            >
              Set up recovery
            </Button>
          </Track>
        )}
      </CheckWallet>
    </>
  )
}

export default RecoverySettings
