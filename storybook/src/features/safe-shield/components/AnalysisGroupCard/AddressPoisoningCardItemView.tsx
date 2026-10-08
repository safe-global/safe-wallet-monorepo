import type { ReactNode } from 'react'
import ExplorerButton from '@/components/common/ExplorerButton'
import { Typography } from '@/components/ui/typography'
import { HighlightedAddress } from '@views/features/safe-shield/components/HighlightedAddress'

export type CopyTooltipSlotProps = {
  text: string
  initialToolTipText: string
  children: ReactNode
}

export type PoisoningAddress = {
  address: string
  name?: string
  explorerHref?: string
}

interface AddressRowProps {
  label: string
  address: string
  prefixLen: number
  suffixLen: number
  explorerHref?: string
  renderCopyTooltip: (props: CopyTooltipSlotProps) => ReactNode
}

const AddressRow = ({ label, address, prefixLen, suffixLen, explorerHref, renderCopyTooltip }: AddressRowProps) => (
  <div className="rounded bg-[var(--color-background-paper)] p-2">
    <div className="flex flex-col gap-0.5">
      <Typography variant="paragraph-mini" className="text-muted-foreground">
        {label}
      </Typography>
      <div className="flex flex-row items-start gap-0.5">
        {renderCopyTooltip({
          text: address,
          initialToolTipText: 'Copy address',
          children: (
            <Typography variant="paragraph-mini" className="flex-1 cursor-pointer text-primary hover:text-foreground">
              <HighlightedAddress address={address} prefixLen={prefixLen} suffixLen={suffixLen} />
            </Typography>
          ),
        })}
        {explorerHref && (
          <span className="text-muted-foreground">
            <ExplorerButton href={explorerHref} />
          </span>
        )}
      </div>
    </div>
  </div>
)

export interface AddressPoisoningCardItemViewProps {
  description: string
  borderColor: string
  entered?: PoisoningAddress
  anchor?: PoisoningAddress
  prefixLen: number
  suffixLen: number
  renderCopyTooltip: (props: CopyTooltipSlotProps) => ReactNode
}

export const AddressPoisoningCardItemView = ({
  description,
  borderColor,
  entered,
  anchor,
  prefixLen,
  suffixLen,
  renderCopyTooltip,
}: AddressPoisoningCardItemViewProps) => {
  return (
    <div className="overflow-hidden rounded bg-[var(--color-background-main)]">
      <div className="border-l-4 p-3" style={{ borderLeftColor: borderColor }}>
        <div className="flex flex-col gap-4">
          <Typography variant="paragraph-small" className="break-words text-primary">
            {description}
          </Typography>

          <div className="flex flex-col gap-2">
            {entered && (
              <AddressRow
                label="Address entered"
                address={entered.address}
                prefixLen={prefixLen}
                suffixLen={suffixLen}
                explorerHref={entered.explorerHref}
                renderCopyTooltip={renderCopyTooltip}
              />
            )}
            {anchor && (
              <AddressRow
                label={anchor.name ? `Saved address: ${anchor.name}` : 'Saved address'}
                address={anchor.address}
                prefixLen={prefixLen}
                suffixLen={suffixLen}
                explorerHref={anchor.explorerHref}
                renderCopyTooltip={renderCopyTooltip}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
