import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import css from '../Dashboard/styles.module.css'
import SignInOptions from '../SignInOptions'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'

interface SignedOutStateProps {
  afterSignIn?: () => void
  redirectLoading?: boolean
}

const SignedOutState = ({ afterSignIn, redirectLoading = false }: SignedOutStateProps) => {
  const isOidcDisabled = useHasFeature(FEATURES.OIDC_AUTH) === false
  const isDarkMode = useDarkMode()

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className={css.content}>
        <div className={cn('text-center', css.contentWrapper)}>
          <div className={css.contentInner}>
            <Typography variant="paragraph-bold" className="mb-4">
              Sign in to see content
            </Typography>

            <Typography color="muted" className="mb-4">
              To view and interact with Workspaces, you need to sign in with the wallet, that is a member of the
              Workspace
              {!isOidcDisabled && ', or sign in with email'}. Sign in to continue.
            </Typography>

            <SignInOptions afterSignIn={afterSignIn ?? (() => {})} redirectLoading={redirectLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignedOutState
