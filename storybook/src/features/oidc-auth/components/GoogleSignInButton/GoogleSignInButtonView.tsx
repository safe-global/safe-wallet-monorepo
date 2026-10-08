import GoogleIcon from '@/public/images/common/google.svg'
import { OidcSignInButtonView } from '@views/features/oidc-auth/components/OidcSignInButton/OidcSignInButtonView'

export type GoogleSignInButtonViewProps = {
  onClick: () => void
}

export const GoogleSignInButtonView = ({ onClick }: GoogleSignInButtonViewProps) => (
  <OidcSignInButtonView
    label="Continue with Google"
    icon={<GoogleIcon />}
    testId="google-login-btn"
    onClick={onClick}
  />
)
