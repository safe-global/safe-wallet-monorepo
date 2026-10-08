import { Search } from 'lucide-react'
import { cn } from '@/utils/cn'

export type GlobalSearchInputViewProps = {
  buttonClassName?: string
  onOpen: () => void
}

export const GlobalSearchInputView = ({ buttonClassName, onOpen }: GlobalSearchInputViewProps) => {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-center gap-2 rounded-md bg-input border border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors',
        'hover:ring-1 hover:ring-ring',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        buttonClassName,
      )}
      aria-label="Search for anything"
    >
      <Search className="size-4 shrink-0" />
      <span>Search for anything</span>
    </button>
  )
}
