import { useEffect, useState } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'

// Rewrite the URL to put the Safe address into the query.
export const _getRedirectUrl = (location: Location): string | undefined => {
  const { pathname, search } = location
  const re = /^\/([^/]+?:0x[0-9a-f]{40})/i
  const [, pathSafe] = pathname.match(re) || []

  if (pathSafe) {
    let newPath = pathname.replace(re, '') || AppRoutes.home
    let newSearch = search ? '&' + search.slice(1) : ''

    // TxId used to be in the path, rewrite it to the query
    if (newPath.startsWith(AppRoutes.transactions.index)) {
      const isStaticPath = Object.values(AppRoutes.transactions).some((route) => route === newPath)
      if (!isStaticPath) {
        const txId = newPath.match(/\/transactions\/([^/]+)/)?.[1]
        newPath = AppRoutes.transactions.tx
        newSearch = `${newSearch}&id=${txId}`
      }
    }

    if (newPath !== pathname) {
      return `${newPath}?safe=${pathSafe}${newSearch}`
    }
  }
}

const Custom404: NextPage = () => {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState<boolean>(true)

  useEffect(() => {
    if (typeof location === 'undefined') return

    const redirectUrl = _getRedirectUrl(location)

    if (redirectUrl) {
      router.replace(redirectUrl)
    } else {
      setIsRedirecting(false)
    }
  }, [router])

  return <main>{!isRedirecting && <h1>404 - Page not found</h1>}</main>
}

export default Custom404
