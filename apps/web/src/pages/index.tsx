import { useEffect } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import isEmpty from 'lodash/isEmpty'
import local from '@/services/local-storage/local'
import { addedSafesSlice, type AddedSafesState } from '@/store/addedSafesSlice'
import { useIsRequireLoginEnabled } from '@/hooks/useIsRequireLoginEnabled'
import SpacesLogin from '@/features/spaces/components/SpacesLogin'

const IndexPage: NextPage = () => {
  const router = useRouter()
  const { chain } = router.query
  const isRequireLoginEnabled = useIsRequireLoginEnabled()

  useEffect(() => {
    if (!router.isReady || router.pathname !== AppRoutes.index) {
      return
    }

    // Only the gate-off (classic) view redirects. The gate-on view renders inline,
    // and the still-loading state (undefined) does nothing.
    if (isRequireLoginEnabled !== false) {
      return
    }

    // TODO: Replace with useLocalStorage. For now read directly from localstorage so we have value on first render
    const addedSafes = local.getItem<AddedSafesState>(addedSafesSlice.name)
    const hasAddedSafes = addedSafes !== null && !isEmpty(addedSafes)
    const pathname = hasAddedSafes ? AppRoutes.welcome.accounts : AppRoutes.welcome.index

    router.replace({
      pathname,
      query: chain ? { chain } : undefined,
    })
  }, [router, chain, isRequireLoginEnabled])

  return isRequireLoginEnabled ? <SpacesLogin /> : <></>
}

export default IndexPage
