import { Search } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

function SearchInput() {
  return (
    <InputGroup className="w-full max-w-sm bg-background border-none">
      <InputGroupAddon align="inline-start">
        <Search />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search for anything" />
    </InputGroup>
  )
}

export default SearchInput
