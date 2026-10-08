import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { SCROLL_AREA } from '@/utils/styles'
import css from './DrawerBody.module.css'

export const DrawerBody = ({ children }: { children?: ReactNode }): ReactElement => (
  <div className={cn(SCROLL_AREA, css.scrollFade, 'flex flex-col px-6 last:pb-6')}>{children}</div>
)
