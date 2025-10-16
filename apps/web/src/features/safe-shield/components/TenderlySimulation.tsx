import { type ReactElement, useContext, useState, useMemo } from 'react'
import { Box, Typography, Stack, IconButton, Collapse, Tooltip, SvgIcon } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import LaunchIcon from '@mui/icons-material/Launch'
import InfoIcon from '@/public/images/notifications/info.svg'
import UpdateIcon from '@/public/images/safe-shield/update.svg'
import AlertIcon from '@/public/images/safe-shield/alert.svg'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
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
import useAsync from '@safe-global/utils/hooks/useAsync'
import { getSafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useGetTransactionDetailsQuery } from '@/store/api/gateway'
import { skipToken } from '@reduxjs/toolkit/query'
import extractTxInfo from '@/services/tx/extractTxInfo'
import type { SafeTransaction } from '@safe-global/types-kit'

const safeInterface = Safe__factory.createInterface()

export const TenderlySimulation = (): ReactElement | null => {
  const { safeTx } = useContext(SafeTxContext)
  const { simulation, status, nestedTx } = useContext(TxInfoContext)
  const chain = useCurrentChain()
  const { safe } = useSafeInfo()
  const safeAddress = useSafeAddress()
  const signer = useSigner()
  const isSafeOwner = useIsSafeOwner()
  const showSimulation = chain && isTxSimulationEnabled(chain) && safeTx

  const [simulationExpanded, setSimulationExpanded] = useState(false)

  const nestedTxInfo = useMemo(() => {
    if (!safeTx?.data.data) return null

    const txData = safeTx.data.data
    const approveHashSelector = safeInterface.getFunction('approveHash').selector
    const execTransactionSelector = safeInterface.getFunction('execTransaction').selector

    if (txData.startsWith(approveHashSelector)) {
      try {
        const params = safeInterface.decodeFunctionData('approveHash', txData)
        return {
          type: 'approveHash' as const,
          signedHash: params[0] as string,
          nestedSafeAddress: safeTx.data.to,
        }
      } catch (e) {
        return null
      }
    }

    if (txData.startsWith(execTransactionSelector)) {
      return {
        type: 'execTransaction' as const,
        nestedSafeAddress: safeTx.data.to,
      }
    }

    return null
  }, [safeTx])

  const { data: nestedTxDetails } = useGetTransactionDetailsQuery(
    nestedTxInfo?.type === 'approveHash' && nestedTxInfo.signedHash && chain
      ? {
          chainId: chain.chainId,
          txId: nestedTxInfo.signedHash,
        }
      : skipToken,
  )

  const [nestedSafeInfo] = useAsync(
    () =>
      !!chain && !!nestedTxInfo?.nestedSafeAddress
        ? getSafeInfo(chain.chainId, nestedTxInfo.nestedSafeAddress)
        : undefined,
    [chain, nestedTxInfo],
  )

  const nestedSafeTx = useMemo<SafeTransaction | undefined>(() => {
    if (!nestedTxInfo) return undefined

    if (nestedTxInfo.type === 'approveHash' && nestedTxDetails) {
      return {
        addSignature: () => {},
        encodedSignatures: () => '',
        getSignature: () => undefined,
        data: extractTxInfo(nestedTxDetails).txParams,
        signatures: new Map(),
      }
    }

    return undefined
  }, [nestedTxInfo, nestedTxDetails])

  const handleToggleSimulation = () => {
    setSimulationExpanded(!simulationExpanded)
  }

  const handleRunSimulation = () => {
    if (!safeTx) return

    if (nestedTxInfo && nestedSafeInfo && nestedSafeTx) {
      const simulationParams = {
        safe: nestedSafeInfo,
        executionOwner: safeAddress,
        transactions: nestedSafeTx,
        gasLimit: undefined,
      } as SimulationTxParams

      nestedTx.simulation.simulateTransaction(simulationParams)
      setSimulationExpanded(true)
      return
    }

    const executionOwner = isSafeOwner && signer?.address ? signer.address : safe.owners[0].value

    const simulationParams = {
      safe,
      executionOwner,
      transactions: safeTx,
      gasLimit: undefined,
    } as SimulationTxParams

    simulation.simulateTransaction(simulationParams)
    setSimulationExpanded(true)
  }

  const isNested = !!nestedTxInfo
  const currentStatus = isNested ? nestedTx.status : status

  const isSimulationFinished = currentStatus.isFinished
  const isSimulationSuccess = currentStatus.isSuccess && !currentStatus.isError
  const currentSimulationLink = isNested ? nestedTx.simulation.simulationLink : simulation.simulationLink

  if (!showSimulation) {
    return null
  }

  return (
    <Box>
      {/* Card header - always visible */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ padding: '12px', cursor: isSimulationFinished ? 'pointer' : 'default' }}
        onClick={isSimulationFinished ? handleToggleSimulation : undefined}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          {isSimulationFinished ? (
            isSimulationSuccess ? (
              <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
            ) : (
              <SvgIcon component={AlertIcon} inheritViewBox sx={{ fontSize: 16 }} />
            )
          ) : (
            <SvgIcon component={UpdateIcon} inheritViewBox sx={{ fontSize: 16 }} />
          )}
          <Typography variant="body2" color="primary.light">
            {isSimulationFinished ? 'Transaction simulations' : 'Transaction simulation'}
          </Typography>
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
        </Stack>

        {!isSimulationFinished ? (
          <Box
            component="button"
            onClick={handleRunSimulation}
            disabled={currentStatus.isLoading}
            sx={{
              backgroundColor: 'background.lightGrey',
              border: 'none',
              borderRadius: '4px',
              px: 1,
              py: 0.25,
              cursor: currentStatus.isLoading ? 'default' : 'pointer',
              '&:hover': {
                backgroundColor: currentStatus.isLoading ? 'background.lightGrey' : 'border.light',
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
              {currentStatus.isLoading ? 'Running...' : 'Run'}
            </Typography>
          </Box>
        ) : (
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
        )}
      </Stack>

      {/* Expanded content */}
      <Collapse in={isSimulationFinished && simulationExpanded}>
        <Box sx={{ padding: '4px 12px 16px' }}>
          <Box bgcolor="background.main" borderRadius="4px" overflow="hidden">
            <Box
              sx={{
                borderLeft: `4px solid ${isSimulationSuccess ? 'var(--color-success-main)' : 'var(--color-error-main)'}`,
                padding: '12px',
              }}
            >
              <Typography variant="body2" color="primary.light" sx={{ mb: 1 }}>
                {isSimulationSuccess
                  ? isNested
                    ? 'Nested transaction simulation successful.'
                    : 'Simulation successful.'
                  : isNested
                    ? 'Nested transaction simulation failed.'
                    : 'Simulation failed.'}
              </Typography>
              {currentSimulationLink && (
                <ExternalLink
                  noIcon
                  href={currentSimulationLink}
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
        </Box>
      </Collapse>
    </Box>
  )
}
