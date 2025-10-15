import { type ReactElement } from 'react'
import { Box } from '@mui/material'
import type { ContractAnalysisResults, RecipientAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import { SafeShieldAnalysisLoading } from './SafeShieldAnalysisLoading'
import { SafeShieldAnalysisError } from './SafeShieldAnalysisError'
import { SafeShieldAnalysisEmpty } from './SafeShieldAnalysisEmpty'
import { AnalysisGroupCard } from '../AnalysisGroupCard'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import isEmpty from 'lodash/isEmpty'

export const SafeShieldContent = ({
  recipient,
  contract,
}: {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
}): ReactElement => {
  const [recipientResults, recipientError, recipientLoading = false] = recipient || []
  const [contractResults, contractError, contractLoading = false] = contract || []

  const loading = recipientLoading || contractLoading
  const error = recipientError || contractError
  const empty = isEmpty(recipientResults) && isEmpty(contractResults)

  return (
    <Box padding="0px 4px 4px">
      <Box
        sx={{ border: '1px solid', borderColor: 'background.main', borderTop: 'none', borderRadius: '0px 0px 6px 6px' }}
      >
        {loading ? (
          <SafeShieldAnalysisLoading />
        ) : error ? (
          <SafeShieldAnalysisError error={error} />
        ) : empty ? (
          <SafeShieldAnalysisEmpty />
        ) : null}

        <Box display={loading ? 'none' : 'block'}>
          {recipientResults && Object.keys(recipientResults).length > 0 && (
            <AnalysisGroupCard data={recipientResults} />
          )}

          {contractResults && Object.keys(contractResults).length > 0 && <AnalysisGroupCard data={contractResults} />}
        </Box>
      </Box>
    </Box>
  )
}
