import type { ReactNode } from 'react'
import { SearchInput } from '@/components/ui/search-input'

export type AccountListFiltersViewProps = {
  onSearch: (value: string) => void
  orderByButton: ReactNode
}

export const AccountListFiltersView = ({ onSearch, orderByButton }: AccountListFiltersViewProps) => {
  return (
    <div className="px-4 py-2">
      <div className="flex w-full items-center justify-between gap-2">
        <SearchInput
          inputSize="sm"
          className="w-full"
          id="search-by-name"
          placeholder="Search by name, ENS, address, or chain"
          aria-label="Search Safe list by name"
          onChange={(e) => {
            onSearch(e.target.value)
          }}
        />
        {orderByButton}
      </div>
    </div>
  )
}
