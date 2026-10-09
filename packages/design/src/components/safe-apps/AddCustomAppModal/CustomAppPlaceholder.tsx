import classNames from 'classnames'

import SafeAppIcon from '@safe-global/design/assets/images/apps/apps-icon.svg'
import { Typography } from '@safe-global/design/components/ui/typography'
import { cn } from '@safe-global/design/utils/cn'

import css from '@safe-global/design/components/safe-apps/AddCustomAppModal/styles.module.css'

type CustomAppPlaceholderProps = {
  error?: string
}

const CustomAppPlaceholder = ({ error = '' }: CustomAppPlaceholderProps) => {
  return (
    <div className={css.customAppPlaceholderContainer}>
      <SafeAppIcon
        className={classNames({
          [css.customAppPlaceholderIconError]: error,
          [css.customAppPlaceholderIconDefault]: !error,
        })}
      />
      <Typography
        className={cn('ml-4', error ? 'text-[var(--color-error-main)]' : 'text-[var(--color-text-secondary)]')}
      >
        {error || 'Safe App card'}
      </Typography>
    </div>
  )
}

export default CustomAppPlaceholder
