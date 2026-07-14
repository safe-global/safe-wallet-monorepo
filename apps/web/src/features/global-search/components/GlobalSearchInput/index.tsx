import { Search } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAppDispatch } from '@/store'
import { openGlobalSearch } from '@/features/global-search/store'

interface GlobalSearchInputProps {
  className?: string
}

const GlobalSearchInput = ({ className }: GlobalSearchInputProps) => {
  const dispatch = useAppDispatch()

  return (
    <button
      type="button"
      onClick={() => dispatch(openGlobalSearch())}
      className={cn(
        'flex w-full items-center gap-2 rounded-md bg-card border border-border px-3 py-2 text-sm text-muted-foreground transition-colors',
        'hover:ring-1 hover:ring-ring',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        className,
      )}
      aria-label="Search for anything"
    >
      <Search className="size-4 shrink-0" />
      <span>Search for anything</span>
    </button>
  )
}

export default GlobalSearchInput
