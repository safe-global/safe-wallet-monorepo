import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAppDispatch, useAppSelector } from '@/store'
import { closeGlobalSearch, selectGlobalSearchOpen } from '@/features/global-search/store'
import GlobalSearch from './GlobalSearch'
import SearchSection from '../SearchSection/SearchSection'

const GlobalSearchModal = () => {
  const [query, setQuery] = useState('')
  const open = useAppSelector(selectGlobalSearchOpen)
  const dispatch = useAppDispatch()

  const handleClose = () => {
    dispatch(closeGlobalSearch())
    setQuery('')
  }

  if (!open) return null

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent showCloseButton={false} className="max-h-[480px] p-0">
        <Card className="flex flex-col max-h-[480px] py-4 gap-2 shadow-none border-0">
          <div className="px-4 shrink-0">
            <GlobalSearch value={query} onChange={setQuery} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SearchSection query={query} />
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

export default GlobalSearchModal
