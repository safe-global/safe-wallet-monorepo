import type { ComponentType } from 'react'
import { type ReactElement, type ReactNode } from 'react'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Separator } from '@safe-global/views/components/ui/separator'
import InfoIcon from '@safe-global/views/assets/images/notifications/info.svg'
import css from './styles.module.css'

const InfoBox = ({
  title,
  message,
  children,
  icon: Icon = InfoIcon,
}: {
  title: string
  message: ReactNode
  children?: ReactNode
  icon?: ComponentType<{ className?: string }>
}): ReactElement => {
  return (
    <div data-testid="message-infobox" className={css.container}>
      <div className={css.message}>
        <Icon className="size-6 text-[var(--color-info-main)]" />
        <div>
          <Typography variant="paragraph-bold">{title}</Typography>
          <Typography variant="paragraph-small">{message}</Typography>
        </div>
      </div>
      {children && (
        <>
          <Separator className={css.divider} />
          <div>{children}</div>
        </>
      )}
    </div>
  )
}

export default InfoBox
