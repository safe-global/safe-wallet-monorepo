import { Alert, AlertTitle, Button, Paper, SvgIcon, Typography } from '@mui/material'
import { useContext, useEffect } from 'react'
import type { ReactElement } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import CheckIcon from '@/public/images/common/check.svg'
import CloseIcon from '@/public/images/common/close.svg'
import { useDarkMode } from '@/hooks/useDarkMode'
import CircularProgress from '@mui/material/CircularProgress'
import ExternalLink from '@/components/common/ExternalLink'
import { useCurrentChain } from '@/hooks/useChains'
import { FETCH_STATUS } from '../TxSimulation/types'
import { isTxSimulationEnabled } from '../TxSimulation/utils'
import type { SimulationTxParams } from '../TxSimulation/utils'
import type { TenderlySimulation } from '../TxSimulation/types'

import css from './styles.module.css'
import { TxInfoContext } from '@/components/tx-flow/TxInfoProvider'

export type TxSimulationProps = {
  transactions?: SimulationTxParams['transactions']
  gasLimit?: number
  disabled: boolean
}

const getCallTraceErrors = (simulation?: TenderlySimulation) => {
  if (!simulation || !simulation.simulation.status) {
    return []
  }

  return simulation.transaction.call_trace.filter((call) => call.error)
}

const TxSimulationBlock = ({ transactions, disabled, gasLimit }: TxSimulationProps): ReactElement => {
  const { safe } = useSafeInfo()
  const wallet = useWallet()
  const isDarkMode = useDarkMode()
  const { simulateTransaction, simulationRequestStatus, resetSimulation } = useContext(TxInfoContext)

  const isLoading = simulationRequestStatus === FETCH_STATUS.LOADING
  const isSuccess = simulationRequestStatus === FETCH_STATUS.SUCCESS
  const isError = simulationRequestStatus === FETCH_STATUS.ERROR

  const handleSimulation = async () => {
    if (!wallet) {
      return
    }

    simulateTransaction({
      safe,
      executionOwner: wallet.address,
      transactions,
      gasLimit,
    } as SimulationTxParams)
  }

  // Reset simulation if gas limit changes
  // TODO: Remove since we are not passing gasLimit anymore
  useEffect(() => {
    resetSimulation()
  }, [gasLimit, resetSimulation])

  return (
    <Paper variant="outlined" className={css.wrapper}>
      <div>
        <Typography variant="body2" fontWeight={700}>
          Simulate transaction
        </Typography>
        <Typography variant="caption" className={css.poweredBy}>
          Powered by{' '}
          <img
            src={isDarkMode ? '/images/transactions/tenderly-light.svg' : '/images/transactions/tenderly-dark.svg'}
            alt="Tenderly"
            width="65px"
            height="15px"
          />
        </Typography>
      </div>

      <div className={css.result}>
        {isSuccess ? (
          <Typography variant="body2" color="success.main" className={css.result}>
            <SvgIcon component={CheckIcon} inheritViewBox fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
            Success
          </Typography>
        ) : isError ? (
          <Typography variant="body2" color="error.main" className={css.result}>
            <SvgIcon component={CloseIcon} inheritViewBox fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
            Error
          </Typography>
        ) : isLoading ? (
          <CircularProgress size={30} />
        ) : (
          <Button
            variant="outlined"
            size="small"
            className={css.simulate}
            onClick={handleSimulation}
            disabled={!transactions || disabled}
          >
            Simulate
          </Button>
        )}
      </div>
    </Paper>
  )
}

export const TxSimulation = (props: TxSimulationProps): ReactElement | null => {
  const chain = useCurrentChain()

  if (!chain || !isTxSimulationEnabled(chain)) {
    return null
  }

  return <TxSimulationBlock {...props} />
}

export const SimulationMessage = () => {
  const { simulationRequestStatus, simulationLink, simulation, requestError } = useContext(TxInfoContext)

  const isSuccess = simulationRequestStatus === FETCH_STATUS.SUCCESS
  const isError = simulationRequestStatus === FETCH_STATUS.ERROR
  const isFinished = isSuccess || isError

  // Safe can emit failure event even though Tenderly simulation succeeds
  const isCallTraceError = getCallTraceErrors(simulation).length > 0

  if (!isFinished) return null

  return (
    <div>
      {isSuccess ? (
        <Alert severity="info">
          <AlertTitle>Simulation successful</AlertTitle>
          Full simulation report is available <ExternalLink href={simulationLink}>on Tenderly</ExternalLink>.
        </Alert>
      ) : isError ? (
        <Alert severity="error">
          <AlertTitle>Simulation failed</AlertTitle>
          {requestError ? (
            <>
              An unexpected error occurred during simulation: <b>{requestError}</b>.
            </>
          ) : isCallTraceError ? (
            'The transaction failed during the simulation.'
          ) : (
            <>
              The transaction failed during the simulation throwing error <b>{simulation?.transaction.error_message}</b>{' '}
              in the contract at <b>{simulation?.transaction.error_info?.address}</b>.
            </>
          )}{' '}
          Full simulation report is available <ExternalLink href={simulationLink}>on Tenderly</ExternalLink>.
        </Alert>
      ) : null}
    </div>
  )
}
