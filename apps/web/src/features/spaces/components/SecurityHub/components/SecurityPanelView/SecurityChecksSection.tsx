import { type ReactElement, useState } from 'react'
import { Box, Collapse, Divider, Typography } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded'
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import type { ScanContext, ScanResult } from '@/features/security/types'
import SectionPanel from './SectionPanel'
import { useSecurityChecks } from './hooks/useSecurityChecks'

export type SecurityChecksSectionProps = {
  scanContext: ScanContext
  results: Record<string, ScanResult>
  safeQueryParam?: string
}

const SecurityChecksSection = ({
  scanContext,
  results,
  safeQueryParam,
}: SecurityChecksSectionProps): ReactElement | null => {
  const { isReady, failingRows, passingRows } = useSecurityChecks(scanContext, results, safeQueryParam)
  const [passingExpanded, setPassingExpanded] = useState(false)

  // Feature not yet loaded — render nothing; the panel skeleton covers this state.
  if (!isReady) return null

  const footer =
    passingRows.length > 0 ? (
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
            {`${passingRows.length} check${maybePlural(passingRows)} passing`}
          </Typography>
          {/* UnfoldMore/Less signals a *group* expansion, distinct from the single-row chevron. */}
          {passingExpanded ? (
            <UnfoldLessRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
          ) : (
            <UnfoldMoreRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
          )}
        </Box>
        <Collapse in={passingExpanded}>
          {passingRows.map((r) => (
            <Box key={r.key}>
              <Divider />
              {r.node}
            </Box>
          ))}
        </Collapse>
      </>
    ) : undefined

  return <SectionPanel title="Security checks" rows={failingRows} footer={footer} baseDelay={0.08} />
}

export default SecurityChecksSection
