import type { ReactNode } from 'react'

export type CustomSafeAppsViewProps = {
  renderAppList: (props: { title: string }) => ReactNode
}

export const CustomSafeAppsView = ({ renderAppList }: CustomSafeAppsViewProps) => {
  return <main>{renderAppList({ title: 'Custom apps' })}</main>
}
