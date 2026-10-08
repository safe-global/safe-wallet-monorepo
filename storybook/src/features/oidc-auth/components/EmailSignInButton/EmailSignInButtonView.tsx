import { Mail } from 'lucide-react'
import { OidcSignInButtonView } from '@views/features/oidc-auth/components/OidcSignInButton/OidcSignInButtonView'

export type EmailSignInButtonViewProps = {
  onClick: () => void
}

export const EmailSignInButtonView = ({ onClick }: EmailSignInButtonViewProps) => (
  <OidcSignInButtonView
    label="Continue with email"
    icon={<Mail size={18} />}
    testId="email-login-btn"
    onClick={onClick}
  />
)
