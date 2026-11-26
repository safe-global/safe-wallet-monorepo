import { useState } from 'react'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@safe-global/views/utils/cn'
import AuthState from '../AuthState'
import SpaceTransactionHistory from './SpaceTransactionHistory'
import SpaceQueueLoadStatus from './SpaceQueueLoadStatus'
import SpaceTransactionQueue from './SpaceTransactionQueue'

type TransactionsTab = 'pending' | 'history'

export default function SpaceTransactionsPage({ spaceId }: { spaceId: string }) {
  const isDarkMode = useDarkMode()
  const [tab, setTab] = useState<TransactionsTab>('pending')

  return (
    <AuthState spaceId={spaceId}>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
            Transactions
          </Typography>
          {/* Page status beside the title, as in the design. It's about the pending queue only */}
          {tab === 'pending' && <SpaceQueueLoadStatus spaceId={spaceId} />}
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(value as TransactionsTab)}>
          <TabsList variant="underline" className="mb-4">
            <TabsTrigger value="pending" className="cursor-pointer">
              Pending
            </TabsTrigger>
            <TabsTrigger value="history" className="cursor-pointer">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <SpaceTransactionQueue key={spaceId} spaceId={spaceId} />
          </TabsContent>

          <TabsContent value="history">
            <SpaceTransactionHistory spaceId={spaceId} />
          </TabsContent>
        </Tabs>
      </div>
    </AuthState>
  )
}
