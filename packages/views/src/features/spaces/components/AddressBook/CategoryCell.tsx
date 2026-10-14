import { RotateCw } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { CATEGORY_LABELS, type ContactCategory } from './types'

const MAX_NAMED_SAFES = 2

/** "Signer of Treasury, Payroll +1", the full list on hover. */
const SignerOf = ({ safes }: { safes: string[] }) => {
  const named = safes.slice(0, MAX_NAMED_SAFES)
  const rest = safes.length - named.length
  const summary = `Signer of ${named.join(', ')}${rest > 0 ? ` +${rest}` : ''}`

  // Indented by the chip's border and padding so the text lines up with the chip label above it.
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="text-muted-foreground block max-w-full cursor-default truncate pl-2.25 text-xs" />}
        data-testid="category-signer-of"
      >
        {summary}
      </TooltipTrigger>
      <TooltipContent>Signer of {safes.join(', ')}</TooltipContent>
    </Tooltip>
  )
}

/** An address the lookup could not place: a dash, and "Check again" on hover. */
const UnknownCategory = ({ onRetry }: { onRetry?: () => void }) => (
  <span className="group/category text-muted-foreground inline-flex items-center gap-1" data-testid="category-unknown">
    <span aria-label="Not sure">&mdash;</span>
    {onRetry && (
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onRetry}
        aria-label="Check again"
        className="opacity-0 group-hover/category:opacity-100 focus-visible:opacity-100"
      >
        <RotateCw aria-hidden="true" />
      </Button>
    )}
  </span>
)

type CategoryCellProps = {
  category: ContactCategory
  signerOf?: string[]
  onRetry?: () => void
}

/** The Category column: one chip (Workspace Safe, Safe account, Contract, EOA) or a dash, plus "Signer of …". */
const CategoryCell = ({ category, signerOf = [], onRetry }: CategoryCellProps) => {
  if (category === 'loading') return <Skeleton className="h-5 w-24" data-testid="category-skeleton" />

  return (
    <div className="flex w-full min-w-0 flex-col items-start gap-0.5">
      {category === 'unknown' ? (
        <UnknownCategory onRetry={onRetry} />
      ) : (
        <Badge variant="secondary" data-testid={`category-${category}`}>
          {CATEGORY_LABELS[category]}
        </Badge>
      )}
      {signerOf.length > 0 && <SignerOf safes={signerOf} />}
    </div>
  )
}

export default CategoryCell
