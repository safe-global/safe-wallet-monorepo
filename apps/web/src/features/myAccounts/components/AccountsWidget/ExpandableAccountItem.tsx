import { useState, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { AccountItem } from '../AccountItem'
import ChainIndicator from '@/components/common/ChainIndicator'
import { cn } from '@/utils/cn'
import { AccountItemContent } from './AccountItemContent'
import type { Account } from './types'

interface ExpandableAccountItemProps {
  account: Account
  loading?: boolean
}

const ExpandableAccountItem = ({ account, loading = false }: ExpandableAccountItemProps): ReactElement => {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between rounded-sm py-4 pl-4 pr-6 cursor-pointer transition-colors hover:bg-muted/50',
          account.highlighted && 'bg-background',
        )}
      >
        <AccountItemContent account={account}>
          <div className="flex items-center gap-2">
            <AccountItem.Balance fiatTotal={account.fiatTotal} isLoading={!account.fiatTotal && loading} />
            <ChevronDown
              className={cn('size-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
            />
          </div>
        </AccountItemContent>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="flex flex-col">
          {account.subAccounts?.map((sub) => (
            <div
              key={sub.chainId}
              role="button"
              tabIndex={0}
              onClick={() => router.push(sub.href)}
              onKeyDown={(e) => e.key === 'Enter' && router.push(sub.href)}
              className="flex items-center justify-between py-3 pl-8 pr-6 cursor-pointer transition-colors hover:bg-muted/50"
            >
              <ChainIndicator chainId={sub.chainId} imageSize={34} fiatValue={sub.fiatTotal} />
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export { ExpandableAccountItem }
