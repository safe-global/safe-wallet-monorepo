import type { ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import PagePlaceholder from '@/components/common/PagePlaceholder'
import AddCustomAppIcon from '@/public/images/apps/add-custom-app.svg'

export type SafeAppsZeroResultsPlaceholderViewProps = {
  searchQuery: string
  brandName: string
}

export function SafeAppsZeroResultsPlaceholderView({
  searchQuery,
  brandName,
}: SafeAppsZeroResultsPlaceholderViewProps): ReactElement {
  return (
    <PagePlaceholder
      img={<AddCustomAppIcon />}
      text={
        <Typography className="m-4 max-w-[600px] text-[var(--color-primary-light)]">
          No Safe Apps found matching <strong>{searchQuery}</strong>. Connect to dApps that haven&apos;t yet been
          integrated with the {brandName} using WalletConnect.
        </Typography>
      }
    />
  )
}
