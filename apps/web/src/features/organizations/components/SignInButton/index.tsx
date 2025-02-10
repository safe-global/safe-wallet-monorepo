import { useSiwe } from '@/services/siwe/useSiwe'
import { Button } from '@mui/material'

const SignInButton = () => {
  const { signIn } = useSiwe()

  const handleSignIn = async () => {
    try {
      await signIn()
      // TODO: get or create user on sign in
    } catch (error) {
      // TODO: handle error
    }
  }

  return (
    <Button onClick={handleSignIn} variant="contained">
      Sign in
    </Button>
  )
}

export default SignInButton
