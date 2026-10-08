import { useRouter } from 'next/router'
import type { ReactElement } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import { useParentSafe } from '@/hooks/useParentSafe'
import { BreadcrumbItem } from '@/components/common/Breadcrumbs/BreadcrumbItem'
import { formatPrefixedAddress } from '@safe-global/utils/utils/addresses'
import { useChain } from '@/hooks/useChains'
import { NestedSafeBreadcrumbsView } from '@views/components/common/NestedSafeBreadcrumbs/NestedSafeBreadcrumbsView'

export function NestedSafeBreadcrumbs(): ReactElement | null {
  const { pathname, query } = useRouter()
  const { safeAddress } = useSafeInfo()
  const parentSafe = useParentSafe()
  const currentChain = useChain(parentSafe?.chainId || '')

  if (!parentSafe) {
    return null
  }

  const prefixedAddress = formatPrefixedAddress(parentSafe.address.value, currentChain?.shortName)

  return (
    <NestedSafeBreadcrumbsView
      parentAddress={parentSafe.address.value}
      parentHref={{
        pathname,
        query: { ...query, safe: prefixedAddress },
      }}
      safeAddress={safeAddress}
      renderItem={(props) => <BreadcrumbItem {...props} />}
    />
  )
}
