import { type ReactElement } from 'react'
import { Box } from '@mui/material'
import type { LiveAnalysisResponse } from '../../types'
import { SafeShieldAnalysisLoading } from './SafeShieldAnalysisLoading'
import { SafeShieldAnalysisError } from './SafeShieldAnalysisError'
import { SafeShieldAnalysisEmpty } from './SafeShieldAnalysisEmpty'
import { AnalysisGroupCard } from '../AnalysisGroupCard'

export const SafeShieldContent = ({
  analysisData,
  error,
  loading,
}: {
  analysisData?: LiveAnalysisResponse | null
  error?: Error | null
  loading?: boolean
}): ReactElement => (
  <Box padding="0px 4px 4px">
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'background.main',
        borderTop: 'none',
        borderRadius: '0px 0px 6px 6px',
      }}
    >
      {loading ? (
        <SafeShieldAnalysisLoading />
      ) : error ? (
        <SafeShieldAnalysisError error={error} />
      ) : analysisData ? (
        <>
          {analysisData.contract && Object.keys(analysisData.contract).length > 0 && (
            <AnalysisGroupCard data={analysisData.contract} />
          )}
        </>
      ) : (
        <SafeShieldAnalysisEmpty />
      )}
    </Box>
  </Box>
)
