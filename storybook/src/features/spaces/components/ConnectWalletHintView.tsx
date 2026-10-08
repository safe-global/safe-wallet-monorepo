import { Wallet } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export type ConnectWalletHintViewProps = {
  testId?: string
  onConnect: () => void
}

export const ConnectWalletHintView = ({ testId, onConnect }: ConnectWalletHintViewProps) => {
  return (
    <Alert variant="default" className="shrink-0 items-center rounded-md py-3">
      <Wallet className="!translate-y-0" />
      <AlertDescription className="flex w-full items-center gap-3 text-foreground">
        <span className="min-w-0 flex-1">Connect a wallet to discover accounts you own</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onConnect}
          data-testid={testId}
          className="shrink-0 hover:bg-muted"
        >
          Connect
        </Button>
      </AlertDescription>
    </Alert>
  )
}
