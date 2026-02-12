import { Box, Button, Card, IconButton, Stack, Typography } from '@mui/material'
import Image from 'next/image'
import css from './styles.module.css'
import CloseIcon from '@mui/icons-material/Close'
import Track from '@/components/common/Track'
import Link from 'next/link'
import { useContext } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'
import CheckWallet from '@/components/common/CheckWallet'

const NoFeeCampaignBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const { setTxFlow } = useContext(TxModalContext)

  const handleNewTransaction = () => {
    setTxFlow(<NewTxFlow />, undefined, false)
  }

  return (
    <Card className={css.banner}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <Image
          src="/images/common/no-fee-campaign/Cards_USDe.svg"
          alt="USDe Logo"
          width={76}
          height={76}
          className={css.cardsImage}
        />
        <Box>
          <Typography variant="h4" fontWeight="bold" color="static.main" className={css.bannerText}>
            Enjoy Free January
          </Typography>
          <Typography variant="body2" color="static.light" className={css.bannerTextInteractive}>
            No-Fee for Ethena USDe holders on Ethereum Mainnet, this January!{' '}
            <Link
              href="https://help.safe.global/en/articles/484423-no-fee-january-campaign"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', fontWeight: 'bold' }}
            >
              Learn more
            </Link>
          </Typography>
          <Track {...{ category: 'overview', action: 'open_no_fee_campaign_new_tx' }}>
            <CheckWallet allowSpendingLimit>
              {(isOk) => (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleNewTransaction}
                  className={css.actionButton}
                  disabled={!isOk}
                >
                  New transaction
                </Button>
              )}
            </CheckWallet>
          </Track>
        </Box>
      </Stack>
      <Track {...{ category: 'overview', action: 'hide_no_fee_campaign_banner' }}>
        <IconButton className={css.closeButton} aria-label="close" onClick={onDismiss}>
          <CloseIcon fontSize="small" color="border" />
        </IconButton>
      </Track>
    </Card>
  )
}

export default NoFeeCampaignBanner
