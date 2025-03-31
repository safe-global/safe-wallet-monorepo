import { useRouter } from 'next/router'
import { Typography } from '@mui/material'
import type { ReactElement } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import { useParentSafe } from '@/hooks/useParentSafe'
import { BreadcrumbItem } from '@/components/common/Breadcrumbs/BreadcrumbItem'
import { formatPrefixedAddress } from '@safe-global/utils/utils/addresses'
import { useChain } from '@/hooks/useChains'

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
    <>
      <BreadcrumbItem
        title="Parent Safe"
        address={parentSafe.address.value}
        href={{
          pathname,
          query: { ...query, safe: prefixedAddress },
        }}
      />
      <Typography variant="body2">/</Typography>
      <BreadcrumbItem title="Nested Safe" address={safeAddress} />
    </>
  )
}
