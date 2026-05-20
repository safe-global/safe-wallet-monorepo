import { useEffect } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import isEmpty from 'lodash/isEmpty'
import local from '@/services/local-storage/local'
import { addedSafesSlice, type AddedSafesState } from '@/store/addedSafesSlice'
import { useHasDefaultChainFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

const IndexPage: NextPage = () => {
  const router = useRouter()
  const { chain } = router.query
  // DISABLE_SPACES_LOGIN is the kill switch for the new flow.
  // Unset/false/undefined → new flow ON → land users on /welcome/spaces.
  // true → legacy mode → fall back to the classic /welcome/accounts entry.
  const isNewFlowActive = useHasDefaultChainFeature(FEATURES.DISABLE_SPACES_LOGIN) !== true

  useEffect(() => {
    if (!router.isReady || router.pathname !== AppRoutes.index) {
      return
    }

    let pathname: string
    if (isNewFlowActive) {
      pathname = AppRoutes.welcome.spaces
    } else {
      // TODO: Replace with useLocalStorage. For now read directly from localstorage so we have value on first render
      const addedSafes = local.getItem<AddedSafesState>(addedSafesSlice.name)
      const hasAddedSafes = addedSafes !== null && !isEmpty(addedSafes)
      pathname = hasAddedSafes ? AppRoutes.welcome.accounts : AppRoutes.welcome.index
    }

    router.replace({
      pathname,
      query: chain ? { chain } : undefined,
    })
  }, [router, chain, isNewFlowActive])

  return <></>
}

export default IndexPage
