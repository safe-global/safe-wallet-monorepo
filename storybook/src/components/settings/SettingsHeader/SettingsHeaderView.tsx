import type { ReactElement, ReactNode } from 'react'
import css from '@/components/common/PageHeader/styles.module.css'

export type SettingsHeaderViewProps = {
  renderPageHeader: (props: { action: ReactElement }) => ReactNode
  navTabs: ReactNode
}

export const SettingsHeaderView = ({ renderPageHeader, navTabs }: SettingsHeaderViewProps) => {
  return <>{renderPageHeader({ action: <div className={css.navWrapper}>{navTabs}</div> })}</>
}
