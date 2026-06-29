import type { ReactElement } from 'react'
import { CircleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'

/**
 * Inline warning shown when an entered/displayed address dangerously resembles a
 * trusted anchor. CRITICAL = both visible ends match (the truncated-display attack);
 * WARN = a single end matches. `onReview` opens the full-length side-by-side compare.
 */
const AddressSimilarityWarning = ({
  match,
  onReview,
}: {
  match: SimilarityMatch
  onReview?: () => void
}): ReactElement => {
  const isCritical = match.severity === Severity.CRITICAL

  return (
    <Alert variant={isCritical ? 'destructive' : 'warning'} role="alert" data-testid="address-similarity-warning">
      <CircleAlert />
      <AlertTitle>
        {isCritical
          ? 'This address looks almost identical to one you trust'
          : 'This address resembles a trusted address'}
      </AlertTitle>
      <AlertDescription>
        <span>
          It shares the {isCritical ? 'first and last characters' : 'visible characters'} of an address you trust but
          differs in the middle — a common address-poisoning pattern. Verify the full address before continuing.
        </span>
        {onReview && (
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant={isCritical ? 'destructive' : 'outline'}
              size="sm"
              onClick={onReview}
              data-testid="address-similarity-review"
            >
              Compare full addresses
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

export default AddressSimilarityWarning
