import { SearchInput } from '@/components/ui/search-input'

export type AccountsSearchViewProps = {
  onSearch: (value: string) => void
}

export const AccountsSearchView = ({ onSearch }: AccountsSearchViewProps) => {
  return (
    <div className="w-full">
      <SearchInput
        variant="surface"
        className="shadow-xs"
        id="search-by-name"
        placeholder="by name, address or network"
        aria-label="Search Safe accounts by name, address or network"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  )
}
