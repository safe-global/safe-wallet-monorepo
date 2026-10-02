import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import type { ScanContext, ScanResult } from '@/features/security/types'
import { useSecurityScan } from '@/features/security'
import { useChain } from '@/hooks/useChains'
import { Drawer, DrawerBody, DrawerHeader, DrawerSubtitle, DrawerTitle } from '@/components/common/Drawer'
import Identicon from '@/components/common/Identicon'
import CopyButton from '@/components/common/CopyButton'
import { Typography } from '@/components/ui/typography'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { HnSignupFlow } from '@/features/hypernative'
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
      <Drawer
        // Keep the Drawer mounted while closed so the sheet can play its slide-out animation
        open={!!selectedSafe}
        onClose={onClose}
        ariaLabel="Security report"
      >
        {selectedSafe && (
          <>
            <DrawerHeader>
              <Identicon address={selectedSafe.address} size={28} />
              <div className="min-w-0">
                <DrawerTitle>
                  <span title={selectedEntry?.name || selectedSafe.address}>
                    {selectedEntry?.name || shortenAddress(selectedSafe.address)}
                  </span>
                </DrawerTitle>
                <DrawerSubtitle>
                  <Typography variant="paragraph-mini" className="text-[10px] text-muted-foreground">
                    {shortenAddress(selectedSafe.address)}
                  </Typography>
                  <CopyButton text={selectedSafe.address} className="!p-0.5 text-muted-foreground [&_svg]:!size-3" />
                </DrawerSubtitle>
              </div>
            </DrawerHeader>

            <DrawerBody>
              <SecurityDrawerContent
                scanContext={scanContext}
                results={results}
                isComplete={isComplete}
                lastScannedAt={lastScannedAt}
                safeQueryParam={chain?.shortName ? `${chain.shortName}:${selectedSafe.address}` : undefined}
                onHnSignupClick={handleHnSignupClick}
              />
            </DrawerBody>
          </>
        )}
      </Drawer>

      <HnSignupFlow open={isHnSignupOpen} onClose={() => setIsHnSignupOpen(false)} />
    </>
  )
}

export default SecurityReportDrawer
