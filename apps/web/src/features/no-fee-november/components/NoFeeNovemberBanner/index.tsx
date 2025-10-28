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

export const noFeeNovemberBannerID = 'noFeeNovemberBanner'

const NoFeeNovemberBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const { setTxFlow } = useContext(TxModalContext)

  const handleNewTransaction = () => {
    setTxFlow(<NewTxFlow />, undefined, false)
  }

  return (
    <Card className={css.banner}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <Image
          src="/images/common/no-fee-november/Cards.svg"
          alt="No Fee November Cards"
          width={76}
          height={76}
          className={css.cardsImage}
        />
        <Box>
          <Typography variant="h4" fontWeight="bold" color="static.main" className={css.bannerText}>
            Enjoy No Fee November
          </Typography>
          <Typography variant="body2" color="static.light" className={css.bannerTextInteractive}>
            SAFE holders enjoy gasless transactions on Mainnet this November.{' '}
            <Link
              href="https://help.safe.global/en/articles/456540-no-fee-november"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', fontWeight: 'bold' }}
            >
              Learn more
            </Link>
          </Typography>
          <Track {...{ category: 'overview', action: 'open_no_fee_november_new_tx' }}>
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
      <Track {...{ category: 'overview', action: 'hide_no_fee_november_banner' }}>
        <IconButton className={css.closeButton} aria-label="close" onClick={onDismiss}>
          <CloseIcon fontSize="small" color="border" />
        </IconButton>
      </Track>
    </Card>
  )
}

export default NoFeeNovemberBanner
