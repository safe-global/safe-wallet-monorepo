import { Button } from '@mui/material'
import { useWeb3 } from '@/hooks/wallets/web3'
import { useSiwe } from '@/features/organizations/hooks/useSiwe'

const SignInButton = () => {
  const provider = useWeb3()
  const { signIn } = useSiwe()

  if (!provider) return null

  const handleSignIn = async () => {
    try {
      await signIn()
    } catch (error) {
      // TODO: handle error
      // logError(ErrorCodes._641, error)
    }
  }

  return (
    <Button onClick={handleSignIn} variant="contained">
      Sign in
    </Button>
  )
}

export default SignInButton
