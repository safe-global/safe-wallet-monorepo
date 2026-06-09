import type { ReactElement } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ScanContext, ScanResult } from '@/features/security/types'
import SecurityDrawerChecks from './tabs/SecurityDrawerChecks'
import SecurityDrawerDetails from './tabs/SecurityDrawerDetails'

type SecurityDrawerContentProps = {
  scanContext: ScanContext | null
  results: Record<string, ScanResult>
  isComplete: boolean
  lastScannedAt: number | null
  safeQueryParam?: string
  onRemoveModule?: (address: string) => void
}

/** Tabbed body of the drawer — "Checks" (scan results) and "Details" (placeholder). */
const SecurityDrawerContent = ({
  scanContext,
  results,
  isComplete,
  lastScannedAt,
  safeQueryParam,
  onRemoveModule,
}: SecurityDrawerContentProps): ReactElement => (
  <Tabs defaultValue="checks" className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6">
    <TabsList className="w-fit gap-2">
      <TabsTrigger value="checks" className="cursor-pointer px-4">
        Checks
      </TabsTrigger>
      <TabsTrigger value="details" className="cursor-pointer px-4">
        Details
      </TabsTrigger>
    </TabsList>

    <div className="min-h-0 flex-1 overflow-y-auto">
      <TabsContent value="checks">
        <SecurityDrawerChecks
          scanContext={scanContext}
          results={results}
          isComplete={isComplete}
          lastScannedAt={lastScannedAt}
          safeQueryParam={safeQueryParam}
          onRemoveModule={onRemoveModule}
        />
      </TabsContent>

      <TabsContent value="details">
        <SecurityDrawerDetails scanContext={scanContext} lastScannedAt={lastScannedAt} />
      </TabsContent>
    </div>
  </Tabs>
)

export default SecurityDrawerContent
