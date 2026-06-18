import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { TriangleAlert } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'
import { cn } from '@/utils/cn'

interface SecurityBannerProps {
  title?: string
  className?: string
}

/**
 * Security banner informing users about address poisoning attacks.
 * Used in safe selection modal and trusted safe confirmation dialog.
 */
const SecurityBanner = ({ title, className }: SecurityBannerProps) => {
  return (
    <Alert
      variant="warning"
      className={cn(
        'mb-4 dark:bg-[var(--color-warning-background)] dark:text-[var(--color-warning1-contrast-text)]',
        className,
      )}
    >
      <TriangleAlert />
      {title && <AlertTitle className="font-bold">{title}</AlertTitle>}
      <AlertDescription className="dark:text-current">
        Some Safes linked to your wallet may be malicious or impersonations (address poisoning). Only trust Safes you
        can verify.{' '}
        <ExternalLink
          href={HelpCenterArticle.ADDRESS_POISONING}
          noIcon
          sx={{ textDecoration: 'underline', '.dark &': { color: 'inherit' } }}
        >
          Learn more about address poisoning
        </ExternalLink>
      </AlertDescription>
    </Alert>
  )
}

export default SecurityBanner
