import { useRouter } from 'next/router'
import Link from 'next/link'
import { Tooltip, Typography } from '@mui/material'
import type { ReactElement } from 'react'
import type { UrlObject } from 'url'

import useSafeInfo from '@/hooks/useSafeInfo'
import useAddressBook from '@/hooks/useAddressBook'
import { parsePrefixedAddress } from '@/utils/addresses'
import Identicon from '../Identicon'

import css from './styles.module.css'

export function NestedSafeBreadcrumbs(): ReactElement | null {
  const { safeAddress: nestedSafeAddress } = useSafeInfo()
  const { query, pathname } = useRouter()
  const parent = Array.isArray(query.parent) ? query.parent[0] : query.parent

  if (!parent) {
    return null
  }

  const { address: parentSafeAddress } = parsePrefixedAddress(parent)

  return (
    <div className={css.container}>
      <BreadcrumbItem title="Parent Safe" address={parentSafeAddress} href={{ pathname, query: { safe: parent } }} />
      <Typography variant="body2">/</Typography>
      <BreadcrumbItem title="Nested Safe" address={nestedSafeAddress} />
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
