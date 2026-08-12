import type { ComponentProps, PropsWithChildren, ReactElement } from 'react'
import { ChevronDown } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import LockIcon from '@/public/images/common/lock-small.svg'

/**
 * Displays a disabled analysis group card that shows the children content as a title and a lock icon.
 */
export const AnalysisGroupCardDisabled = ({
  children,
  className,
  ...props
}: PropsWithChildren<ComponentProps<'div'>>): ReactElement => {
  return (
    <div className={`flex flex-row items-center justify-between p-3 ${className ?? ''}`} {...props}>
      <div className="flex flex-row items-center gap-2">
        <LockIcon className="size-4 text-[var(--color-text-disabled)]" />
        <Typography variant="paragraph-small" className="text-[var(--color-text-disabled)]">
          {children}
        </Typography>
      </div>

      <div className="size-4 p-0">
        <ChevronDown className="size-4 text-[var(--color-text-disabled)]" />
      </div>
    </div>
  )
}
