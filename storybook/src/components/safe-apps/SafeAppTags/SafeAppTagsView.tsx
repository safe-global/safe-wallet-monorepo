import type { ReactElement } from 'react'
import { Chip } from '@/components/ui/chip'
import css from './styles.module.css'
import classnames from 'classnames'

export type SafeAppTagsViewProps = {
  tags: string[]
  compact?: boolean
}

export function SafeAppTagsView({ tags, compact }: SafeAppTagsViewProps): ReactElement {
  return (
    <div className={classnames('flex flex-row flex-wrap gap-2', css.safeAppTagContainer, { [css.compact]: compact })}>
      {tags.map((tag) => (
        <Chip size="lg" shape="tag" key={tag}>
          {tag}
        </Chip>
      ))}
    </div>
  )
}
