import type { SafenetSimulationResponse } from '@/store/safenet'
import { List, ListItem, ListItemText, Paper, Typography } from '@mui/material'
import type { ReactElement } from 'react'
import css from './styles.module.css'
import StatusAction from './StatusAction'

function _getGuaranteeDisplayName(guarantee: string): string {
  switch (guarantee) {
    case 'no_delegatecall':
    case 'no_contract_recipient': // We don't want to override the recipient verification
      return 'Fraud verification'
    case 'recipient_signature':
      return 'Recipient verification'
    default:
      return 'Other'
  }
}

function _groupResultGuarantees({
  results,
}: Pick<SafenetSimulationResponse, 'results'>): { display: string; status: string; link?: string }[] {
  const groups = results.reduce(
    (groups, { guarantee, status, metadata }) => {
      const display = _getGuaranteeDisplayName(guarantee)
      if (status === 'skipped') {
        return groups
      }
      return {
        ...groups,
        [display]: { status, link: metadata?.link },
      }
    },
    {} as Record<string, { status: string; link?: string }>,
  )
  return Object.entries(groups)
    .map(([display, { status, link }]) => ({ display, status, link }))
    .sort((a, b) => a.display.localeCompare(b.display))
}

const SafenetTxSimulationSummary = ({ simulation }: { simulation: SafenetSimulationResponse }): ReactElement => {
  if (simulation.results.length === 0) {
    return <Typography>No Safenet checks enabled...</Typography>
  }

  const guarantees = _groupResultGuarantees(simulation)

  return (
    <Paper variant="outlined" className={css.wrapper}>
      {simulation.hasError && (
        <Typography color="error" className={css.errorSummary}>
          One or more Safenet checks failed!
        </Typography>
      )}

      <List>
        {guarantees.map(({ display, status, link }) => (
          <ListItem key={display} secondaryAction={<StatusAction status={status} link={link} />}>
            <ListItemText>{display}</ListItemText>
          </ListItem>
        ))}
      </List>
    </Paper>
  )
}

export default SafenetTxSimulationSummary
