import { type ReactElement, useContext, useState, useMemo } from 'react'
import { Box, Typography, Card, SvgIcon, Stack, Collapse, IconButton, Tooltip } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import LaunchIcon from '@mui/icons-material/Launch'
import SafeShieldLogoFull from '@/public/images/safe-shield/safe-shield-logo.svg'
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

const SafeShieldWidget = (): ReactElement => {
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

  return (
    <Stack gap={1}>
      <Card>
        {/* Header Frame */}
        <Box padding="2px 2px 0px">
          <Stack
            direction="row"
            gap={1}
            sx={{ backgroundColor: 'success.light' }}
            borderRadius="6px 6px 0px 0px"
            px={2}
            py={1}
          >
            <Typography
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                lineHeight: '16px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: 'success.main',
              }}
            >
              checks passed
            </Typography>
          </Stack>
        </Box>
        {/* Content Frame */}
        <Box padding="0px 4px 4px">
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'background.main',
              borderTop: 'none',
              borderRadius: '0px 0px 6px 6px',
            }}
          >
            {showSimulation && (
              <Box>
                <Box sx={{ p: 1.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: isSimulationFinished ? 'pointer' : 'default',
                      mb: isSimulationFinished && simulationExpanded ? 2 : 0,
                    }}
                    onClick={isSimulationFinished ? handleToggleSimulation : undefined}
                  >
                    <Stack direction="row" gap={1} alignItems="center">
                      {isSimulationFinished ? (
                        isSimulationSuccess ? (
                          <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        ) : (
                          <SvgIcon component={AlertIcon} inheritViewBox sx={{ fontSize: 16 }} />
                        )
                      ) : (
                        <SvgIcon component={UpdateIcon} inheritViewBox sx={{ fontSize: 16 }} />
                      )}
                      <Typography variant="body2" color="text.secondary">
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
                      <IconButton size="small" sx={{ width: 16, height: 16 }}>
                        {simulationExpanded ? (
                          <KeyboardArrowUpIcon fontSize="small" />
                        ) : (
                          <KeyboardArrowDownIcon fontSize="small" />
                        )}
                      </IconButton>
                    )}
                  </Box>

                  <Collapse in={isSimulationFinished && simulationExpanded}>
                    <Box
                      sx={{
                        backgroundColor: 'background.main',
                        borderRadius: '4px',
                        display: 'flex',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: '4px',
                          backgroundColor: isSimulationSuccess ? 'success.main' : 'error.main',
                          borderRadius: '4px 0 0 4px',
                        }}
                      />
                      <Box sx={{ p: 1, pl: 1.5, flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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
                  </Collapse>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Card>
      {/* Secured by Safe section */}{' '}
      <Stack direction="row" alignItems="center" alignSelf="flex-end">
        <Typography variant="body2" color="text.secondary" fontSize={13} lineHeight={1.38} whiteSpace="nowrap">
          Secured by
        </Typography>

        <SvgIcon component={SafeShieldLogoFull} inheritViewBox sx={{ width: 100.83, height: 14.87 }} />
      </Stack>
    </Stack>
  )
}

export default SafeShieldWidget
