import type { ReactElement } from 'react'
import SubmitButton from '@/components/common/SubmitButton'
import { Typography } from '@/components/ui/typography'
import ArrowIcon from '@/public/images/common/arrow-up-right.svg'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import { Sticky } from '@/components/common/Sticky'
import CheckWallet from '@/components/common/CheckWallet'
import { maybePlural } from '@safe-global/utils/utils/formatters'

type NftSendFormProps = {
  selectedNfts: Collectible[]
}

const NftSendForm = ({ selectedNfts }: NftSendFormProps): ReactElement => {
  const nftsText = `NFT${maybePlural(selectedNfts)}`
  const noSelected = selectedNfts.length === 0

  return (
    <Sticky>
      <div className="flex items-center justify-end gap-2">
        <div className="hidden flex-1 sm:block">
          <div className="mr-2 flex-1 rounded-md bg-[var(--color-secondary-background)] px-4 py-1.5">
            <div className="flex items-center gap-3">
              <ArrowIcon className="size-3 text-[var(--color-border-main)]" />

              <Typography variant="paragraph-small" className="leading-[inherit]">
                {`${selectedNfts.length} ${nftsText} selected`}
              </Typography>
            </div>
          </div>
        </div>

        <div>
          <CheckWallet>
            {(isOk) => (
              <SubmitButton data-testid={`nft-send-btn-${!isOk || noSelected}`} disabled={!isOk || noSelected}>
                {noSelected ? 'Send' : `Send ${selectedNfts.length} ${nftsText}`}
              </SubmitButton>
            )}
          </CheckWallet>
        </div>
      </div>
    </Sticky>
  )
}

export default NftSendForm
