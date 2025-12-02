import React, { useMemo } from 'react'
import { Stack, styled, View } from 'tamagui'
import { AnalysisGroup } from '../AnalysisGroup'
import { ContractAnalysisResults, Severity } from '@safe-global/utils/features/safe-shield/types'
import { RecipientAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import { getOverallStatus, normalizeThreatData } from '@safe-global/utils/features/safe-shield/utils'
import { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { TransactionSimulation } from '../TransactionSimulation'
import { useTransactionSimulation } from '../TransactionSimulation/hooks/useTransactionSimulation'
import { isEmpty } from 'lodash'
import type { SafeTransaction } from '@safe-global/types-kit'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'
import { isTxSimulationEnabled } from '@safe-global/utils/components/tx/security/tenderly/utils'
import { ToastViewport } from '@tamagui/toast'

interface AnalysisDetailsContentProps {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  safeTx?: SafeTransaction
}

const AnalysisGroupWrapper = styled(View, {
  padding: '$4',
  variants: {
    bordered: {
      true: {
        borderBottomWidth: 1,
        borderColor: '$backgroundPaper',
      },
    },
  },
})

export const AnalysisDetailsContent = ({ recipient, contract, threat, safeTx }: AnalysisDetailsContentProps) => {
  const [recipientData] = recipient || []
  const [contractData] = contract || []
  const [threatData] = threat || []

  // Transaction simulation logic
  const {
    hasError,
    isCallTraceError,
    isSuccess,
    simulationStatus,
    simulationLink,
    requestError,
    canSimulate,
    runSimulation,
  } = useTransactionSimulation(safeTx)

  const chain = useAppSelector(selectActiveChain)

  const tenderlyEnabled = isTxSimulationEnabled(chain ?? undefined) ?? false

  const simulationSeverityStatus = useMemo(() => {
    if (isSuccess) {
      return Severity.OK
    }
    if (simulationStatus.isFinished || hasError || isCallTraceError) {
      return Severity.WARN
    }
  }, [hasError, isCallTraceError, isSuccess, simulationStatus.isFinished])

  const normalizedThreatData = normalizeThreatData(threat)
  const overallStatus = getOverallStatus(
    recipientData,
    contractData,
    threatData,
    simulationSeverityStatus === Severity.WARN,
  )

  const isEmptyRecipient = isEmpty(recipientData)
  const isEmptyContract = isEmpty(contractData)
  const isEmptyThreat = isEmpty(normalizedThreatData)

  return (
    <View>
      <ToastViewport multipleToasts={false} left={0} right={0} />

      <Stack
        borderWidth={1}
        borderColor="$backgroundPaper"
        borderBottomLeftRadius="$3"
        borderBottomRightRadius="$3"
        borderTopWidth={0}
      >
        {!isEmptyRecipient && recipientData && (
          <AnalysisGroupWrapper bordered>
            <AnalysisGroup highlightedSeverity={overallStatus?.severity} data={recipientData} />
          </AnalysisGroupWrapper>
        )}
        {!isEmptyContract && contractData && (
          <AnalysisGroupWrapper bordered>
            <AnalysisGroup highlightedSeverity={overallStatus?.severity} data={contractData} />
          </AnalysisGroupWrapper>
        )}
        {!isEmptyThreat && normalizedThreatData && (
          <AnalysisGroupWrapper bordered={tenderlyEnabled}>
            <AnalysisGroup highlightedSeverity={overallStatus?.severity} data={normalizedThreatData} />
          </AnalysisGroupWrapper>
        )}

        {tenderlyEnabled && (
          <AnalysisGroupWrapper>
            <TransactionSimulation
              severity={simulationSeverityStatus}
              highlighted={simulationSeverityStatus === overallStatus?.severity}
              simulationStatus={simulationStatus}
              simulationLink={simulationLink}
              requestError={requestError}
              canSimulate={canSimulate}
              onRunSimulation={runSimulation}
            />
          </AnalysisGroupWrapper>
        )}
      </Stack>
    </View>
  )
}
