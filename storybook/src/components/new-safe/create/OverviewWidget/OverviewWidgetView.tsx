import type { ReactElement, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import SafeLogo from '@/public/images/logo-no-text.svg'
import css from './styles.module.css'

const LOGO_DIMENSIONS = '22px'

export type OverviewWidgetViewProps = {
  safeName: string
  hasWallet: boolean
  walletOverview: ReactNode
  hasNetworks: boolean
  networkLogos: ReactNode
  connectWalletButton: ReactNode
}

export function OverviewWidgetView({
  safeName,
  hasWallet,
  walletOverview,
  hasNetworks,
  networkLogos,
  connectWalletButton,
}: OverviewWidgetViewProps): ReactElement {
  const rows = [
    ...(hasWallet ? [{ title: 'Wallet', component: walletOverview }] : []),
    ...(safeName !== '' ? [{ title: 'Name', component: <Typography>{safeName}</Typography> }] : []),
    ...(hasNetworks
      ? [
          {
            title: 'Network(s)',
            component: networkLogos,
          },
        ]
      : []),
  ]

  return (
    <div className="col-span-12">
      <Card className="w-full">
        <div className={css.header}>
          <SafeLogo alt="Safe logo" width={LOGO_DIMENSIONS} height={LOGO_DIMENSIONS} />
          <Typography variant="h4">Your Safe account preview</Typography>
        </div>
        {hasWallet ? (
          <div className={css.rows}>
            {rows.map((row) => (
              <div key={row.title} className={css.row}>
                <Typography variant="paragraph-small">{row.title}</Typography>
                {row.component}
              </div>
            ))}
          </div>
        ) : (
          <div className={css.rows}>
            <Typography
              variant="paragraph-small"
              align="center"
              className="mb-2 block w-full text-[var(--color-border-main)]"
            >
              Connect your wallet to continue
            </Typography>
            {connectWalletButton}
          </div>
        )}
      </Card>
    </div>
  )
}
