import type { ReactElement } from 'react'
import { Box, Button, Grid, SvgIcon, Typography } from '@mui/material'
import ArrowIcon from '@/public/images/common/arrow-nw.svg'
import type { SafeCollectibleResponse } from '@safe-global/safe-gateway-typescript-sdk'
import { Sticky } from '@/components/common/Sticky'
import CheckWallet from '@/components/common/CheckWallet'
import { maybePlural } from '@safe-global/utils/utils/formatters'

type NftSendFormProps = {
  selectedNfts: SafeCollectibleResponse[]
}

const NftSendForm = ({ selectedNfts }: NftSendFormProps): ReactElement => {
  const nftsText = `NFT${maybePlural(selectedNfts)}`
  const noSelected = selectedNfts.length === 0

  return (
    <Sticky>
      <Grid
        container
        spacing={1}
        sx={{
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <Grid
          item
          sx={{
            display: ['none', 'block'],
            flex: '1',
          }}
        >
          <Box
            sx={{
              bgcolor: 'secondary.background',
              py: 0.75,
              px: 2,
              flex: 1,
              borderRadius: 1,
              mr: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <SvgIcon component={ArrowIcon} inheritViewBox color="border" sx={{ width: 12, height: 12 }} />

              <Typography
                variant="body2"
                sx={{
                  lineHeight: 'inherit',
                }}
              >
                {`${selectedNfts.length} ${nftsText} selected`}
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid item>
          <CheckWallet>
            {(isOk) => (
              <Button
                data-testid={`nft-send-btn-${!isOk || noSelected}`}
                type="submit"
                variant="contained"
                size="small"
                disabled={!isOk || noSelected}
                sx={{
                  minWidth: '10em',
                }}
              >
                {noSelected ? 'Send' : `Send ${selectedNfts.length} ${nftsText}`}
              </Button>
            )}
          </CheckWallet>
        </Grid>
      </Grid>
    </Sticky>
  )
}

export default NftSendForm
