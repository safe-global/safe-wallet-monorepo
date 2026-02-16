import type { ReactElement } from 'react'
import { Plus, UserRound } from 'lucide-react'
import SafeWidget from '@/features/spaces/components/SafeWidget'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup } from '@/components/ui/avatar'

interface AccountNetwork {
  name: string
  logoUrl: string
}

interface Account {
  id: string
  name: string
  address: string
  networks: AccountNetwork[]
  balance: string
  owners: string
  highlighted?: boolean
}

interface AccountsWidgetProps {
  accounts: Account[]
  remainingCount?: number
  onAddAccount?: () => void
  onViewAll?: () => void
}

const getInitial = (name: string): string => name.charAt(0).toUpperCase()

const AccountsWidget = ({ accounts, remainingCount, onAddAccount, onViewAll }: AccountsWidgetProps): ReactElement => {
  return (
    <SafeWidget
      title="Accounts"
      action={
        <Button variant="outline" size="sm" onClick={onAddAccount}>
          <Plus data-icon="inline-start" className="size-4" />
          Add account
        </Button>
      }
    >
      {accounts.map((account) => (
        <SafeWidget.Item
          key={account.id}
          label={account.name}
          info={account.address}
          highlighted={account.highlighted}
          startNode={
            <Avatar>
              <AvatarFallback className="bg-[#f0fdf4] text-sm font-semibold">
                {getInitial(account.name)}
              </AvatarFallback>
            </Avatar>
          }
          featuredNode={
            account.networks.length > 0 ? (
              <AvatarGroup>
                {account.networks.map((network) => (
                  <Avatar key={network.name} size="xs">
                    <AvatarImage src={network.logoUrl} alt={network.name} />
                    <AvatarFallback>{network.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ))}
              </AvatarGroup>
            ) : undefined
          }
          actionNode={
            <>
              <span className="text-sm font-medium text-muted-foreground">{account.balance}</span>
              <Badge variant="secondary">
                <UserRound className="size-3" />
                {account.owners}
              </Badge>
            </>
          }
        />
      ))}
      {remainingCount !== undefined && (
        <SafeWidget.Footer count={remainingCount} text="View all accounts" onClick={onViewAll} />
      )}
    </SafeWidget>
  )
}

export { AccountsWidget }
export type { AccountsWidgetProps, Account, AccountNetwork }
export default AccountsWidget
