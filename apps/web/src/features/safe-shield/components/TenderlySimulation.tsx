import { type ReactElement, useContext, useState, useEffect, useRef } from 'react'
import { TxInfoContext } from '@/components/tx-flow/TxInfoProvider'
import { useCurrentChain } from '@/hooks/useChains'
import {
  getSimulationOutcome,
  isTxSimulationEnabled,
  type SimulationTxParams,
} from '@safe-global/utils/components/tx/security/tenderly/utils'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSigner } from '@/hooks/wallets/useWallet'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useSafeAddress from '@/hooks/useSafeAddress'
import type { SafeTransaction } from '@safe-global/types-kit'
import { useNestedTransaction } from './useNestedTransaction'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { trackEvent, SAFE_SHIELD_EVENTS, MixpanelEventParams } from '@/services/analytics'
import { TenderlySimulationView } from '@views/features/safe-shield/components/TenderlySimulationView'

interface TenderlySimulationProps {
  safeTx?: SafeTransaction
  highlightedSeverity?: Severity
  delay?: number
  /** Safe Pro: the simulation starts on its own for every transaction, so there is no Run button. */
  autoRun?: boolean
}

export const TenderlySimulation = ({
  safeTx,
  highlightedSeverity,
  delay = 0,
  autoRun = false,
}: TenderlySimulationProps): ReactElement | null => {
  const { simulation, status, nestedTx } = useContext(TxInfoContext)
  const chain = useCurrentChain()
  const { safe } = useSafeInfo()
  const safeAddress = useSafeAddress()
  const signer = useSigner()
  const isSafeOwner = useIsSafeOwner()
  const showSimulation = chain && isTxSimulationEnabled(chain) && safeTx

  const [simulationExpanded, setSimulationExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

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

  const { nestedSafeInfo, nestedSafeTx, isNested, isNestedLoading } = useNestedTransaction(safeTx, chain)

  const handleRunSimulation = () => {
    if (!safeTx) return

    const executionOwner = isSafeOwner && signer?.address ? signer.address : safe.owners[0]?.value
    if (!executionOwner) return

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

  // Once per transaction: the reset effect above clears the previous result, this one starts the next run.
  const autoRanKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!autoRun || !showSimulation || !safeTx) return
    // A nested Safe's data arrives later; running before it would skip the nested simulation for good.
    if (isNestedLoading) return
    if (!signer?.address && !safe.owners[0]?.value) return
    const key = JSON.stringify(safeTx.data)
    if (autoRanKeyRef.current === key) return
    autoRanKeyRef.current = key
    handleRunSimulation()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the tx data; the handler reads live values
  }, [autoRun, showSimulation, safeTx, signer?.address, safe.owners, isNestedLoading])

  const { mainIsSuccess, nestedIsSuccess, isSimulationSuccess, isSimulationFinished, isLoading } = getSimulationOutcome(
    status,
    nestedTx,
    isNested,
  )

  const mainSimulationResult = isSimulationFinished
    ? mainIsSuccess
      ? 'Simulation successful.'
      : 'Simulation failed.'
    : undefined

  const nestedSimulationResult =
    isNested && isSimulationFinished
      ? nestedIsSuccess
        ? 'Nested transaction simulation successful.'
        : 'Nested transaction simulation failed.'
      : undefined

  // Track simulation result when it finishes
  useEffect(() => {
    if (mainSimulationResult) {
      const results = [mainSimulationResult]

      if (nestedSimulationResult) {
        results.push(nestedSimulationResult)
      }

      trackEvent(SAFE_SHIELD_EVENTS.SIMULATED, {
        [MixpanelEventParams.RESULT]: results,
      })
    }
  }, [mainSimulationResult, nestedSimulationResult])

  useEffect(() => {
    if (!showSimulation) return

    setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }, [delay, showSimulation])

  if (!showSimulation) {
    return null
  }

  const showExpandable = isNested && isSimulationFinished

  const isHighlihtedSeverityOK = isSimulationSuccess && highlightedSeverity === Severity.OK
  const isHighlihtedSeverityWarn = !isSimulationSuccess && highlightedSeverity === Severity.WARN

  const isMuted = !highlightedSeverity || (!isHighlihtedSeverityOK && !isHighlihtedSeverityWarn)

  return (
    <TenderlySimulationView
      expanded={simulationExpanded}
      onExpandedChange={setSimulationExpanded}
      isVisible={isVisible}
      delay={delay}
      showExpandable={showExpandable}
      isSimulationFinished={isSimulationFinished}
      isSimulationSuccess={isSimulationSuccess}
      resultSeverity={isSimulationSuccess ? Severity.OK : Severity.WARN}
      isMuted={isMuted}
      isNested={isNested}
      isLoading={isLoading}
      isNestedLoading={isNestedLoading}
      autoRun={autoRun}
      onRun={handleRunSimulation}
      mainIsSuccess={mainIsSuccess}
      nestedIsSuccess={nestedIsSuccess}
      simulationLink={simulation.simulationLink}
      nestedSimulationLink={nestedTx.simulation.simulationLink}
    />
  )
}
