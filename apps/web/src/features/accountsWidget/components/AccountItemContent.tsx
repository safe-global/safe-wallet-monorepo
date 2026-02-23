import type { ReactElement, ReactNode } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AccountItem } from '@/features/myAccounts/components/AccountItem'
import type { Account } from '../types'

const getInitial = (name: string): string => name.charAt(0).toUpperCase()

interface AccountItemContentProps {
  account: Account
  children: ReactNode
}

const AccountItemContent = ({ account, children }: AccountItemContentProps): ReactElement => (
  <>
    <div className="flex w-[220px] items-center gap-4">
      <Avatar>
        <AvatarFallback className="bg-[#f0fdf4] text-sm font-semibold">{getInitial(account.name)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-0.5 text-left">
        <span className="text-base leading-6 font-medium text-foreground">{account.name}</span>
        <span className="text-xs leading-4 text-muted-foreground">{account.address}</span>
      </div>
    </div>

    <div className="flex items-center justify-center">
      <AccountItem.ChainBadge safes={account.safes} />
    </div>

    {children}
  </>
)

export { AccountItemContent }
export default AccountItemContent
