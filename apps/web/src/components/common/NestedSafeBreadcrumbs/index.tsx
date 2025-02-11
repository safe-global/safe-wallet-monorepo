import { useRouter } from 'next/router'
import Link from 'next/link'
import { Tooltip, Typography } from '@mui/material'
import type { ReactElement } from 'react'
import type { UrlObject } from 'url'

import useSafeInfo from '@/hooks/useSafeInfo'
import useAddressBook from '@/hooks/useAddressBook'
import Identicon from '../Identicon'

import css from './styles.module.css'
import { useParentSafe } from '@/hooks/useParentSafe'

export function NestedSafeBreadcrumbs(): ReactElement | null {
  const { pathname } = useRouter()
  const { safeAddress } = useSafeInfo()
  const parentSafe = useParentSafe()

  if (!parentSafe) {
    return null
  }

  return (
    <div className={css.container}>
      <BreadcrumbItem
        title="Parent Safe"
        address={parentSafe.address.value}
        href={{ pathname, query: { safe: parentSafe.address.value } }}
      />
      <Typography variant="body2">/</Typography>
      <BreadcrumbItem title="Nested Safe" address={safeAddress} />
    </div>
  )
}

const BreadcrumbItem = ({ title, address, href }: { title: string; address: string; href?: UrlObject }) => {
  const addressBook = useAddressBook()
  const name = addressBook[address] ?? address

  return (
    <Tooltip title={title}>
      <div className={css.breadcrumb}>
        <Identicon address={address} size={20} />
        {href ? (
          <Link href={href}>
            <Typography variant="body2" color="text.secondary">
              {name}
            </Typography>
          </Link>
        ) : (
          <Typography variant="body2">{name}</Typography>
        )}
      </div>
    </Tooltip>
  )
}
