import { BRAND_NAME } from '@/config/constants'
import { SafeAppsZeroResultsPlaceholderView } from '@views/components/safe-apps/SafeAppsZeroResultsPlaceholder/SafeAppsZeroResultsPlaceholderView'

const SafeAppsZeroResultsPlaceholder = ({ searchQuery }: { searchQuery: string }) => {
  return <SafeAppsZeroResultsPlaceholderView searchQuery={searchQuery} brandName={BRAND_NAME} />
}

export default SafeAppsZeroResultsPlaceholder
