import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import InfoIcon from '@/public/images/notifications/info.svg'
import css from './styles.module.css'

const Disclaimer = ({
  title,
  subtitle,
  buttonText,
  content,
  onAccept,
}: {
  title: string
  subtitle?: string
  buttonText?: string
  content: ReactNode
  onAccept: () => void
}): ReactElement => {
  return (
    <div className={css.container}>
      <div className="max-w-[500px] rounded-lg bg-[var(--color-background-paper)]">
        <div className="flex flex-col items-center gap-4 border-b border-[var(--color-border-light)] p-[var(--space-3)]">
          {subtitle && <Typography className="text-[var(--color-text-secondary)]">{subtitle}</Typography>}

          <div className={css.iconCircle}>
            <InfoIcon className="size-6" />
          </div>
          <Typography variant="h3" className="font-bold">
            {title}
          </Typography>
          <Typography variant="paragraph-small">{content}</Typography>
          <Separator />
        </div>
        <div className="flex justify-center pt-6 pb-4">
          <Button size="sm" onClick={onAccept}>
            {buttonText || 'Got it'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Disclaimer
