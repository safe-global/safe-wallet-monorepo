import Link from 'next/link'
import type { UrlObject } from 'url'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { useIsMobile } from '@/hooks/use-mobile'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import css from './styles.module.css'
import Identicon from '@/components/common/Identicon'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import useChainId from '@/hooks/useChainId'

export const BreadcrumbItem = ({ title, address, href }: { title: string; address: string; href?: UrlObject }) => {
  const isMobile = useIsMobile()
  const chainId = useChainId()
  const addressBookItem = useAddressBookItem(address, chainId)
  const name = addressBookItem ? addressBookItem.name : isMobile ? shortenAddress(address) : address

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className={css.breadcrumb}>
            <Identicon address={address} size={20} />
            {href ? (
              <Link href={href}>
                <Typography variant="paragraph-small" className="text-muted-foreground">
                  {name}
                </Typography>
              </Link>
            ) : (
              <Typography variant="paragraph-small">{name}</Typography>
            )}
          </div>
        }
      />
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  )
}
