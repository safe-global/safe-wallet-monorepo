import WalletOverview from 'src/components/common/WalletOverview'
import useWallet from '@/hooks/wallets/useWallet'
import { Box, Card, Grid, Typography } from '@mui/material'
import type { ReactElement } from 'react'
import SafeLogo from '@/public/images/logo-no-text.svg'

import css from '@/components/new-safe/create/OverviewWidget/styles.module.css'
import ConnectWalletButton from '@/components/common/ConnectWallet/ConnectWalletButton'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { NetworkLogosList } from '@/features/multichain'

const LOGO_DIMENSIONS = '22px'

const OverviewWidget = ({ safeName, networks }: { safeName: string; networks: Chain[] }): ReactElement | null => {
  const wallet = useWallet()
  const rows = [
    ...(wallet ? [{ title: 'Wallet', component: <WalletOverview wallet={wallet} /> }] : []),
    ...(safeName !== '' ? [{ title: 'Name', component: <Typography>{safeName}</Typography> }] : []),
    ...(networks.length
      ? [
          {
            title: 'Network(s)',
            component: <NetworkLogosList networks={networks} />,
          },
        ]
      : []),
  ]

  return (
    <Grid item xs={12}>
      <Card className={css.card}>
        <div className={css.header}>
          <SafeLogo alt="Safe logo" width={LOGO_DIMENSIONS} height={LOGO_DIMENSIONS} />
          <Typography variant="h4">Your Safe Account preview</Typography>
        </div>
        {wallet ? (
          rows.map((row) => (
            <div key={row.title} className={css.row}>
              <Typography variant="body2">{row.title}</Typography>
              {row.component}
            </div>
          ))
        ) : (
          <Box p={2}>
            <Typography variant="body2" color="border.main" textAlign="center" width={1} mb={1}>
              Connect your wallet to continue
            </Typography>
            <ConnectWalletButton />
          </Box>
        )}
      </Card>
    </Grid>
  )
}

export default OverviewWidget
