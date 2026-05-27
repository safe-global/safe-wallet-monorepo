import type { ReactElement } from 'react'
import { Box, Skeleton } from '@mui/material'
import { motion } from 'framer-motion'
import type { ScanContext, ScanResult } from '@/features/security/types'
import PanelHeader from './PanelHeader'
import SecurityChecksSection from './SecurityChecksSection'

type SecurityPanelViewProps = {
  scanContext: ScanContext | null
  results: Record<string, ScanResult>
  isComplete: boolean
  /** The `shortName:address` param used to deep-link a CTA to the correct Safe (e.g., "eth:0x..."). */
  safeQueryParam?: string
}

const MotionBox = motion.create(Box)

/**
 * Top-level layout for the per-Safe security panel. Composes the three
 * sub-sections (header / security checks / signers). All derivation lives in
 * the per-section hooks under `./hooks/`; this component only wires them up
 * and handles the global skeleton state.
 */
const SecurityPanelView = ({
  scanContext,
  results,
  isComplete,
  safeQueryParam,
}: SecurityPanelViewProps): ReactElement => {
  const hasResults = Object.keys(results).length > 0

  if (!scanContext || (!hasResults && !isComplete)) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: '12px', mb: 3 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '12px', mb: 3 }} />
        <Skeleton variant="rectangular" height={150} sx={{ borderRadius: '12px' }} />
      </Box>
    )
  }

  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <PanelHeader results={results} isComplete={isComplete} />
      </MotionBox>
      <SecurityChecksSection scanContext={scanContext} results={results} safeQueryParam={safeQueryParam} />
    </Box>
  )
}

export default SecurityPanelView
