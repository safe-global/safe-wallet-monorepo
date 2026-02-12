import { useCallback } from 'react'
import { UseGuard } from '..'

const useFlowActivationGuard: UseGuard = () => {
  const activationGuard = useCallback(async () => {
    return {
      success: true,
      redirectTo: '/user-flow',
    }
  }, [])

  return {
    activationGuard,
  }
}

export default useFlowActivationGuard
