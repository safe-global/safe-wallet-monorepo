import { Accordion, AccordionSummary, Box, Button, Typography } from '@mui/material'
import { useContext, type ReactElement } from 'react'
import css from '@/components/transactions/TxSummary/styles.module.css'
import DateTime from '@/components/common/DateTime'
import { type GnosisPayTxItem } from '@/store/gnosisPayTxsSlice'
import TxStatusChip from '@/components/transactions/TxStatusChip'
import CooldownButton from '@/components/common/CooldownButton'
import { TxModalContext } from '@/components/tx-flow'
import ExecuteGnosisPayTx from '../ExecuteGnosisPayTx'
import SkipExpiredGnosisPay from '../SkipExpiredGnosisPayTxs'

export function GnosisPayQueueItemSummary({ item }: { item: GnosisPayTxItem }): ReactElement {
  const isExecutable = Date.now() > item.executableAt
  const { setTxFlow } = useContext(TxModalContext)

  const onExecute = () => {
    setTxFlow(<ExecuteGnosisPayTx gnosisPayTx={item} />)
  }

  const onSkip = () => {
    setTxFlow(<SkipExpiredGnosisPay />)
  }

  const isExpired = Date.now() >= item.expiresAt

  return (
    <Accordion disableGutters elevation={0} expanded={false}>
      <AccordionSummary sx={{ justifyContent: 'flex-start', overflowX: 'auto' }}>
        <Box className={css.gridContainer}>
          <Box gridArea="nonce">
            <Typography>{item.queueNonce}</Typography>
          </Box>
          <Box gridArea="type">
            <Typography>Gnosis Pay Delay</Typography>
          </Box>

          <Box gridArea="date" data-testid="tx-date" className={css.date}>
            <DateTime value={item.executableAt} />
          </Box>

          <Box gridArea="status">
            {isExpired ? (
              <TxStatusChip color="error">Expired</TxStatusChip>
            ) : isExecutable ? (
              <TxStatusChip color="success">Ready</TxStatusChip>
            ) : (
              <TxStatusChip color="info">Cooldown</TxStatusChip>
            )}
          </Box>

          <Box gridArea="actions" mr={2} display="flex" justifyContent="center">
            {isExpired ? (
              <Button variant="contained" size="small" onClick={onSkip}>
                Skip
              </Button>
            ) : isExecutable ? (
              <Button variant="contained" size="small" onClick={onExecute}>
                Execute
              </Button>
            ) : (
              <CooldownButton
                cooldown={(item.executableAt - Date.now()) / 1000}
                startDisabled
                variant="contained"
                size="small"
                onClick={onExecute}
              >
                Execute
              </CooldownButton>
            )}
          </Box>
        </Box>
      </AccordionSummary>
    </Accordion>
  )
}

export default GnosisPayQueueItemSummary
