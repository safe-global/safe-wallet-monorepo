import type { ReactElement, ComponentProps } from 'react'
import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'

/**
 * Renders an external Link which always sets the noopener and noreferrer rel attribute and the target to _blank.
 * It also always adds the external link icon as end adornment.
 */
const ExternalLink = ({
  noIcon = false,
  children,
  href,
  mode = 'link',
  className,
  ...props
}: Omit<ComponentProps<'a'>, 'target' | 'rel'> & { noIcon?: boolean; mode?: 'button' | 'link' }): ReactElement => {
  if (!href) return <>{children}</>

  const linkContent = (
    <span className="inline-flex cursor-pointer items-center gap-0.5">
      {children ?? href}
      {!noIcon && <ExternalLinkIcon className="external-link-icon size-4" />}
    </span>
  )
  return mode === 'link' ? (
    <Link href={href} rel="noreferrer noopener" target="_blank" className={className} {...props}>
      {linkContent}
    </Link>
  ) : (
    <Button
      variant="outline"
      className={className}
      render={<a href={href} rel="noreferrer noopener" target="_blank" />}
    >
      {linkContent}
    </Button>
  )
}

export default ExternalLink
