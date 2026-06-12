import { Search } from 'lucide-react'
import type { ComponentProps, ReactElement } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'

type SearchFieldProps = Omit<ComponentProps<'input'>, 'type'> & {
  className?: string
  inputClassName?: string
}

const searchInputClassName =
  'h-10 border-border bg-card pl-10 pr-3 shadow-none focus-visible:border-border focus-visible:ring-1 focus-visible:ring-ring'

const SearchField = ({ className, inputClassName, ...props }: SearchFieldProps): ReactElement => {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input className={cn(searchInputClassName, inputClassName)} {...props} />
    </div>
  )
}

export default SearchField
