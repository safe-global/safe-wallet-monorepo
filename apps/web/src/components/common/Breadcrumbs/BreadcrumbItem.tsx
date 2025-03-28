import Link from 'next/link'
import type { UrlObject } from 'url'
import { Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material'
import useAddressBook from '@/hooks/useAddressBook'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import css from './styles.module.css'
import Identicon from '@/components/common/Identicon'

export const BreadcrumbItem = ({ title, address, href }: { title: string; address: string; href?: UrlObject }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const addressBook = useAddressBook()
  const name = addressBook[address] ?? (isMobile ? shortenAddress(address) : address)

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
