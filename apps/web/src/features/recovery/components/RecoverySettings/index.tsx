import Track from '@/components/common/Track'
import { ChooseRecoveryMethodModal } from './ChooseRecoveryMethodModal'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { Box, Button, Grid, Paper, SvgIcon, Tooltip, Typography } from '@mui/material'
import { type ReactElement, useMemo, useState } from 'react'

import ExternalLink from '@/components/common/ExternalLink'
import { DelayModifierRow } from './DelayModifierRow'
import useRecovery from '@/features/recovery/hooks/useRecovery'
import EthHashInfo from '@/components/common/EthHashInfo'
import EnhancedTable from '@/components/common/EnhancedTable'
import InfoIcon from '@/public/images/notifications/info.svg'
import CheckWallet from '@/components/common/CheckWallet'
import { getPeriod } from '@safe-global/utils/utils/date'
import { TOOLTIP_TITLES } from '@/components/tx-flow/common/constants'

import tableCss from '@/components/common/EnhancedTable/styles.module.css'
import { HelpCenterArticle, HelperCenterArticleTitles } from '@safe-global/utils/config/constants'

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
        <Tooltip title={TOOLTIP_TITLES.REVIEW_WINDOW}>
          <span>
            <SvgIcon
              component={InfoIcon}
              inheritViewBox
              color="border"
              fontSize="small"
              sx={{ verticalAlign: 'middle', ml: 0.5 }}
            />
          </span>
        </Tooltip>
      </>
    ),
  },
  {
    id: HeadCells.Expiry,
    label: (
      <>
        Proposal expiry{' '}
        <Tooltip title={TOOLTIP_TITLES.PROPOSAL_EXPIRY}>
          <span>
            <SvgIcon
              component={InfoIcon}
              inheritViewBox
              color="border"
              fontSize="small"
              sx={{ verticalAlign: 'middle', ml: 0.5 }}
            />
          </span>
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
    <Paper sx={{ p: 4 }}>
      <Grid container spacing={3}>
        <Grid item lg={4} xs={12}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="h4" fontWeight="bold">
              Account recovery
            </Typography>
          </Box>
        </Grid>

        <Grid item xs>
          <Typography mb={2}>
            {isRecoveryEnabled
              ? 'The trusted Recoverer will be able to recover your Safe Account if you ever lose access. You can change Recoverers or alter your recovery setup at any time.'
              : 'Choose a trusted Recoverer to recover your Safe Account if you ever lose access. Enabling the Account recovery module will require a transaction.'}{' '}
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
        </Grid>
      </Grid>
    </Paper>
  )
}

export const SetupRecoveryButton = ({ eventLabel }: { eventLabel: string }) => {
  const [open, setOpen] = useState<boolean>(false)

  return (
    <>
      <CheckWallet>
        {(isOk) => (
          <Track {...RECOVERY_EVENTS.SETUP_RECOVERY} label={eventLabel}>
            <Button
              data-testid="setup-recovery-btn"
              variant="contained"
              disabled={!isOk}
              onClick={() => setOpen(true)}
              sx={{ mt: 2 }}
            >
              Set up recovery
            </Button>
          </Track>
        )}
      </CheckWallet>

      <ChooseRecoveryMethodModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default RecoverySettings
