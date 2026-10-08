import type { ReactNode } from 'react'

export type GeneralPageViewProps = {
  children: ReactNode
}

export const GeneralPageView = ({ children }: GeneralPageViewProps) => {
  return <div data-testid="settings-general-page">{children}</div>
}
