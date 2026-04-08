import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import GlobalSearch from './GlobalSearch'
import SearchSection from '../SearchSection/SearchSection'

const GlobalSearchModal = () => {
  const [query, setQuery] = useState('')

  return (
    <Dialog>
      <DialogContent showCloseButton={false} className="h-[480px] p-0">
        <Card className="h-full py-4 gap-2 shadow-none border-0">
          <div className="px-4 shrink-0">
            <GlobalSearch value={query} onChange={setQuery} />
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-0.5">
              <SearchSection />
            </div>
          </ScrollArea>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

export default GlobalSearchModal
