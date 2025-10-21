import { type ReactElement, useContext, useState, useEffect, useRef } from 'react'
import { Box, Typography, Stack, IconButton, Collapse, Tooltip, SvgIcon } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import LaunchIcon from '@mui/icons-material/Launch'
import InfoIcon from '@/public/images/notifications/info.svg'
import UpdateIcon from '@/public/images/safe-shield/update.svg'
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import { TxInfoContext } from '@/components/tx-flow/TxInfoProvider'
import { useCurrentChain } from '@/hooks/useChains'
import {
  isTxSimulationEnabled,
  type SimulationTxParams,
} from '@safe-global/utils/components/tx/security/tenderly/utils'
import ExternalLink from '@/components/common/ExternalLink'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSigner } from '@/hooks/wallets/useWallet'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useSafeAddress from '@/hooks/useSafeAddress'
import type { SafeTransaction } from '@safe-global/types-kit'
import { SEVERITY_COLORS } from '@/features/safe-shield/constants'
import { useNestedTransaction } from '@/features/safe-shield/components/useNestedTransaction'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

export const TenderlySimulation = ({ safeTx }: { safeTx?: SafeTransaction }): ReactElement | null => {
  const { simulation, status, nestedTx } = useContext(TxInfoContext)
  const chain = useCurrentChain()
  const { safe } = useSafeInfo()
  const safeAddress = useSafeAddress()
  const signer = useSigner()
  const isSafeOwner = useIsSafeOwner()
  const showSimulation = chain && isTxSimulationEnabled(chain) && safeTx

  const [simulationExpanded, setSimulationExpanded] = useState(false)

  // Reset simulation state when transaction changes
  // Use useRef to track the previous transaction and only reset when it actually changes
  const prevTxDataRef = useRef<string | null>(null)

  useEffect(() => {
    const currentTxData = safeTx?.data ? JSON.stringify(safeTx.data) : null

    // Only reset if the transaction data actually changed
    if (currentTxData !== prevTxDataRef.current) {
      simulation.resetSimulation()
      nestedTx.simulation.resetSimulation()
      setSimulationExpanded(false)

      prevTxDataRef.current = currentTxData
    }
  }, [safeTx, simulation, nestedTx.simulation])

  const { nestedSafeInfo, nestedSafeTx, isNested } = useNestedTransaction(safeTx, chain)

  const handleToggleSimulation = () => {
    setSimulationExpanded(!simulationExpanded)
  }

  const handleRunSimulation = () => {
    if (!safeTx) return

    const executionOwner = isSafeOwner && signer?.address ? signer.address : safe.owners[0].value

    const simulationParams = {
      safe,
      executionOwner,
      transactions: safeTx,
      gasLimit: undefined,
    } as SimulationTxParams

    simulation.simulateTransaction(simulationParams)

    if (isNested) {
      const nestedSimulationParams = {
        safe: nestedSafeInfo,
        executionOwner: safeAddress,
        transactions: nestedSafeTx,
        gasLimit: undefined,
      } as SimulationTxParams

      nestedTx.simulation.simulateTransaction(nestedSimulationParams)
    }

    setSimulationExpanded(true)
  }

  const mainIsFinished = status.isFinished
  const nestedIsFinished = isNested ? nestedTx.status.isFinished : true
  const isSimulationFinished = mainIsFinished && nestedIsFinished

  const mainIsSuccess = status.isSuccess && !status.isError
  const nestedIsSuccess = isNested ? nestedTx.status.isSuccess && !nestedTx.status.isError : true
  const isSimulationSuccess = mainIsSuccess && nestedIsSuccess

  const isLoading = status.isLoading || (isNested && nestedTx.status.isLoading)

  if (!showSimulation) {
    return null
  }

  const showExpandable = isNested && isSimulationFinished

  const getSimulationHeaderText = () => {
    if (!isSimulationFinished) return 'Transaction simulation'
    if (isNested) return 'Transaction simulations'
    return isSimulationSuccess ? 'Simulation successful' : 'Simulation failed'
  }

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ padding: '12px', cursor: showExpandable ? 'pointer' : 'default' }}
        onClick={showExpandable ? handleToggleSimulation : undefined}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          {isSimulationFinished ? (
            <SeverityIcon severity={isSimulationSuccess ? Severity.OK : Severity.CRITICAL} width={16} height={16} />
          ) : (
            <SvgIcon component={UpdateIcon} inheritViewBox sx={{ fontSize: 16 }} />
          )}
          <Typography variant="body2" color="primary.light">
            {getSimulationHeaderText()}
          </Typography>
          {!isSimulationFinished && !isLoading && (
            <Tooltip
              title="Run a simulation to see if the transaction will succeed and get a full report."
              arrow
              placement="top"
            >
              <SvgIcon
                component={InfoIcon}
                inheritViewBox
                color="border"
                sx={{
                  fontSize: 16,
                }}
              />
            </Tooltip>
          )}
        </Stack>

        {!isSimulationFinished ? (
          <Box
            component="button"
            onClick={handleRunSimulation}
            disabled={isLoading}
            sx={{
              backgroundColor: 'background.lightGrey',
              border: 'none',
              borderRadius: '4px',
              px: 1,
              py: 0.25,
              cursor: isLoading ? 'default' : 'pointer',
              '&:hover': {
                backgroundColor: isLoading ? 'background.lightGrey' : 'border.light',
              },
            }}
          >
            <Typography
              sx={{
                fontSize: '12px',
                lineHeight: '2.015',
                letterSpacing: '0.4px',
                color: 'static.main',
              }}
            >
              {isLoading ? 'Running...' : 'Run'}
            </Typography>
          </Box>
        ) : isNested ? (
          <IconButton
            size="small"
            sx={{
              width: 16,
              height: 16,
              padding: 0,
              transform: simulationExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <KeyboardArrowDownIcon sx={{ width: 16, height: 16, color: 'text.secondary' }} />
          </IconButton>
        ) : (
          simulation.simulationLink && (
            <ExternalLink
              noIcon
              href={simulation.simulationLink}
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
            >
              <Typography
                sx={{
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '1px',
                  color: 'text.secondary',
                  textDecoration: 'underline',
                }}
              >
                View
              </Typography>
              <LaunchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </ExternalLink>
          )
        )}
      </Stack>

      {/* Show expandable content only for nested simulations */}
      {showExpandable && (
        <Collapse in={simulationExpanded}>
          <Box sx={{ padding: '4px 12px 16px' }}>
            <Stack gap={2}>
              <Box bgcolor="background.main" borderRadius="4px" overflow="hidden">
                <Box
                  sx={{
                    borderLeft: `4px solid ${mainIsSuccess ? SEVERITY_COLORS.OK.main : SEVERITY_COLORS.CRITICAL.main}`,
                    padding: '12px',
                  }}
                >
                  <Typography variant="body2" color="primary.light" sx={{ mb: 1 }}>
                    {mainIsSuccess ? 'Simulation successful.' : 'Simulation failed.'}
                  </Typography>
                  {simulation.simulationLink && (
                    <ExternalLink
                      noIcon
                      href={simulation.simulationLink}
                      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <Typography
                        sx={{
                          fontSize: '12px',
                          lineHeight: '16px',
                          letterSpacing: '1px',
                          color: 'text.secondary',
                          textDecoration: 'underline',
                        }}
                      >
                        View
                      </Typography>
                      <LaunchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    </ExternalLink>
                  )}
                </Box>
              </Box>

              <Box bgcolor="background.main" borderRadius="4px" overflow="hidden">
                <Box
                  sx={{
                    borderLeft: `4px solid ${nestedIsSuccess ? SEVERITY_COLORS.OK.main : SEVERITY_COLORS.CRITICAL.main}`,
                    padding: '12px',
                  }}
                >
                  <Typography variant="body2" color="primary.light" sx={{ mb: 1 }}>
                    {nestedIsSuccess
                      ? 'Nested transaction simulation successful.'
                      : 'Nested transaction simulation failed.'}
                  </Typography>
                  {nestedTx.simulation.simulationLink && (
                    <ExternalLink
                      noIcon
                      href={nestedTx.simulation.simulationLink}
                      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <Typography
                        sx={{
                          fontSize: '12px',
                          lineHeight: '16px',
                          letterSpacing: '1px',
                          color: 'text.secondary',
                          textDecoration: 'underline',
                        }}
                      >
                        View
                      </Typography>
                      <LaunchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    </ExternalLink>
                  )}
                </Box>
              </Box>
            </Stack>
          </Box>
        </Collapse>
      )}
    </Box>
  )
}
