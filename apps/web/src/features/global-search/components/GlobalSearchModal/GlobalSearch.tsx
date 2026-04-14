import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface GlobalSearchProps {
  value: string
  onChange: (value: string) => void
}

const GlobalSearch = ({ value, onChange }: GlobalSearchProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 "
        aria-label="Search"
        autoFocus
      />
    </div>
  )
}

export default GlobalSearch
