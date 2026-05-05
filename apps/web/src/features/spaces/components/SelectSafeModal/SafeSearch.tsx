import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SafeSearchProps {
  value: string
  onChange: (value: string) => void
}

const SafeSearch = ({ value, onChange }: SafeSearchProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Search for safes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
        aria-label="Search for safes"
      />
    </div>
  )
}

export default SafeSearch
