import type { ReactElement } from 'react'
import { CircleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
    <Alert variant="warning" role="alert" data-testid="address-similarity-warning">
      <CircleAlert />
      <AlertTitle>
        {isCritical
          ? 'This address looks almost identical to one you trust'
          : 'This address resembles a trusted address'}
      </AlertTitle>
      <AlertDescription>
        It shares the {isCritical ? 'first and last characters' : 'visible characters'} of an address you trust but
        differs in the middle — a common address-poisoning pattern. Verify the full address before continuing.
        {onReview && (
          <button type="button" onClick={onReview} data-testid="address-similarity-review">
            Compare full addresses
          </button>
        )}
      </AlertDescription>
    </Alert>
  )
}

export default AddressSimilarityWarning
