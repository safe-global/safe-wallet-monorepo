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
    <Alert variant="warning" className={cn('mb-4', className)}>
      <TriangleAlert />
      {title && <AlertTitle className="font-bold">{title}</AlertTitle>}
      <AlertDescription>
        Some Safes linked to your wallet may be malicious or impersonations (address poisoning). Only trust Safes you
        can verify.{' '}
        <ExternalLink href={HelpCenterArticle.ADDRESS_POISONING} noIcon sx={{ textDecoration: 'underline' }}>
          Learn more about address poisoning
        </ExternalLink>
      </AlertDescription>
    </Alert>
  )
}

export default SecurityBanner
