import { useSiwe } from '@/services/siwe/useSiwe'
import { useAppDispatch } from '@/store'
import { setAuthenticated } from '@/store/authSlice'
import { Button } from '@mui/material'

const SignInButton = () => {
  const dispatch = useAppDispatch()
  const { signIn } = useSiwe()

  const handleSignIn = async () => {
    try {
      const result = await signIn()

      // Sign in succeeded
      if (result) {
        const oneDayInMs = 24 * 60 * 60 * 1000
        dispatch(setAuthenticated({ sessionExpiresAt: Date.now() + oneDayInMs }))
      }
    } catch (error) {
      // TODO: handle error
      console.log(error)
    }
  }

  return (
    <Button onClick={handleSignIn} variant="contained">
      Sign in
    </Button>
  )
}

export default SignInButton
