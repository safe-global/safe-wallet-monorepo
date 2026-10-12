import SearchField from '@safe-global/design/components/common/SearchField'

interface GlobalSearchProps {
  value: string
  onChange: (value: string) => void
}

const GlobalSearch = ({ value, onChange }: GlobalSearchProps) => {
  return (
    <SearchField
      placeholder="Search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search"
      autoFocus
    />
  )
}

export default GlobalSearch
