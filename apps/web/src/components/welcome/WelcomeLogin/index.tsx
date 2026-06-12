import { AppRoutes } from '@/config/routes'
import { Typography } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import css from './styles.module.css'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import useWallet from '@/hooks/wallets/useWallet'
import Track from '@/components/common/Track'
import WalletLogin from './WalletLogin'
import { useHomeAuth } from './hooks/useHomeAuth'
import { useRouter } from 'next/router'

const WelcomeLogin = () => {
  const wallet = useWallet()
  const router = useRouter()

  const { performAuth, loading } = useHomeAuth({
    onSuccess: () => {
      router.push({ pathname: AppRoutes.welcome.accounts, query: { ...router.query } })
    },
    skipSiwe: true,
  })

  return (
    <div className={css.loginCard} data-testid="welcome-login" style={{ background: '#fff' }}>
      <div className={css.loginContent}>
        <Typography variant="h2" className="mt-12">
          Get started
        </Typography>

        <Typography align="center" className={`mb-4 ${css.loginDescription}`}>
          {wallet
            ? 'Open your existing Safe Accounts or create a new one'
            : 'Connect your wallet to create a Safe Account or watch an existing one'}
        </Typography>

        <div className={css.fullWidth}>
          <Track {...OVERVIEW_EVENTS.OPEN_ONBOARD} label={OVERVIEW_LABELS.welcome_page}>
            <WalletLogin
              onLogin={performAuth}
              onContinue={performAuth}
              fullWidth
              isLoading={loading}
              buttonStyle="walletBtnStatic"
            />
          </Track>
        </div>

        {!wallet && (
          <>
            <div className="my-4 flex w-full items-center gap-4">
              <Separator className="flex-1" />
              <Typography variant="paragraph-mini-bold" color="muted" className="uppercase tracking-wider">
                or
              </Typography>
              <Separator className="flex-1" />
            </div>

            <Link href={AppRoutes.newSafe.load} className={css.watchViewAccountLink}>
              <Button size="sm">Watch any account</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default WelcomeLogin
