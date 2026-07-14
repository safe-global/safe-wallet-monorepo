import WalletOverview from 'src/components/common/WalletOverview'
import useWallet from '@/hooks/wallets/useWallet'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
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
    <div className="col-span-12">
      {/* eslint-disable-next-line no-restricted-syntax -- faithful css-module port, pixel-identical; bespoke value has no variant */}
      <Card className="w-full border border-[var(--color-border-light)]">
        <div className={css.header}>
          <SafeLogo alt="Safe logo" width={LOGO_DIMENSIONS} height={LOGO_DIMENSIONS} />
          <Typography variant="h4">Your Safe account preview</Typography>
        </div>
        {wallet ? (
          rows.map((row) => (
            <div key={row.title} className={css.row}>
              <Typography variant="paragraph-small">{row.title}</Typography>
              {row.component}
            </div>
          ))
        ) : (
          <div className="p-4">
            <Typography
              variant="paragraph-small"
              align="center"
              className="mb-2 block w-full text-[var(--color-border-main)]"
            >
              Connect your wallet to continue
            </Typography>
            <ConnectWalletButton fullWidth />
          </div>
        )}
      </Card>
    </div>
  )
}

export default OverviewWidget
