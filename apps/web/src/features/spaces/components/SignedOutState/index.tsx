import css from '../Dashboard/styles.module.css'
import SignInOptions from '../SignInOptions'
import { OidcAuthFeature } from '@/features/oidc-auth'
import { useLoadFeature } from '@/features/__core__'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'

interface SignedOutStateProps {
  afterSignIn?: () => void
  redirectLoading?: boolean
}

const SignedOutState = ({ afterSignIn, redirectLoading = false }: SignedOutStateProps) => {
  const { $isDisabled } = useLoadFeature(OidcAuthFeature)
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
              To view and interact with workspaces, you need to sign in with the wallet, that is a member of the
              workspace
              {!$isDisabled && ', or sign in with email'}. Sign in to continue.
            </Typography>

            <SignInOptions afterSignIn={afterSignIn ?? (() => {})} redirectLoading={redirectLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignedOutState
