import { type ReactElement, useState } from 'react'
import { Box, Collapse, Typography } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
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
        <Box
          onClick={() => setPassingExpanded((v) => !v)}
          sx={{
            px: 1.5,
            py: 1.25,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            transition: 'background-color 0.12s',
            '&:hover': { backgroundColor: 'var(--muted)' },
            ...(passingExpanded && { backgroundColor: 'var(--muted)' }),
          }}
        >
          <CheckCircleRoundedIcon sx={{ color: 'success.main', fontSize: 18 }} />
          <Typography variant="body2" fontWeight={500} sx={{ flex: 1, fontSize: '0.8125rem' }}>
            {`${passingRows.length} check${maybePlural(passingRows)} passing`}
          </Typography>
          <KeyboardArrowDownRoundedIcon
            sx={{
              color: 'text.secondary',
              fontSize: 16,
              opacity: 0.7,
              transform: passingExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </Box>
        <Collapse in={passingExpanded}>
          {passingRows.map((r) => (
            <Box key={r.key} sx={{ borderTop: '1px solid var(--color-border-light)' }}>
              {r.node}
            </Box>
          ))}
        </Collapse>
      </>
    ) : undefined

  return <SectionPanel title="Security checks" rows={failingRows} footer={footer} baseDelay={0.08} />
}

export default SecurityChecksSection
