import { filterInternalCategories } from '@/components/safe-apps/utils'
import { SafeAppTagsView } from '@views/components/safe-apps/SafeAppTags/SafeAppTagsView'

type SafeAppTagsProps = {
  tags: string[]
  compact?: boolean
}

const SafeAppTags = ({ tags = [], compact }: SafeAppTagsProps) => {
  const displayedTags = filterInternalCategories(tags)

  return <SafeAppTagsView tags={displayedTags} compact={compact} />
}

export default SafeAppTags
