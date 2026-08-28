import { AlertTriangle, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'

const SKELETON_ROW_COUNT = 4

export const PoliciesTableLoading = () => (
  <div className="flex flex-col gap-4" data-testid="policies-loading" aria-busy>
    {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
      <div key={index} className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-md" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-16 rounded-4xl" />
      </div>
    ))}
  </div>
)

/**
 * CGW either returns every policy in the space or fails; there is no partial response. Showing the
 * rows that did arrive would tell the user that the missing Safes have no policies, when in fact
 * their state is unknown. So a failure replaces the table rather than reducing it.
 */
export const PoliciesTableError = ({ onRetry }: { onRetry?: () => void }) => (
  <div className="flex flex-col items-center gap-3 py-10 text-center" data-testid="policies-error" role="alert">
    <AlertTriangle className="size-6 text-warning" aria-hidden />

    <div className="flex flex-col gap-1">
      <Typography variant="paragraph-bold">Couldn&apos;t load policies</Typography>
      <Typography variant="paragraph-small" className="text-muted-foreground">
        Some Safe accounts in this workspace couldn&apos;t be read, so the list may be incomplete.
      </Typography>
    </div>

    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
)

export const PoliciesNoSearchResults = ({ query }: { query: string }) => (
  <div className="flex flex-col items-center gap-3 py-10 text-center" data-testid="policies-no-results">
    <SearchX className="size-6 text-muted-foreground" aria-hidden />

    <div className="flex flex-col gap-1">
      <Typography variant="paragraph-bold">No policies found</Typography>
      <Typography variant="paragraph-small" className="text-muted-foreground">
        Nothing matches &ldquo;{query}&rdquo;. Try a different name, address or network.
      </Typography>
    </div>
  </div>
)
