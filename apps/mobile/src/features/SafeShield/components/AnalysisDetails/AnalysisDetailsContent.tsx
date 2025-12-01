import React from 'react'
import { Stack, styled, View } from 'tamagui'
import { AnalysisGroup } from '../AnalysisGroup'
import { ContractAnalysisResults, Severity } from '@safe-global/utils/features/safe-shield/types'
import { RecipientAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import { getOverallStatus, normalizeThreatData } from '@safe-global/utils/features/safe-shield/utils'
import { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { TransactionSimulation } from '../TransactionSimulation'
import { isEmpty } from 'lodash'

interface AnalysisDetailsContentProps {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
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

export const AnalysisDetailsContent = ({ recipient, contract, threat }: AnalysisDetailsContentProps) => {
  const [recipientData] = recipient || []
  const [contractData] = contract || []
  const [threatData] = threat || []

  const normalizedThreatData = normalizeThreatData(threat)
  const overallStatus = getOverallStatus(recipientData, contractData, threatData)

  const isEmptyRecipient = isEmpty(recipientData)
  const isEmptyContract = isEmpty(contractData)
  const isEmptyThreat = isEmpty(normalizedThreatData)

  return (
    <View>
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
          <AnalysisGroupWrapper bordered>
            <AnalysisGroup highlightedSeverity={overallStatus?.severity} data={normalizedThreatData} />
          </AnalysisGroupWrapper>
        )}

        <AnalysisGroupWrapper>
          <TransactionSimulation highlighted={false} severity={Severity.OK} />
        </AnalysisGroupWrapper>
      </Stack>
    </View>
  )
}
