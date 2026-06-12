import { Chip } from '@/components/ui/chip'

import { filterInternalCategories } from '@/components/safe-apps/utils'
import css from './styles.module.css'
import classnames from 'classnames'

type SafeAppTagsProps = {
  tags: string[]
  compact?: boolean
}

const SafeAppTags = ({ tags = [], compact }: SafeAppTagsProps) => {
  const displayedTags = filterInternalCategories(tags)

  return (
    <div className={classnames('flex flex-row flex-wrap gap-2', css.safeAppTagContainer, { [css.compact]: compact })}>
      {displayedTags.map((tag) => (
        <Chip className={css.safeAppTagLabel} key={tag}>
          {tag}
        </Chip>
      ))}
    </div>
  )
}

export default SafeAppTags
