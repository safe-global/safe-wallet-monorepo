import type { ReactElement, ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from '@/components/ui/link'
import { SAFENET_DOCS_URL } from '../statusPresentation'

/** Gray outbound link with the up-and-out arrow; turns black on hover. */
export const SafenetOutboundLink = ({
  href,
  testId,
  children,
}: {
  href: string
  testId?: string
  children: ReactNode
}): ReactElement => (
  <Link variant="muted" href={href} target="_blank" rel="noreferrer noopener" data-testid={testId}>
    <span className="inline-flex items-center gap-0.5">
      {children}
      <ArrowUpRight className="size-3.5" aria-hidden />
    </span>
  </Link>
)

export const SafenetLearnMore = (): ReactElement => (
  <SafenetOutboundLink href={SAFENET_DOCS_URL} testId="safenet-about-link">
    Learn more
  </SafenetOutboundLink>
)
