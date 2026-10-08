import { AddressImage } from '@views/features/safe-shield/components/AddressImage'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import ExplorerButton from '@/components/common/ExplorerButton'
import { AnalysisDetailsDropdown } from '@views/features/safe-shield/components/AnalysisDetailsDropdown'

export type ShowAllAddressItem = {
  key: string
  address: string
  name?: string
  logoUrl?: string
  explorerHref?: string
  isCopied: boolean
  onCopy: () => void
}

export interface ShowAllAddressViewProps {
  showImage?: boolean
  items: ShowAllAddressItem[]
}

export const ShowAllAddressView = ({ items, showImage }: ShowAllAddressViewProps) => {
  return (
    <AnalysisDetailsDropdown>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.key} className="flex flex-row gap-2 rounded-[4px] bg-[var(--color-background-paper)] p-2">
            {showImage && <AddressImage logoUrl={item.logoUrl} />}
            <div className="flex flex-col gap-1">
              {item.name && (
                <Typography variant="paragraph-mini" className="block mb-1 text-[var(--color-text-primary)]">
                  {item.name}
                </Typography>
              )}
              <div className="leading-5" onClick={item.onCopy}>
                <Tooltip>
                  <TooltipTrigger render={<span className="inline-flex" />}>
                    <Typography
                      variant="paragraph-mini"
                      className="flex-1 cursor-pointer leading-5 break-all text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-text-primary)] [overflow-wrap:break-word]"
                    >
                      {item.address}
                    </Typography>
                  </TooltipTrigger>
                  <TooltipContent>{item.isCopied ? 'Copied to clipboard' : 'Copy address'}</TooltipContent>
                </Tooltip>
                <span className="text-[var(--color-text-secondary)]">
                  {item.explorerHref && <ExplorerButton href={item.explorerHref} />}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AnalysisDetailsDropdown>
  )
}
