import { Search } from 'lucide-react'
import { cn } from '@/utils/cn'

interface GlobalSearchInputProps {
  className?: string
}

const GlobalSearchInput = ({ className }: GlobalSearchInputProps) => {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2 rounded-md bg-card border border-input px-3 py-2 text-sm text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
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
