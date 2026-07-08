import { type ReactElement, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ScanContext, ScanResult } from '@/features/security/types'
import { useSecurityScan } from '@/features/security'
import { useChain } from '@/hooks/useChains'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { TxModalContext } from '@/components/tx-flow'
import { RemoveModuleFlow } from '@/components/tx-flow/flows'
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
  const { setTxFlow } = useContext(TxModalContext)
  const [isHnSignupOpen, setIsHnSignupOpen] = useState(false)
  const scanContextRef = useRef(scanContext)
  scanContextRef.current = scanContext

  // Close the drawer before opening the Hypernative signup flow so the MUI dialog owns focus
  // and isn't dimmed behind the sheet's overlay — mirroring the remove-module action below.
  const handleHnSignupClick = useCallback(() => {
    onClose()
    setIsHnSignupOpen(true)
  }, [onClose])

  // Close the report drawer before launching the remove-module tx flow so the tx modal
  // isn't fighting the sheet for focus, mirroring the Settings → Modules remove action.
  const handleRemoveModule = useCallback(
    (address: string) => {
      onClose()
      setTxFlow(<RemoveModuleFlow address={address} />)
    },
    [onClose, setTxFlow],
  )

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
          className="inset-y-3! right-3! h-auto! w-[440px]! max-w-[calc(100vw-24px)]! gap-0 overflow-hidden rounded-3xl border-0! bg-card p-0 shadow-xl"
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
                onRemoveModule={handleRemoveModule}
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
