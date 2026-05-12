import { type ReactElement, useState } from 'react'
import { Box, Collapse, Divider, Typography } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded'
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded'
import type { ScanContext, ScanResult } from '@/features/security/types'
import SectionPanel from './SectionPanel'
import { useSignerRows } from './hooks/useSignerRows'

export type SignersSectionProps = {
  scanContext: ScanContext
  results: Record<string, ScanResult>
  safeQueryParam?: string
}

const SignersSection = ({ scanContext, results, safeQueryParam }: SignersSectionProps): ReactElement | null => {
  const { isReady, failingRows, passingSigners, passingMultichainRow } = useSignerRows(
    scanContext,
    results,
    safeQueryParam,
  )
  const [passingExpanded, setPassingExpanded] = useState(false)

  if (!isReady) return null

  const hasPassingContent = passingSigners.length > 0 || passingMultichainRow !== null

  const footer = hasPassingContent ? (
    <>
      {passingSigners.length > 0 && (
        <>
          {failingRows.length > 0 && <Divider />}
          <Box
            onClick={() => setPassingExpanded((v) => !v)}
            sx={{
              px: 2,
              py: 1.25,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              '&:hover': { backgroundColor: 'action.hover' },
            }}
          >
            <CheckCircleRoundedIcon sx={{ color: 'success.main', fontSize: 18 }} />
            <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
              {passingSigners.length}{' '}
              {passingSigners.length === 1 ? 'signer not blocklisted' : 'signers not blocklisted'}
            </Typography>
            {passingExpanded ? (
              <UnfoldLessRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
            ) : (
              <UnfoldMoreRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
            )}
          </Box>
          <Collapse in={passingExpanded}>
            {passingSigners.map((r) => (
              <Box key={r.key}>
                <Divider />
                {r.node}
              </Box>
            ))}
          </Collapse>
        </>
      )}
      {passingMultichainRow && (
        <>
          {(failingRows.length > 0 || passingSigners.length > 0) && <Divider />}
          {passingMultichainRow.node}
        </>
      )}
    </>
  ) : undefined

  return <SectionPanel title="Your signers" rows={failingRows} footer={footer} baseDelay={0.16} />
}

export default SignersSection
