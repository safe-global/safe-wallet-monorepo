import type { FormEventHandler, ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import NftIcon from '@/public/images/common/nft.svg'
import ImageFallback from '@/components/common/ImageFallback'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'

const NftItem = ({ image, name, description }: { image: string; name: string; description?: string }) => (
  <div className="flex flex-row flex-nowrap items-start gap-2">
    <div className="flex-none">
      <ImageFallback
        src={image}
        fallbackSrc=""
        fallbackComponent={<NftIcon className="size-10" />}
        alt={name}
        height={40}
      />
    </div>

    <div className="min-w-0 flex-1 xl:max-w-[calc(100%-200px)]">
      <Typography data-testid="nft-item-name" variant="paragraph-small-bold" className="block truncate">
        {name}
      </Typography>

      {description && (
        <Typography variant="paragraph-small" className="text-muted-foreground block truncate">
          {description}
        </Typography>
      )}
    </div>
  </div>
)

export const NftItems = ({ tokens }: { tokens: Collectible[] }) => {
  return (
    <div
      data-testid="nft-item-list"
      className="flex flex-col gap-4 overflow-auto"
      style={{ maxHeight: '20vh', minHeight: '40px' }}
    >
      {tokens.map((token) => (
        <NftItem
          key={`${token.address}-${token.id}`}
          image={token.imageUri || token.logoUri}
          name={`${token.tokenName || token.tokenSymbol || ''} #${token.id}`}
          description={`Token ID: ${token.id}${token.name ? ` - ${token.name}` : ''}`}
        />
      ))}
    </div>
  )
}

export type SendNftBatchViewProps = {
  onSubmit: FormEventHandler<HTMLFormElement>
  recipientInput: ReactNode
  tokens: Collectible[]
}

export const SendNftBatchView = ({ onSubmit, recipientInput, tokens }: SendNftBatchViewProps): ReactElement => {
  return (
    <TxCard>
      <form onSubmit={onSubmit}>
        <div className="mt-2 mb-6 w-full">{recipientInput}</div>

        <Typography data-testid="selected-nfts" variant="paragraph-small" className="text-muted-foreground mb-4 block">
          Selected NFTs
        </Typography>

        <NftItems tokens={tokens} />

        <div className="pt-6">
          <Separator bleed="6" />
        </div>

        <TxCardActions>
          <Button type="submit">Next</Button>
        </TxCardActions>
      </form>
    </TxCard>
  )
}
