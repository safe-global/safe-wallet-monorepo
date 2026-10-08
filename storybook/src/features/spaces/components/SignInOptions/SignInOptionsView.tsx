import type { ReactNode } from 'react'

export type SignInButtonSlotProps = {
  buttonStyle: 'walletBtnSecondary'
  buttonText: { connected: string; disconnected: string }
}

export type SignInOptionsViewProps = {
  renderSignInButton: (props: SignInButtonSlotProps) => ReactNode
  /** Set when email/Google sign-in is available. */
  oidcButtons?: ReactNode
}

export const SignInOptionsView = ({ renderSignInButton, oidcButtons }: SignInOptionsViewProps) => (
  <div className="flex w-full flex-col gap-2.5">
    {renderSignInButton({
      buttonStyle: 'walletBtnSecondary',
      buttonText: { connected: 'Continue with', disconnected: 'Connect wallet' },
    })}

    {oidcButtons && (
      <>
        <div className="flex items-center gap-3 py-0.5">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[13px] font-medium tracking-[0.5px] text-muted-foreground">OR</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {oidcButtons}
      </>
    )}
  </div>
)
