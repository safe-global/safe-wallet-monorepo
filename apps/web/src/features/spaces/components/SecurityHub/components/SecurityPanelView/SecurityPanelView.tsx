import type { ReactElement } from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import type { ScanContext, ScanResult } from '@/features/security/types'
import PanelHeader from './PanelHeader'
import SecurityChecksSection from './SecurityChecksSection'

type SecurityPanelViewProps = {
  scanContext: ScanContext | null
  results: Record<string, ScanResult>
  isComplete: boolean
  /** The `shortName:address` param used to deep-link a CTA to the correct Safe (e.g., "eth:0x..."). */
  safeQueryParam?: string
  onRemoveModule?: (address: string) => void
}

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
  onRemoveModule,
}: SecurityPanelViewProps): ReactElement => {
  const hasResults = Object.keys(results).length > 0

  if (!scanContext || (!hasResults && !isComplete)) {
    return (
      <div>
        <Skeleton className="mb-6 h-[120px] rounded-xl" />
        <Skeleton className="mb-6 h-[200px] rounded-xl" />
        <Skeleton className="h-[150px] rounded-xl" />
      </div>
    )
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <PanelHeader results={results} isComplete={isComplete} />
      </motion.div>
      <SecurityChecksSection
        scanContext={scanContext}
        results={results}
        safeQueryParam={safeQueryParam}
        onRemoveModule={onRemoveModule}
      />
    </div>
  )
}

export default SecurityPanelView
