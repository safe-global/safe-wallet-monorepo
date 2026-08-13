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
    <Alert variant="warning" outlined={false} className={cn('mb-4', className)}>
      <TriangleAlert />
      {title && <AlertTitle className="font-bold">{title}</AlertTitle>}
      <AlertDescription>
        Some Safe accounts may be malicious or impersonations. Only trust Safe accounts you can verify.{' '}
        <ExternalLink
          href={HelpCenterArticle.ADDRESS_POISONING}
          noIcon
          className="font-bold text-inherit [&>span]:underline"
        >
          Learn more
        </ExternalLink>
      </AlertDescription>
    </Alert>
  )
}

export default SecurityBanner
