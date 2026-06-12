import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
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
    <Alert className={cn('mb-4', className)}>
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>
        Some Safes linked to your wallet may be malicious or impersonations(address poisoning). Only trust Safes you can
        verify.{' '}
        <ExternalLink href={HelpCenterArticle.ADDRESS_POISONING} noIcon>
          Learn more about address poisoning
        </ExternalLink>
      </AlertDescription>
    </Alert>
  )
}

export default SecurityBanner
