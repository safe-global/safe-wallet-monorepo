import type { KeyboardEvent, ReactNode, RefObject } from 'react'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import GlobalSearch from './GlobalSearch'

export type GlobalSearchModalViewProps = {
  query: string
  onQueryChange: (query: string) => void
  onClose: () => void
  onKeyDown: (e: KeyboardEvent) => void
  scrollRef: RefObject<HTMLDivElement | null>
  searchSection: ReactNode
}

export const GlobalSearchModalView = ({
  query,
  onQueryChange,
  onClose,
  onKeyDown,
  scrollRef,
  searchSection,
}: GlobalSearchModalViewProps) => {
  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent showCloseButton={false} padding="none" className="max-h-[480px]">
        <Card size="sm" className="max-h-[480px]" onKeyDown={onKeyDown}>
          <div className="px-4 shrink-0">
            <GlobalSearch value={query} onChange={onQueryChange} />
          </div>
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            {searchSection}
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
