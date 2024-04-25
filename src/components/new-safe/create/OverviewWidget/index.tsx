import { Card, Grid, Typography } from '@mui/material'
import type { ReactElement } from 'react'
import css from '@/components/new-safe/create/OverviewWidget/styles.module.css'
import WalletOverview from '../../../common/WalletOverview'
import ChainIndicator from '../../../common/ChainIndicator'
import useWallet from '@/hooks/wallets/useWallet'

const LOGO_DIMENSIONS = '22px'

const OverviewWidget = ({
  superChainId,
  walletName,
}: {
  superChainId: string
  walletName: string
}): ReactElement | null => {
  const wallet = useWallet()
  const rows = [
    ...(wallet ? [{ title: 'Wallet', component: <WalletOverview wallet={wallet} /> }] : []),
    ...(wallet
      ? [
          {
            title: 'Network',
            component: <ChainIndicator inline />,
          },
        ]
      : []),
    ...(superChainId !== ''
      ? [
          {
            title: 'Account ID',
            component: <Typography>{superChainId}</Typography>,
          },
        ]
      : []),
    ...(walletName !== ''
      ? [
          {
            title: 'Wallet Name',
            component: <Typography>{walletName}</Typography>,
          },
        ]
      : []),
  ]

  return (
    <Grid item xs={12}>
      <Card className={css.card}>
        <div className={css.header}>
          <Typography variant="h4">Your Superchain Account preview</Typography>
        </div>
        {wallet ? (
          rows.map((row) => (
            <div key={row.title} className={css.row}>
              <Typography variant="body2">{row.title}</Typography>
              {row.component}
            </div>
          ))
        ) : (
          <div className={css.row}>
            <Typography variant="body2" color="border.main" textAlign="center" width={1}>
              Connect your wallet to continue
            </Typography>
          </div>
        )}
      </Card>
    </Grid>
  )
}

export default OverviewWidget
