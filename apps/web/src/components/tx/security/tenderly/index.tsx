import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { Alert, Box, Button, Paper, SvgIcon, Tooltip, Typography } from '@mui/material'
import { useContext, useEffect } from 'react'
import type { ReactElement } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import { useSigner } from '@/hooks/wallets/useWallet'
import CheckIcon from '@/public/images/common/check.svg'
import CloseIcon from '@/public/images/common/close.svg'
import { useDarkMode } from '@/hooks/useDarkMode'
import CircularProgress from '@mui/material/CircularProgress'
import ExternalLink from '@/components/common/ExternalLink'
import { useCurrentChain } from '@/hooks/useChains'
import {
  isTxSimulationEnabled,
  type SimulationTxParams,
} from '@safe-global/utils/components/tx/security/tenderly/utils'

import css from './styles.module.css'
import sharedCss from '@/components/tx/security/shared/styles.module.css'
import { TxInfoContext } from '@/components/tx-flow/TxInfoProvider'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import InfoIcon from '@/public/images/notifications/info.svg'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { getSafeInfo } from '@safe-global/safe-gateway-typescript-sdk'

export type TxSimulationProps = {
  transactions?: SimulationTxParams['transactions']
  gasLimit?: number
  disabled: boolean
  executionOwner?: string
  title?: string
  nestedSafe?: string
}

// TODO: Investigate resetting on gasLimit change as we are not simulating with the gasLimit of the tx
// otherwise remove all usage of gasLimit in simulation. Note: this was previously being done.
// TODO: Test this component
const TxSimulationBlock = ({
  transactions,
  disabled,
  gasLimit,
  executionOwner,
  nestedSafe,
  title = 'Run a simulation',
}: TxSimulationProps): ReactElement => {
  const { safe } = useSafeInfo()
  const chain = useCurrentChain()
  const signer = useSigner()
  const isSafeOwner = useIsSafeOwner()
  const isDarkMode = useDarkMode()
  const { safeTx } = useContext(SafeTxContext)
  const {
    simulation: { simulateTransaction, resetSimulation },
    status,
    nestedTx,
  } = useContext(TxInfoContext)

  const [nestedSafeInfo] = useAsync(
    () => (!!chain && !!nestedSafe ? getSafeInfo(chain.chainId, nestedSafe) : undefined),
    [chain, nestedSafe],
  )

  const handleSimulation = async () => {
    if (!signer || !transactions) {
      return
    }

    const simulationTxParams = {
      safe: nestedSafeInfo ?? safe,
      // fall back to the first owner of the safe in case the transaction is created by a proposer
      executionOwner: executionOwner ?? (isSafeOwner ? signer.address : safe.owners[0].value),
      transactions,
      gasLimit,
    } as SimulationTxParams

    if (!!nestedSafe) {
      nestedTx.simulation.simulateTransaction(simulationTxParams)
    } else {
      simulateTransaction(simulationTxParams)
    }
  }

  const { isFinished, isError, isSuccess, isCallTraceError, isLoading } = !!nestedSafe ? nestedTx.status : status

  // Reset simulation if safeTx changes
  useEffect(() => {
    resetSimulation()
  }, [safeTx, resetSimulation])

  return (
    <Box>
      <Paper variant="outlined" className={sharedCss.wrapper} sx={{ backgroundColor: 'transparent' }}>
        <div className={css.wrapper}>
          <Typography variant="body2" fontWeight={700}>
            {title}

            <Tooltip
              title="This transaction can be simulated before execution to ensure that it will be succeed, generating a detailed report of the transaction execution."
              arrow
              placement="top"
            >
              <span>
                <SvgIcon
                  component={InfoIcon}
                  inheritViewBox
                  color="border"
                  fontSize="small"
                  sx={{
                    verticalAlign: 'middle',
                    ml: 0.5,
                  }}
                />
              </span>
            </Tooltip>
          </Typography>
          <Typography variant="caption" className={sharedCss.poweredBy}>
            Powered by{' '}
            <img
              src={isDarkMode ? '/images/transactions/tenderly-light.svg' : '/images/transactions/tenderly-dark.svg'}
              alt="Tenderly"
              width="65px"
              height="15px"
            />
          </Typography>
        </div>

        <div className={sharedCss.result}>
          {isLoading ? (
            <CircularProgress
              size={22}
              sx={{
                color: ({ palette }) => palette.text.secondary,
              }}
            />
          ) : isFinished ? (
            !isSuccess || isError || isCallTraceError ? (
              <Typography
                variant="body2"
                className={sharedCss.result}
                sx={{
                  color: 'error.main',
                }}
              >
                <SvgIcon
                  component={CloseIcon}
                  inheritViewBox
                  fontSize="small"
                  sx={{ verticalAlign: 'middle', mr: 1 }}
                />
                Error
              </Typography>
            ) : (
              <Typography
                data-testid="simulation-success-msg"
                variant="body2"
                className={sharedCss.result}
                sx={{
                  color: 'success.main',
                }}
              >
                <SvgIcon
                  component={CheckIcon}
                  inheritViewBox
                  fontSize="small"
                  sx={{ verticalAlign: 'middle', mr: 1 }}
                />
                Success
              </Typography>
            )
          ) : (
            <Track {...MODALS_EVENTS.SIMULATE_TX}>
              <Button
                data-testid="simulate-btn"
                variant="outlined"
                size="small"
                className={css.simulate}
                onClick={handleSimulation}
                disabled={!transactions || disabled}
              >
                Simulate
              </Button>
            </Track>
          )}
        </div>
      </Paper>
    </Box>
  )
}

export const TxSimulation = (props: TxSimulationProps): ReactElement | null => {
  const chain = useCurrentChain()

  if (!chain || !isTxSimulationEnabled(chain)) {
    return null
  }

  return <TxSimulationBlock {...props} />
}

// TODO: Test this component
export const TxSimulationMessage = ({ isNested = false }: { isNested?: boolean }) => {
  const txInfo = useContext(TxInfoContext)

  const { isFinished, isError, isSuccess, isCallTraceError } = isNested ? txInfo.nestedTx.status : txInfo.status
  const { simulationLink, simulation, requestError } = isNested ? txInfo.nestedTx.simulation : txInfo.simulation

  if (!isFinished) {
    return null
  }

  if (!isSuccess || isError || isCallTraceError) {
    return (
      <Alert severity="error" sx={{ border: 'unset' }}>
        <Typography variant="body1" fontWeight={700}>
          Simulation failed
        </Typography>
        {requestError ? (
          <Typography color="error" variant="body2">
            An unexpected error occurred during simulation: <b>{requestError}</b>.
          </Typography>
        ) : (
          <Typography variant="body2">
            {isCallTraceError ? (
              <>The transaction failed during the simulation.</>
            ) : (
              <>
                The transaction failed during the simulation throwing error{' '}
                <b>{simulation?.transaction.error_message}</b> in the contract at{' '}
                <b>{simulation?.transaction.error_info?.address}</b>.
              </>
            )}{' '}
            Full simulation report is available <ExternalLink href={simulationLink}>on Tenderly</ExternalLink>.
          </Typography>
        )}
      </Alert>
    )
  }

  return (
    <Alert severity="info" sx={{ border: 'unset' }}>
      <Typography variant="body2" fontWeight={700}>
        Simulation successful
      </Typography>
      Full simulation report is available <ExternalLink href={simulationLink}>on Tenderly</ExternalLink>.
    </Alert>
  )
}
