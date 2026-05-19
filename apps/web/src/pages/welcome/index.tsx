import { useEffect } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'

const Welcome: NextPage = () => {
  const router = useRouter()

  useEffect(() => {
    router.replace({ pathname: AppRoutes.welcome.spaces, query: router.query })
  }, [router])

  return <></>
}

export default Welcome
