import type { ReactNode } from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { CircleAlert } from 'lucide-react'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { cn } from '@/utils/cn'

/**
 * Shared address-poisoning banner. Tone follows the strongest match and matches the per-row pill
 * backgrounds: `error` (red / high-risk) when a both-ends look-alike is present, otherwise `warning`
 * (amber / caution). Always carries a "Learn more about address poisoning" link. Title/description
 * default to the "similar addresses detected" copy but can be overridden (e.g. the trusted-safe modal's
 * always-on "verify before you trust" notice).
 */
const SimilarAddressAlert = ({
  severity = 'warning',
  title = 'Similar addresses detected',
  description = 'These addresses look very similar. Carefully verify the full address before confirming.',
  className,
}: {
  severity?: 'warning' | 'error'
  title?: string
  description?: ReactNode
  className?: string
}) => {
  const tone = severity === 'error' ? 'error' : 'warning'
  return (
    <Alert
      variant={severity === 'error' ? 'destructive' : 'warning'}
      className={cn('*:data-[slot=alert-description]:text-current', className)}
      style={{
        backgroundColor: `var(--color-${tone}-background)`,
        color: `var(--color-${tone}-dark)`,
        borderColor: `var(--color-${tone}-light)`,
      }}
      data-testid="similar-address-alert"
      data-severity={severity}
    >
      <CircleAlert />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>
        {description}{' '}
        <ExternalLink
          href={HelpCenterArticle.ADDRESS_POISONING}
          noIcon
          sx={{ textDecoration: 'underline', color: 'inherit' }}
        >
          Learn more about address poisoning
        </ExternalLink>
      </AlertDescription>
    </Alert>
  )
}

export default SimilarAddressAlert
