import { type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ShellRoutes } from '@/config/routes'

/**
 * Catch-all route for handling dynamic paths
 * Redirects to welcome page if no Safe address is provided
 * Otherwise, the ShellLayout will render the AccountAppFrame
 */
const CatchAllPage = (): ReactElement => {
  const router = useRouter()

  useEffect(() => {
    // If no safe query param, redirect to welcome
    if (!router.query.safe) {
      router.replace(ShellRoutes.welcome.index)
    }
  }, [router])

  // ShellLayout will handle rendering AccountAppFrame when safe param exists
  return <div />
}

export default CatchAllPage
