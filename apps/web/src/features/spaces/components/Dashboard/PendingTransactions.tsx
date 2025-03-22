import { Card, SvgIcon, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import css from '@/features/spaces/components/Dashboard/styles.module.css'
import ClockIcon from '@/public/images/common/clock-large.svg'
import CheckIcon from '@/public/images/common/check-large.svg'
import { type AllSafeItems, flattenSafeItems } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import useWallet from '@/hooks/wallets/useWallet'

const PendingTransactions = ({ safes }: { safes: AllSafeItems }) => {
  const wallet = useWallet()
  const currency = useAppSelector(selectCurrency)
  const safeItems = flattenSafeItems(safes)

  const { data: safeOverviews } = useGetMultipleSafeOverviewsQuery({
    safes: safeItems,
    currency,
    walletAddress: wallet?.address,
  })

  console.log(safeOverviews)

  const queuedItems = safeOverviews ? safeOverviews.reduce((prev, next) => prev + next.queued, 0) : 0
  const awaitingConfirmation = safeOverviews
    ? safeOverviews.reduce((prev, next) => (next.awaitingConfirmation ? prev + next.awaitingConfirmation : prev), 0)
    : 0

  return (
    <Card sx={{ p: 2, mt: 2 }}>
      <Typography variant="h5" mb={2}>
        Pending transactions
      </Typography>

      <Grid container spacing={3}>
        <Grid size={4}>
          <Card className={css.txCard} sx={{ bgcolor: 'background.main' }}>
            <Typography variant="body2" fontWeight="bold" color="primary.light" mb={0.5}>
              Awaiting confirmations
            </Typography>
            <Typography variant="h2">{queuedItems}</Typography>
          </Card>
        </Grid>

        <Grid size={4}>
          <Card className={css.txCard} sx={{ bgcolor: 'warning.background' }}>
            <SvgIcon component={ClockIcon} className={css.txIcon} inheritViewBox sx={{ color: 'warning.light' }} />

            <Typography variant="body2" fontWeight="bold" color="primary.light" mb={0.5}>
              Need your signature
            </Typography>
            <Typography variant="h2">{awaitingConfirmation}</Typography>
          </Card>
        </Grid>

        <Grid size={4}>
          <Card className={css.txCard} sx={{ bgcolor: 'success.background' }}>
            <SvgIcon component={CheckIcon} className={css.txIcon} inheritViewBox sx={{ color: 'success.light' }} />

            <Typography variant="body2" fontWeight="bold" color="primary.light" mb={0.5}>
              Ready to be executed
            </Typography>
            <Typography variant="h2">2</Typography>
          </Card>
        </Grid>
      </Grid>
    </Card>
  )
}

export default PendingTransactions
