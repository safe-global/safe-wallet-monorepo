import type { ReactElement, ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SCROLL_AREA } from '@/utils/styles'

export type SecurityDrawerContentViewProps = {
  checks: ReactNode
  details: ReactNode
}

/** Tabbed body of the drawer — "Checks" (scan results) and "Details" (placeholder). */
export const SecurityDrawerContentView = ({ checks, details }: SecurityDrawerContentViewProps): ReactElement => (
  <Tabs defaultValue="checks" className="flex min-h-0 flex-1 flex-col gap-4">
    {/* eslint-disable-next-line no-restricted-syntax -- gap-2 spaces this 2-tab drawer switch; no TabsList variant provides this gap */}
    <TabsList className="w-fit gap-2">
      <TabsTrigger value="checks">Checks</TabsTrigger>
      <TabsTrigger value="details">Details</TabsTrigger>
    </TabsList>

    <div className={SCROLL_AREA}>
      <TabsContent value="checks">{checks}</TabsContent>

      <TabsContent value="details">{details}</TabsContent>
    </div>
  </Tabs>
)
