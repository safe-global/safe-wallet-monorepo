import { Typography } from '@/components/ui/typography'

import css from './styles.module.css'
import classNames from 'classnames'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export const SpaceSummary = ({
  name,
  numberOfAccounts,
  numberOfMembers,
  isCompact = false,
}: {
  name: string
  numberOfAccounts: number
  numberOfMembers: number
  isCompact?: boolean
}) => {
  return (
    <div className={css.spaceInfo}>
      <Typography variant="paragraph-bold" data-testid="org-name">
        {name}
      </Typography>

      <div className={classNames('flex flex-row items-center gap-2', isCompact ? 'mt-0' : 'mt-0.5')}>
        <Typography variant="paragraph-mini" color="muted">
          {numberOfAccounts} Account{maybePlural(numberOfAccounts)}
        </Typography>

        <div className={css.dot} />

        <Typography variant="paragraph-mini" color="muted">
          {numberOfMembers} Member{maybePlural(numberOfMembers)}
        </Typography>
      </div>
    </div>
  )
}
