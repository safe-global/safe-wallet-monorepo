import { SearchInput } from '@/components/ui/search-input'

interface SafeSearchProps {
  value: string
  onChange: (value: string) => void
}

const SafeSearch = ({ value, onChange }: SafeSearchProps) => {
  return (
    <SearchInput
      placeholder="Search for safes"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search for safes"
    />
  )
}

export default SafeSearch
