import type { ReactElement, ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import SafeShieldLogoFull from '@/public/images/safe-shield/safe-shield-logo.svg'
import SafeShieldLogoFullDark from '@/public/images/safe-shield/safe-shield-logo-dark.svg'
import { useDarkMode } from '@/hooks/useDarkMode'

export type HypernativeTooltipProps = {
  children: ReactNode
  title?: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export const HypernativeTooltip = ({ children, title, side }: HypernativeTooltipProps): ReactElement => {
  const isDarkMode = useDarkMode()
  // We use the inverted theme mode here so that it matches the tooltip background color
  const Logo = isDarkMode ? SafeShieldLogoFull : SafeShieldLogoFullDark

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="flex" />}>{children}</TooltipTrigger>
      <TooltipContent side={side}>
        <div className="flex max-w-[230px] flex-col gap-2 px-1 py-2">
          <Logo className="h-[18px] w-[78px]" />
          <Typography variant="paragraph-small">
            {title || 'Hypernative Guardian is actively monitoring this account.'}
          </Typography>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
