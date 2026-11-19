import GoogleSignInButton from '../GoogleSignInButton'
import EmailSignInButton from '../EmailSignInButton'

const OidcSignInOptions = () => (
  <>
    <div className="flex items-center gap-3 py-0.5">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[13px] font-medium tracking-[0.5px] text-muted-foreground">OR</span>
      <span className="h-px flex-1 bg-border" />
    </div>

    <GoogleSignInButton />
    <EmailSignInButton />
  </>
)

export default OidcSignInOptions
