import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { CircleAlert } from 'lucide-react'

/**
 * Top-of-list warning shown when at least one entry in a safe list has a
 * visually-similar address to another. Surfaces the address-poisoning risk
 * before the per-card "High similarity" pill is noticed.
 */
const SimilarAddressAlert = () => (
  <Alert
    variant="warning"
    className="dark:bg-[var(--color-warning-background)] dark:text-[var(--color-warning1-contrast-text)] dark:*:data-[slot=alert-description]:text-current"
    data-testid="similar-address-alert"
  >
    <CircleAlert />
    <AlertTitle>Similar addresses detected</AlertTitle>
    <AlertDescription>
      These addresses look very similar. Carefully verify the full address before confirming.
    </AlertDescription>
  </Alert>
)

export default SimilarAddressAlert
