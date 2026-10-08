import { useState } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import useAddressBook from '@/hooks/useAddressBook'
import useChainId from '@/hooks/useChainId'
import {
  ShowAllAddressView,
  type ShowAllAddressItem,
} from '@views/features/safe-shield/components/ShowAllAddress/ShowAllAddressView'

interface ShowAllAddressProps {
  showImage?: boolean
  addresses: {
    address: string
    name?: string
    logoUrl?: string
  }[]
}

export const ShowAllAddress = ({ addresses, showImage }: ShowAllAddressProps) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const currentChain = useCurrentChain()
  const chainId = useChainId()
  const addressBook = useAddressBook(chainId)

  const handleCopyToClipboard = async (address: string, index: number) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  const items: ShowAllAddressItem[] = addresses.map((item, index) => {
    const explorerLink = currentChain ? getBlockExplorerLink(currentChain, item.address) : undefined

    return {
      key: `${item}-${index}`,
      address: item.address,
      name: addressBook[item.address] || item.name,
      logoUrl: item.logoUrl,
      explorerHref: explorerLink?.href,
      isCopied: copiedIndex === index,
      onCopy: () => handleCopyToClipboard(item.address, index),
    }
  })

  return <ShowAllAddressView items={items} showImage={showImage} />
}
