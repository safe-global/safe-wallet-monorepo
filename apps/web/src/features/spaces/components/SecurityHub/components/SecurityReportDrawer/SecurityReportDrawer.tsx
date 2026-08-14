import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import type { ScanContext, ScanResult } from '@/features/security/types'
import { useSecurityScan } from '@/features/security'
import { useChain } from '@/hooks/useChains'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { HnSignupFlow } from '@/features/hypernative'
import SecurityDrawerHeader from './SecurityDrawerHeader'
import SecurityDrawerContent from './SecurityDrawerContent'
import type { SelectedSafe, SpaceSafeEntry } from '../../types'

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
      <Sheet
        open={!!selectedSafe}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          aria-label="Security report"
          // Float the sheet with a margin from the viewport, round its corners and use a #fafafa
          // surface in light mode / `bg-card` in dark mode so the white cards inside stand out.
          className="inset-y-3! right-3! h-auto! w-[440px]! max-w-[calc(100vw-24px)]! gap-0 overflow-hidden rounded-3xl border-0! bg-zinc-50 p-0 shadow-xl dark:bg-card"
        >
          {selectedSafe && (
            <div className="flex min-h-0 gap-3 flex-1 flex-col overflow-hidden">
              <SecurityDrawerHeader address={selectedSafe.address} name={selectedEntry?.name} onClose={onClose} />

              <SecurityDrawerContent
                scanContext={scanContext}
                results={results}
                isComplete={isComplete}
                lastScannedAt={lastScannedAt}
                safeQueryParam={chain?.shortName ? `${chain.shortName}:${selectedSafe.address}` : undefined}
                onHnSignupClick={handleHnSignupClick}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <HnSignupFlow open={isHnSignupOpen} onClose={() => setIsHnSignupOpen(false)} />
    </>
  )
}

export default SecurityReportDrawer
