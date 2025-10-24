import { type ReactElement } from 'react'
import { Box } from '@mui/material'
import type {
  AddressAnalysisResults,
  ContractAnalysisResults,
  LiveThreatAnalysisResult,
  RecipientAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import { SafeShieldAnalysisLoading } from './SafeShieldAnalysisLoading'
import { SafeShieldAnalysisEmpty } from './SafeShieldAnalysisEmpty'
import { AnalysisGroupCard } from '../AnalysisGroupCard'
import { TenderlySimulation } from '../TenderlySimulation'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import isEmpty from 'lodash/isEmpty'
import type { SafeTransaction } from '@safe-global/types-kit'

const normalizeThreatData = (
  threat?: AsyncResult<LiveThreatAnalysisResult>,
): Record<string, AddressAnalysisResults> => {
  if (threat === undefined) return {}

  return { ['0x']: { THREAT: threat[0]?.THREAT } }
}

export const SafeShieldContent = ({
  recipient,
  contract,
  threat,
  safeTx,
}: {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<LiveThreatAnalysisResult>
  safeTx?: SafeTransaction
}): ReactElement => {
  const [recipientResults = {}, recipientError, recipientLoading = false] = recipient || []
  const [contractResults = {}, contractError, contractLoading = false] = contract || []
  const [threatResults, threatError, threatLoading = false] = threat || []
  const normalizedThreatData = normalizeThreatData(threat)

  const loading = recipientLoading || contractLoading || threatLoading
  const error = recipientError || contractError || threatError

  const recipientEmpty = isEmpty(recipientResults)
  const contractEmpty = isEmpty(contractResults)
  const threatEmpty = isEmpty(threatResults) || isEmpty(threatResults.THREAT)
  const allEmpty = recipientEmpty && contractEmpty && threatEmpty && !safeTx

  return (
    <Box padding="0px 4px 4px">
      <Box
        sx={{ border: '1px solid', borderColor: 'background.main', borderTop: 'none', borderRadius: '0px 0px 6px 6px' }}
      >
        {loading ? <SafeShieldAnalysisLoading /> : allEmpty ? <SafeShieldAnalysisEmpty /> : null}

        <Box display={loading || error ? 'none' : 'block'}>
          {recipientResults && <AnalysisGroupCard data={recipientResults} />}

          {contractResults && <AnalysisGroupCard data={contractResults} />}

          {normalizedThreatData && <AnalysisGroupCard data={normalizedThreatData} />}

          <TenderlySimulation safeTx={safeTx} />
        </Box>
      </Box>
    </Box>
  )
}
