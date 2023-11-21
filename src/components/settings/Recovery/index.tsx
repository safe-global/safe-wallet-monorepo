import { Alert, Box, Button, Grid, IconButton, Paper, SvgIcon, Tooltip, Typography } from '@mui/material'
import { useContext, useMemo } from 'react'
import type { ReactElement } from 'react'

import { EnableRecoveryFlow } from '@/components/tx-flow/flows/EnableRecovery'
import { TxModalContext } from '@/components/tx-flow'
import { Chip } from '@/components/common/Chip'
import ExternalLink from '@/components/common/ExternalLink'
import { RecoverAccountFlow } from '@/components/tx-flow/flows/RecoverAccount'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useAppSelector } from '@/store'
import { selectRecovery } from '@/store/recoverySlice'
import EthHashInfo from '@/components/common/EthHashInfo'
import DeleteIcon from '@/public/images/common/delete.svg'
import EditIcon from '@/public/images/common/edit.svg'
import EnhancedTable from '@/components/common/EnhancedTable'
import CheckWallet from '@/components/common/CheckWallet'
import InfoIcon from '@/public/images/notifications/info.svg'

import tableCss from '@/components/common/EnhancedTable/styles.module.css'

enum HeadCells {
  Guardian = 'guardian',
  TxCooldown = 'txCooldown',
  TxExpiration = 'txExpiration',
  Actions = 'actions',
}

const headCells = [
  { id: HeadCells.Guardian, label: 'Guardian' },
  {
    id: HeadCells.TxCooldown,
    label: (
      <>
        Recovery delay{' '}
        <Tooltip title="You can cancel any recovery attempt when it is not needed or wanted within the delay period.">
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
    id: HeadCells.TxExpiration,
    label: (
      <>
        Expiry{' '}
        <Tooltip title="A period of time after which the recovery attempt will expire and can no longer be executed.">
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

export function Recovery(): ReactElement {
  const { setTxFlow } = useContext(TxModalContext)
  const recovery = useAppSelector(selectRecovery)
  const isOwner = useIsSafeOwner()

  const rows = useMemo(() => {
    return recovery.flatMap(({ guardians, txCooldown, txExpiration }) => {
      return guardians.map((guardian) => {
        const DAY_IN_SECONDS = 60 * 60 * 24

        const txCooldownDays = txCooldown.div(DAY_IN_SECONDS).toNumber()
        const txExpirationDays = txExpiration.div(DAY_IN_SECONDS).toNumber()

        return {
          cells: {
            [HeadCells.Guardian]: {
              rawValue: guardian,
              content: <EthHashInfo address={guardian} showCopyButton hasExplorer />,
            },
            [HeadCells.TxCooldown]: {
              rawValue: txCooldownDays,
              content: (
                <Typography>
                  {txCooldownDays} day{txCooldownDays > 1 ? 's' : ''}
                </Typography>
              ),
            },
            [HeadCells.TxExpiration]: {
              rawValue: txExpirationDays,
              content: (
                <Typography>
                  {txExpirationDays === 0 ? 'never' : `${txExpirationDays} day${txExpirationDays > 1 ? 's' : ''}`}
                </Typography>
              ),
            },
            [HeadCells.Actions]: {
              rawValue: '',
              sticky: true,
              content: (
                <div className={tableCss.actions}>
                  {isOwner && (
                    <CheckWallet>
                      {(isOk) => (
                        <>
                          <Tooltip title={isOk ? 'Edit recovery setup' : undefined}>
                            <span>
                              {/* TODO: Display flow */}
                              <IconButton onClick={() => setTxFlow(undefined)} size="small" disabled={!isOk}>
                                <SvgIcon component={EditIcon} inheritViewBox color="border" fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title={isOk ? 'Disable recovery' : undefined}>
                            <span>
                              {/* TODO: Display flow */}
                              <IconButton onClick={() => setTxFlow(undefined)} size="small" disabled={!isOk}>
                                <SvgIcon component={DeleteIcon} inheritViewBox color="error" fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      )}
                    </CheckWallet>
                  )}
                </div>
              ),
            },
          },
        }
      })
    })
  }, [recovery, isOwner, setTxFlow])

  return (
    <Paper sx={{ p: 4 }}>
      <Grid container spacing={3}>
        <Grid item lg={4} xs={12}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="h4" fontWeight="bold">
              Account recovery
            </Typography>

            <Chip label="New" />
          </Box>
        </Grid>

        <Grid item xs>
          <Typography mb={2}>
            Choose a trusted guardian to recover your Safe Account, in case you should ever lose access to your Account.
            Enabling the Account recovery module will require a transactions.
          </Typography>

          {recovery.length === 0 ? (
            <>
              <Alert severity="info">
                Unhappy with the provided option? {/* TODO: Add link */}
                <ExternalLink noIcon href="#">
                  Give us feedback
                </ExternalLink>
              </Alert>
              <Button variant="contained" onClick={() => setTxFlow(<EnableRecoveryFlow />)} sx={{ mt: 2 }}>
                Set up recovery
              </Button>
            </>
          ) : (
            <EnhancedTable rows={rows} headCells={headCells} />
          )}
        </Grid>
      </Grid>
    </Paper>
  )
}
