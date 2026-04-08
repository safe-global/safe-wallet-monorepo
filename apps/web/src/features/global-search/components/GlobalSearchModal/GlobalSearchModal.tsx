import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import GlobalSearch from './GlobalSearch'
import SearchSection from '../SearchSection/SearchSection'

const GlobalSearchModal = () => {
  const [query, setQuery] = useState('')

  return (
    <Card className="w-[500px] max-h-[680px] py-4 gap-2 shadow-lg">
      <div className="px-4">
        <GlobalSearch value={query} onChange={setQuery} />
      </div>
      <ScrollArea className="flex-1 overflow-auto">
        <div className="flex flex-col gap-0.5">
          <SearchSection />
        </div>
      </ScrollArea>
    </Card>
  )
}

export default GlobalSearchModal
