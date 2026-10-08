import type { ReactElement, ReactNode } from 'react'
import SubmitButton from '@/components/common/SubmitButton'
import { Typography } from '@/components/ui/typography'
import ArrowIcon from '@/public/images/common/arrow-up-right.svg'
import { Sticky } from '@/components/common/Sticky'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export type NftSendFormViewProps = {
  selectedCount: number
  renderCheckWallet: (children: (isOk: boolean) => ReactElement) => ReactNode
}

export const NftSendFormView = ({ selectedCount, renderCheckWallet }: NftSendFormViewProps): ReactElement => {
  const nftsText = `NFT${maybePlural(selectedCount)}`
  const noSelected = selectedCount === 0

  return (
    <Sticky>
      <div className="flex items-center justify-end gap-2">
        <div className="hidden flex-1 sm:block">
          <div className="mr-2 flex-1 rounded-md bg-[var(--color-secondary-background)] px-4 py-1.5">
            <div className="flex items-center gap-3">
              <ArrowIcon className="size-3 text-[var(--color-border-main)]" />

              <Typography variant="paragraph-small" className="leading-[inherit]">
                {`${selectedCount} ${nftsText} selected`}
              </Typography>
            </div>
          </div>
        </div>

        <div>
          {renderCheckWallet((isOk) => (
            <SubmitButton data-testid={`nft-send-btn-${!isOk || noSelected}`} disabled={!isOk || noSelected}>
              {noSelected ? 'Send' : `Send ${selectedCount} ${nftsText}`}
            </SubmitButton>
          ))}
        </div>
      </div>
    </Sticky>
  )
}
