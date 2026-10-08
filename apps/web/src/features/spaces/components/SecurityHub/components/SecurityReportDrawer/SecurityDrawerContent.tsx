import type { ReactElement } from 'react'
import type { ScanContext, ScanResult } from '@/features/security/types'
import SecurityDrawerChecks from './tabs/SecurityDrawerChecks'
import SecurityDrawerDetails from './tabs/SecurityDrawerDetails'
import { SecurityDrawerContentView } from '@views/features/spaces/components/SecurityHub/components/SecurityReportDrawer/SecurityDrawerContentView'

type SecurityDrawerContentProps = {
  scanContext: ScanContext | null
  results: Record<string, ScanResult>
  isComplete: boolean
  lastScannedAt: number | null
  safeQueryParam?: string
  onHnSignupClick?: () => void
}

const SecurityDrawerContent = ({
  scanContext,
  results,
  isComplete,
  lastScannedAt,
  safeQueryParam,
  onHnSignupClick,
}: SecurityDrawerContentProps): ReactElement => (
  <SecurityDrawerContentView
    checks={
      <SecurityDrawerChecks
        scanContext={scanContext}
        results={results}
        isComplete={isComplete}
        lastScannedAt={lastScannedAt}
        safeQueryParam={safeQueryParam}
        onHnSignupClick={onHnSignupClick}
      />
    }
    details={<SecurityDrawerDetails scanContext={scanContext} lastScannedAt={lastScannedAt} />}
  />
)

export default SecurityDrawerContent
