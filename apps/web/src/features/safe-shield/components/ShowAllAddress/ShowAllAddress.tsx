import { AddressImage } from '../AddressImage'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { useState } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import ExplorerButton from '@/components/common/ExplorerButton'
import useAddressBook from '@/hooks/useAddressBook'
import useChainId from '@/hooks/useChainId'
import { AnalysisDetailsDropdown } from '../AnalysisDetailsDropdown'

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

  return (
    <AnalysisDetailsDropdown>
      <div className="flex flex-col gap-2">
        {addresses.map((item, index) => {
          const explorerLink = currentChain ? getBlockExplorerLink(currentChain, item.address) : undefined
          const name = addressBook[item.address] || item.name

          return (
            <div
              key={`${item}-${index}`}
              className="flex flex-row gap-2 rounded-[4px] bg-[var(--color-background-paper)] p-2"
            >
              {showImage && <AddressImage logoUrl={item.logoUrl} />}
              <div className="flex flex-col gap-1">
                {name && (
                  <Typography variant="paragraph-mini" className="mb-1 text-[var(--color-text-primary)]">
                    {name}
                  </Typography>
                )}
                <div className="leading-5" onClick={() => handleCopyToClipboard(item.address, index)}>
                  <Tooltip>
                    <TooltipTrigger render={<span className="inline-flex" />}>
                      <Typography
                        variant="paragraph-mini"
                        className="flex-1 cursor-pointer leading-5 break-words text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-text-primary)] [overflow-wrap:break-word]"
                      >
                        {item.address}
                      </Typography>
                    </TooltipTrigger>
                    <TooltipContent>{copiedIndex === index ? 'Copied to clipboard' : 'Copy address'}</TooltipContent>
                  </Tooltip>
                  <span className="text-[var(--color-text-secondary)]">
                    {explorerLink && <ExplorerButton href={explorerLink.href} />}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AnalysisDetailsDropdown>
  )
}
