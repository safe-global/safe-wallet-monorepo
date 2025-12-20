import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { ShellRoutes } from '@/config/routes'

/**
 * Root page - redirects to welcome
 */
export default function IndexPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace(ShellRoutes.welcome.index)
  }, [router])

  return null
}
