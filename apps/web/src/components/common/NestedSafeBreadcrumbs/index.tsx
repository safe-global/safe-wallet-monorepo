import { useRouter } from 'next/router'
import { Typography } from '@mui/material'
import type { ReactElement } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import { useParentSafe } from '@/hooks/useParentSafe'
import { BreadcrumbItem } from '@/components/common/Breadcrumbs/BreadcrumbItem'

export function NestedSafeBreadcrumbs(): ReactElement | null {
  const { pathname } = useRouter()
  const { safeAddress } = useSafeInfo()
  const parentSafe = useParentSafe()

  if (!parentSafe) {
    return null
  }

  return (
    <>
      <BreadcrumbItem
        title="Parent Safe"
        address={parentSafe.address.value}
        href={{ pathname, query: { safe: parentSafe.address.value } }}
      />
      <Typography variant="body2">/</Typography>
      <BreadcrumbItem title="Nested Safe" address={safeAddress} />
    </>
  )
}
