import { type ReactElement } from 'react'
import { Box } from '@mui/material'
import type {
  GroupedAnalysisResults,
  ContractAnalysisResults,
  ThreatAnalysisResults,
  RecipientAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import { SafeShieldAnalysisLoading } from './SafeShieldAnalysisLoading'
import { SafeShieldAnalysisEmpty } from './SafeShieldAnalysisEmpty'
import { AnalysisGroupCard } from '../AnalysisGroupCard'
import { TenderlySimulation } from '../TenderlySimulation'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import isEmpty from 'lodash/isEmpty'
import type { SafeTransaction } from '@safe-global/types-kit'
import { useHighlightedSeverity } from '@safe-global/utils/features/safe-shield/hooks/useHighlightedSeverity'

const normalizeThreatData = (threat?: AsyncResult<ThreatAnalysisResults>): Record<string, GroupedAnalysisResults> => {
  const [result] = threat || []

  const { BALANCE_CHANGE: _, ...groupedThreatResults } = result || {}

  if (Object.keys(groupedThreatResults).length === 0) return {}

  return { ['0x']: groupedThreatResults }
}

const contractDelay = 200
const threatDelay = 400
const simulationDelay = 600

export const SafeShieldContent = ({
  recipient,
  contract,
  threat,
  safeTx,
}: {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  safeTx?: SafeTransaction
}): ReactElement => {
  const [recipientResults = {}, _recipientError, recipientLoading = false] = recipient || []
  const [contractResults = {}, _contractError, contractLoading = false] = contract || []
  const [threatResults, _threatError, threatLoading = false] = threat || []
  const normalizedThreatData = normalizeThreatData(threat)
  const highlightedSeverity = useHighlightedSeverity(recipientResults, contractResults, normalizedThreatData)
  const loading = recipientLoading || contractLoading || threatLoading

  const recipientEmpty = isEmpty(recipientResults)
  const contractEmpty = isEmpty(contractResults)
  const threatEmpty = isEmpty(threatResults) || isEmpty(threatResults.THREAT)
  const analysesEmpty = recipientEmpty && contractEmpty && threatEmpty
  const allEmpty = recipientEmpty && contractEmpty && threatEmpty && !safeTx

  return (
    <Box padding="0px 4px 4px">
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'background.main',
          borderTop: 'none',
          borderRadius: '0px 0px 6px 6px',
          position: 'relative',
        }}
      >
        {loading && <SafeShieldAnalysisLoading analysesEmpty={analysesEmpty} loading={loading} />}

        {!loading && allEmpty && <SafeShieldAnalysisEmpty />}

        <Box sx={{ '& > div:not(:last-child)': { borderBottom: '1px solid', borderColor: 'background.main' } }}>
          {recipientResults && <AnalysisGroupCard data={recipientResults} highlightedSeverity={highlightedSeverity} />}

          {contractResults && (
            <AnalysisGroupCard data={contractResults} delay={contractDelay} highlightedSeverity={highlightedSeverity} />
          )}

          {normalizedThreatData && (
            <AnalysisGroupCard
              data={normalizedThreatData}
              delay={contractEmpty ? contractDelay : threatDelay}
              highlightedSeverity={highlightedSeverity}
            />
          )}

          {!contractLoading && !threatLoading && (
            <TenderlySimulation
              safeTx={safeTx}
              delay={contractEmpty ? threatDelay : simulationDelay}
              highlightedSeverity={highlightedSeverity}
            />
          )}
        </Box>
      </Box>
    </Box>
  )
}
