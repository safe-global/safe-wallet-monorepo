import { Typography } from '@/components/ui/typography'
import PagePlaceholder from '@/components/common/PagePlaceholder'
import AddCustomAppIcon from '@/public/images/apps/add-custom-app.svg'
import { BRAND_NAME } from '@/config/constants'

const SafeAppsZeroResultsPlaceholder = ({ searchQuery }: { searchQuery: string }) => {
  return (
    <PagePlaceholder
      img={<AddCustomAppIcon />}
      text={
        <Typography className="m-4 max-w-[600px] text-[var(--color-primary-light)]">
          No Safe Apps found matching <strong>{searchQuery}</strong>. Connect to dApps that haven&apos;t yet been
          integrated with the {BRAND_NAME} using WalletConnect.
        </Typography>
      }
    />
  )
}

export default SafeAppsZeroResultsPlaceholder
