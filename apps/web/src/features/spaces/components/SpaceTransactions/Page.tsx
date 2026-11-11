import { Typography } from '@safe-global/views/components/ui/typography'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@safe-global/views/utils/cn'
import AuthState from '../AuthState'
import SpaceTransactionQueue from './SpaceTransactionQueue'

export default function SpaceTransactionsPage({ spaceId }: { spaceId: string }) {
  const isDarkMode = useDarkMode()

  return (
    <AuthState spaceId={spaceId}>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <div className="mb-6 flex flex-col gap-6">
          <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
            Transactions
          </Typography>
        </div>

        <Tabs defaultValue="pending">
          <TabsList variant="underline" className="mb-4">
            <TabsTrigger value="pending" className="cursor-pointer">
              Pending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <SpaceTransactionQueue spaceId={spaceId} />
          </TabsContent>
        </Tabs>
      </div>
    </AuthState>
  )
}
