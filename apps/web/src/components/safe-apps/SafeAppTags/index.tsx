import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'

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
    <Stack
      className={classnames(css.safeAppTagContainer, { [css.compact]: compact })}
      sx={{
        flexDirection: 'row',
        gap: 1,
        flexWrap: 'wrap',
      }}
    >
      {displayedTags.map((tag) => (
        <Chip className={css.safeAppTagLabel} key={tag} label={tag} />
      ))}
    </Stack>
  )
}

export default SafeAppTags
