import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import { FormProvider, useForm } from 'react-hook-form'
import NftIcon from '@/public/images/common/nft.svg'
import AddressBookInput from '@/components/common/AddressBookInput'
import type { NftTransferParams } from '.'
import ImageFallback from '@/components/common/ImageFallback'
import TxCard from '../../common/TxCard'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { useContext, useMemo } from 'react'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'
import { useSafeShieldForRecipients } from '@/features/safe-shield/SafeShieldContext'

enum Field {
  recipient = 'recipient',
}

type FormData = Pick<NftTransferParams, Field.recipient>

const NftItem = ({ image, name, description }: { image: string; name: string; description?: string }) => (
  <div className="flex flex-row flex-nowrap items-start gap-2">
    <div className="flex-none">
      <ImageFallback
        src={image}
        fallbackSrc=""
        fallbackComponent={<NftIcon className="size-full" />}
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

const SendNftBatch = () => {
  const { data, onNext } = useContext<TxFlowContextType<NftTransferParams>>(TxFlowContext)
  const { tokens = [] } = data || {}

  const formMethods = useForm<FormData>({
    defaultValues: {
      [Field.recipient]: data?.recipient,
    },
  })
  const {
    handleSubmit,
    watch,
    formState: { errors },
  } = formMethods

  const recipient = watch(Field.recipient)
  const isAddressValid = !!recipient && !errors[Field.recipient]

  const recipientArray = useMemo(() => [recipient], [recipient])
  useSafeShieldForRecipients(recipientArray)

  const onFormSubmit = (data: FormData) => {
    onNext({
      recipient: data.recipient,
      tokens,
    })
  }

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="mt-2 mb-6 w-full">
            <AddressBookInput name={Field.recipient} canAdd={isAddressValid} />
          </div>

          <Typography
            data-testid="selected-nfts"
            variant="paragraph-small"
            className="text-muted-foreground mb-4 block"
          >
            Selected NFTs
          </Typography>

          <NftItems tokens={tokens} />

          <div className="pt-6">
            <Separator className={commonCss.nestedDivider} />
          </div>

          <div className="flex items-center gap-2 p-2">
            <Button type="submit">Next</Button>
          </div>
        </form>
      </FormProvider>
    </TxCard>
  )
}

export default SendNftBatch
