import { Box, Button, CardActions, Divider, FormControl, Stack, SvgIcon, Typography } from '@mui/material'
import { type SafeCollectibleResponse } from '@safe-global/safe-gateway-typescript-sdk'
import { FormProvider, useForm } from 'react-hook-form'
import NftIcon from '@/public/images/common/nft.svg'
import AddressBookInput from '@/components/common/AddressBookInput'
import type { NftTransferParams } from '.'
import ImageFallback from '@/components/common/ImageFallback'
import TxCard from '../../common/TxCard'
import commonCss from '@/components/tx-flow/common/styles.module.css'

enum Field {
  recipient = 'recipient',
}

type FormData = Pick<NftTransferParams, Field.recipient>

type SendNftBatchProps = {
  onSubmit: (data: NftTransferParams) => void
  params: NftTransferParams
}

const NftItem = ({ image, name, description }: { image: string; name: string; description?: string }) => (
  <Stack direction="row" spacing={1} flexWrap="nowrap" alignItems="flex-start">
    <Box flex={0}>
      <ImageFallback
        src={image}
        fallbackSrc=""
        fallbackComponent={<SvgIcon component={NftIcon} inheritViewBox sx={{ width: 1, height: 1 }} />}
        alt={name}
        height={40}
      />
    </Box>

    <Box flex={1} minWidth={0} maxWidth={{ xl: 'calc(100% - 200px)' }}>
      <Typography
        data-testid="nft-item-name"
        variant="body2"
        fontWeight={700}
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
      >
        {name}
      </Typography>

      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          display="block"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
        >
          {description}
        </Typography>
      )}
    </Box>
  </Stack>
)

export const NftItems = ({ tokens }: { tokens: SafeCollectibleResponse[] }) => {
  return (
    <Box
      data-testid="nft-item-list"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflow: 'auto',
        maxHeight: '20vh',
        minHeight: '40px',
      }}
    >
      {tokens.map((token) => (
        <NftItem
          key={`${token.address}-${token.id}`}
          image={token.imageUri || token.logoUri}
          name={`${token.tokenName || token.tokenSymbol || ''} #${token.id}`}
          description={`Token ID: ${token.id}${token.name ? ` - ${token.name}` : ''}`}
        />
      ))}
    </Box>
  )
}

const SendNftBatch = ({ params, onSubmit }: SendNftBatchProps) => {
  const { tokens } = params

  const formMethods = useForm<FormData>({
    defaultValues: {
      [Field.recipient]: params.recipient,
    },
  })
  const {
    handleSubmit,
    watch,
    formState: { errors },
  } = formMethods

  const recipient = watch(Field.recipient)
  const isAddressValid = !!recipient && !errors[Field.recipient]

  const onFormSubmit = (data: FormData) => {
    onSubmit({
      recipient: data.recipient,
      tokens,
    })
  }

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <FormControl fullWidth sx={{ mb: 3, mt: 1 }}>
            <AddressBookInput name={Field.recipient} canAdd={isAddressValid} />
          </FormControl>

          <Typography
            data-testid="selected-nfts"
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 2,
            }}
          >
            Selected NFTs
          </Typography>

          <NftItems tokens={tokens} />

          <Divider className={commonCss.nestedDivider} sx={{ pt: 3 }} />

          <CardActions>
            <Button variant="contained" type="submit">
              Next
            </Button>
          </CardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}

export default SendNftBatch
