import { SearchX } from 'lucide-react'
import { Typography } from '@/components/ui/typography'

export const PoliciesNoSearchResults = ({ query }: { query: string }) => (
  <div className="flex flex-col items-center gap-3 py-10 text-center" data-testid="policies-no-results">
    <SearchX className="size-6 text-muted-foreground" aria-hidden />

    <div className="flex flex-col gap-1">
      <Typography variant="paragraph-bold">No policies found</Typography>
      <Typography variant="paragraph-small" className="text-muted-foreground">
        {query ? (
          <>Nothing matches &ldquo;{query}&rdquo;. Try a different name, address or network.</>
        ) : (
          'Nothing matches this filter.'
        )}
      </Typography>
    </div>
  </div>
)
