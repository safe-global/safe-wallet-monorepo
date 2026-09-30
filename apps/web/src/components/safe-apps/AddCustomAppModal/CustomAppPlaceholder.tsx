import classNames from 'classnames'

import SafeAppIcon from '@/public/images/apps/apps-icon.svg'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

import css from './styles.module.css'

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
