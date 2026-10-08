import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import type { ScanContext, ScanResult } from '@/features/security/types'
import { useSecurityScan } from '@/features/security'
import { useChain } from '@/hooks/useChains'
import Identicon from '@/components/common/Identicon'
import { HnSignupFlow } from '@/features/hypernative'
import SecurityDrawerContent from './SecurityDrawerContent'
import type { SelectedSafe, SpaceSafeEntry } from '@views/features/spaces/components/SecurityHub/types'
import { SecurityReportDrawerView } from '@views/features/spaces/components/SecurityHub/components/SecurityReportDrawer/SecurityReportDrawerView'

type SecurityReportDrawerProps = {
  selectedSafe: SelectedSafe | null
  selectedEntry: SpaceSafeEntry | undefined
  scanContext: ScanContext | null
  onClose: () => void
  onScanComplete: (address: string, chainId: string, timestamp: number, results: Record<string, ScanResult>) => void
}

const SecurityReportDrawer = ({
  selectedSafe,
  selectedEntry,
  scanContext,
  onClose,
  onScanComplete,
}: SecurityReportDrawerProps): ReactElement => {
  const { results, isComplete, lastScannedAt } = useSecurityScan(scanContext)
  const chain = useChain(selectedSafe?.chainId ?? '')
  const [isHnSignupOpen, setIsHnSignupOpen] = useState(false)
  const scanContextRef = useRef(scanContext)
  scanContextRef.current = scanContext

  // Close the drawer before opening the Hypernative signup flow so the MUI dialog owns focus
  // and isn't dimmed behind the sheet's overlay — mirroring the remove-module action below.
  const handleHnSignupClick = useCallback(() => {
    onClose()
    setIsHnSignupOpen(true)
  }, [onClose])

  // Forward scan completion to parent
  useEffect(() => {
    if (isComplete && lastScannedAt && onScanComplete && scanContextRef.current) {
      onScanComplete(scanContextRef.current.safeAddress, scanContextRef.current.chainId, lastScannedAt, results)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, lastScannedAt])

  return (
    <>
      <SecurityReportDrawerView
        selectedSafe={selectedSafe}
        selectedEntry={selectedEntry}
        onClose={onClose}
        identicon={selectedSafe && <Identicon address={selectedSafe.address} size={28} />}
        content={
          selectedSafe && (
            <SecurityDrawerContent
              scanContext={scanContext}
              results={results}
              isComplete={isComplete}
              lastScannedAt={lastScannedAt}
              safeQueryParam={chain?.shortName ? `${chain.shortName}:${selectedSafe.address}` : undefined}
              onHnSignupClick={handleHnSignupClick}
            />
          )
        }
      />

      <HnSignupFlow open={isHnSignupOpen} onClose={() => setIsHnSignupOpen(false)} />
    </>
  )
}

export default SecurityReportDrawer
