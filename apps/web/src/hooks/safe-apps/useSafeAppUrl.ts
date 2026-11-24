import { useRouter } from 'next/router'
import { sanitizeUrl } from '@/utils/url'
import { useEffect, useMemo, useState } from 'react'

const useSafeAppUrl = (): string | undefined => {
  const router = useRouter()
  const [appUrl, setAppUrl] = useState<string | undefined>()

  useEffect(() => {
    if (!router.isReady) {
      return
    }
    setAppUrl(router.query.appUrl?.toString())
  }, [router])

  return useMemo(() => (appUrl ? sanitizeUrl(appUrl) : undefined), [appUrl])
}

export { useSafeAppUrl }
