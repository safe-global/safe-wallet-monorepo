import type { ReactElement, ReactNode } from 'react'
import css from './styles.module.css'

export type BreadcrumbsViewProps = { children: ReactNode }

export const BreadcrumbsView = ({ children }: BreadcrumbsViewProps): ReactElement => (
  <div className={css.container} data-testid="safe-breadcrumb-container">
    {children}
  </div>
)
