import type { ReactElement, ReactNode } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'
import { HypernativeTooltipView } from '@views/features/hypernative/components/HypernativeTooltip/HypernativeTooltipView'

export type HypernativeTooltipProps = {
  children: ReactNode
  title?: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export const HypernativeTooltip = ({ children, title, side }: HypernativeTooltipProps): ReactElement => {
  const isDarkMode = useDarkMode()

  return (
    <HypernativeTooltipView title={title} side={side} isDarkMode={isDarkMode}>
      {children}
    </HypernativeTooltipView>
  )
}
