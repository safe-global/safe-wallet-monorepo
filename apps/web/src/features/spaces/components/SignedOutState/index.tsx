import type { ReactElement } from 'react'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'
import SafeLogo from '@/public/images/logo-no-text.svg'
import SignInOptions from '../SignInOptions'
import OnboardingIllustration from '../OnboardingLayout/Illustration'
import { OidcAuthFeature } from '@/features/oidc-auth'
import { useLoadFeature } from '@/features/__core__'

interface SignedOutStateProps {
  afterSignIn?: () => void
  redirectLoading?: boolean
}

const SignedOutState = ({ afterSignIn, redirectLoading = false }: SignedOutStateProps): ReactElement => {
  const { $isDisabled } = useLoadFeature(OidcAuthFeature)
  const isDarkMode = useDarkMode()

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="flex min-h-[calc(100vh-120px)] w-full items-stretch overflow-hidden rounded-3xl bg-card shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <section className="flex w-full flex-col gap-6 px-8 py-10 sm:px-12 sm:py-14 lg:w-1/2">
          <SafeLogo alt="Safe logo" width={32} height={32} />

          <div className="flex flex-1 flex-col justify-center gap-6">
            <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">Sign in</h1>

            <p className="max-w-[380px] text-sm leading-5 text-muted-foreground">
              To view and interact with spaces, you need to sign in with the wallet that is a member of the space
              {!$isDisabled && ', or sign in with email'}.
            </p>

            <div className="max-w-[380px]">
              <SignInOptions afterSignIn={afterSignIn ?? (() => {})} redirectLoading={redirectLoading} />
            </div>
          </div>
        </section>

        <aside className="relative hidden items-center justify-center overflow-hidden bg-[var(--onboarding-illustration-bg,_#f4f4f4)] lg:flex lg:w-1/2">
          <OnboardingIllustration />
        </aside>
      </div>
    </div>
  )
}

export default SignedOutState
