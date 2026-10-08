import type { UrlObject } from 'url'
import { useIsBelowSm } from '@/hooks/useMediaQuery'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import useChainId from '@/hooks/useChainId'
import { BreadcrumbItemView } from '@views/components/common/Breadcrumbs/BreadcrumbItemView'

export const BreadcrumbItem = ({ title, address, href }: { title: string; address: string; href?: UrlObject }) => {
  const isMobile = useIsBelowSm()
  const chainId = useChainId()
  const addressBookItem = useAddressBookItem(address, chainId)
  const name = addressBookItem ? addressBookItem.name : isMobile ? shortenAddress(address) : address

  return <BreadcrumbItemView title={title} address={address} name={name} href={href} />
}
