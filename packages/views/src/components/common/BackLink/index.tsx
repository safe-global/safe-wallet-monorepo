import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'

type BackLinkProps = {
  children: ReactNode
  onClick: () => void
  ariaLabel?: string
}

function BackLink({ children, onClick, ariaLabel = 'Go back' }: BackLinkProps) {
  return (
    // TODO: change rounded-lg (8px) to rounded-2xl (16px) after migrating to the new design system
    <div className="flex self-stretch rounded-lg bg-card shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]">
      <button
        onClick={onClick}
        className="flex flex-1 items-center gap-1 min-h-[60px] border-0 rounded-lg bg-transparent pl-2 pr-2 m-1 cursor-pointer hover:bg-muted/30 transition-colors"
        aria-label={ariaLabel}
      >
        <ChevronLeft className="size-5" />
        {children}
      </button>
    </div>
  )
}

export default BackLink
