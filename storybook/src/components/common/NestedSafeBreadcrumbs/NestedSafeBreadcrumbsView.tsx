import type { ReactElement, ReactNode } from 'react'
import type { UrlObject } from 'url'
import { Typography } from '@/components/ui/typography'

export type BreadcrumbItemSlotProps = { title: string; address: string; href?: UrlObject }

export type NestedSafeBreadcrumbsViewProps = {
  parentAddress: string
  parentHref: UrlObject
  safeAddress: string
  /** Renders the BreadcrumbItem container */
  renderItem: (props: BreadcrumbItemSlotProps) => ReactNode
}

export function NestedSafeBreadcrumbsView({
  parentAddress,
  parentHref,
  safeAddress,
  renderItem,
}: NestedSafeBreadcrumbsViewProps): ReactElement {
  return (
    <>
      {renderItem({ title: 'Parent Safe', address: parentAddress, href: parentHref })}
      <Typography variant="paragraph-small">/</Typography>
      {renderItem({ title: 'Nested Safe', address: safeAddress })}
    </>
  )
}
