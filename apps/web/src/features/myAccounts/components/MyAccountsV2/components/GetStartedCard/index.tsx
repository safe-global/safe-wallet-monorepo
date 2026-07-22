import { Wallet } from 'lucide-react'
import NextLink from 'next/link'
import SafeMarkIcon from '@/public/images/logo-no-text.svg'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import { useNewSafeNextParam } from '@/components/new-safe/getReturnUrl'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'

/**
 * Signed-out empty state on the welcome "Trusted accounts" tab: invites the
 * user to connect a wallet (create flow) or watch an existing Safe account.
 */
const GetStartedCard = () => {
  const isDarkMode = useDarkMode()
  const connectWallet = useConnectWallet()
  const next = useNewSafeNextParam()

  return (
    <div className={cn('shadcn-scope flex justify-center pt-10', isDarkMode && 'dark')}>
      <div
        data-testid="get-started-card"
        className="w-full max-w-[440px] rounded-2xl bg-card p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]"
      >
        <div className="mx-auto mb-6 flex size-10 items-center justify-center text-foreground">
          <SafeMarkIcon className="size-10" />
        </div>

        <Typography variant="h3" className="text-center">
          Get started
        </Typography>

        <p className="mx-auto mt-6 max-w-[300px] text-center text-[13px] leading-[18px] text-muted-foreground">
          Connect your wallet to create a Safe account or watch an existing one
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <Button size="xl" className="w-full" onClick={connectWallet} data-testid="connect-wallet-button">
            <Wallet className="size-[18px]" />
            Connect wallet
          </Button>

          <div className="flex items-center gap-3 py-0.5">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[13px] font-medium tracking-[0.5px] text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Track {...OVERVIEW_EVENTS.ADD_TO_WATCHLIST} label={OVERVIEW_LABELS.login_page}>
            <Button
              variant="ghost"
              size="xl"
              className="w-full"
              data-testid="watch-account-button"
              render={<NextLink href={{ pathname: AppRoutes.newSafe.load, query: { next } }} />}
            >
              Watch any account
            </Button>
          </Track>
        </div>
      </div>
    </div>
  )
}

export default GetStartedCard
