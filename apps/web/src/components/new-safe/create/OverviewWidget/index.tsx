import useWallet from '@/hooks/wallets/useWallet'
import SafeLogo from '@/public/images/logo-no-text.svg'
import SafenetLogo from '@/public/images/safenet/logo-no-text-safenet.svg'
import { Box, Card, Grid, Typography } from '@mui/material'
import type { ReactElement } from 'react'
import WalletOverview from 'src/components/common/WalletOverview'

import ConnectWalletButton from '@/components/common/ConnectWallet/ConnectWalletButton'
import css from '@/components/new-safe/create/OverviewWidget/styles.module.css'
import NetworkLogosList from '@/features/multichain/components/NetworkLogosList'
import SafenetNetworkSelector from '@/features/safenet/components/SafenetNetworkSelector'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'

const LOGO_DIMENSIONS = '22px'

const OverviewWidget = ({
  safeName,
  networks,
  isSafenet = false,
}: {
  safeName: string
  networks: ChainInfo[]
  isSafenet?: boolean
}): ReactElement | null => {
  const wallet = useWallet()
  const rows = [
    ...(wallet ? [{ title: 'Wallet', component: <WalletOverview wallet={wallet} isSafenet={isSafenet} /> }] : []),
    ...(safeName !== '' ? [{ title: 'Name', component: <Typography>{safeName}</Typography> }] : []),
    ...(networks.length
      ? [
          {
            title: 'Network(s)',
            component: !isSafenet ? <NetworkLogosList networks={networks} /> : <SafenetNetworkSelector />,
          },
        ]
      : []),
  ]

  return (
    <Grid item xs={12}>
      <Card className={css.card}>
        <div className={css.header}>
          {isSafenet ? (
            <SafenetLogo alt="Safe logo" width={LOGO_DIMENSIONS} height={LOGO_DIMENSIONS} />
          ) : (
            <SafeLogo alt="Safe logo" width={LOGO_DIMENSIONS} height={LOGO_DIMENSIONS} />
          )}
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
