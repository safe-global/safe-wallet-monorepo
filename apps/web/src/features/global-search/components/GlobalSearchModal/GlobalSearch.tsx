import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface GlobalSearch {
  value: string
  onChange: (value: string) => void
}

const GlobalSearch = ({ value, onChange }: GlobalSearch) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 border-gray border shadow-none focus-visible:ring-0"
        aria-label="Search"
      />
    </div>
  )
}

export default GlobalSearch
