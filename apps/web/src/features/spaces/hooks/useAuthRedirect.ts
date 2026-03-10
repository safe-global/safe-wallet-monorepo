import { useEffect } from 'react'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

const useAuthRedirect = () => {
  const router = useRouter()
  const isUserAuthenticated = useAppSelector(isAuthenticated)

  useEffect(() => {
    if (isUserAuthenticated === false) {
      router.push({ pathname: AppRoutes.welcome.spaces })
    }
  }, [isUserAuthenticated, router])
}

export default useAuthRedirect
