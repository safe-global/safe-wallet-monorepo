import type { ReactNode } from 'react'

export type HeaderAccountInfoViewProps = {
  accountInfo: ReactNode
}

export const HeaderAccountInfoView = ({ accountInfo }: HeaderAccountInfoViewProps) => {
  return (
    <div className="flex min-w-0 items-center rounded-lg bg-accent" data-testid="header-account-info">
      {accountInfo}
    </div>
  )
}
