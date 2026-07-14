import type { ReactNode } from 'react'
import { useReducer } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Typography } from '@/components/ui/typography'

interface AnalysisDetailsDropdownProps {
  showLabel?: string
  hideLabel?: string
  children: ReactNode
  defaultExpanded?: boolean
  /** Optional content wrapper for custom styles for the collapsible content */
  contentWrapper?: (children: ReactNode) => ReactNode
}

export const AnalysisDetailsDropdown = ({
  showLabel = 'Show all',
  hideLabel = 'Hide all',
  children,
  defaultExpanded = false,
  contentWrapper,
}: AnalysisDetailsDropdownProps) => {
  const [expanded, toggle] = useReducer((state: boolean) => !state, defaultExpanded)

  return (
    <Collapsible open={expanded} className="-mt-3">
      <div
        onClick={toggle}
        role="button"
        aria-label={expanded ? hideLabel : showLabel}
        className={`group relative inline-flex w-fit cursor-pointer items-center overflow-hidden text-[var(--color-text-secondary)] ${
          expanded ? 'mb-1' : ''
        }`}
      >
        <Typography variant="paragraph-mini" className="text-[var(--color-text-secondary)]">
          {expanded ? hideLabel : showLabel}
        </Typography>
        <div className="absolute bottom-0 left-0 h-px w-0 -translate-x-4 bg-[rgba(0,0,0,0.1)] transition-all group-hover:w-full group-hover:translate-x-full" />
        <ChevronDown
          data-testid="ExpandMoreIcon"
          className="size-5 transition-transform"
          style={{ transform: expanded ? 'rotate(-180deg)' : 'rotate(0deg)' }}
        />
      </div>

      <CollapsibleContent keepMounted>{contentWrapper ? contentWrapper(children) : children}</CollapsibleContent>
    </Collapsible>
  )
}
