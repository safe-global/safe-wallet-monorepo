import { type ReactElement, type ReactNode } from 'react'
import classNames from 'classnames'
import CheckIcon from '@/public/images/common/check.svg'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'

const SuccessMessage = ({ children, className }: { children: ReactNode; className?: string }): ReactElement => {
  return (
    <div className={classNames(css.container, className)}>
      <div className={css.message}>
        <CheckIcon className="size-5 shrink-0 text-[var(--color-success-main)]" />

        <Typography variant="paragraph-small" className="w-full">
          {children}
        </Typography>
      </div>
    </div>
  )
}

export default SuccessMessage
