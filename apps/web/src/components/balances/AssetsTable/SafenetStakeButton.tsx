import type { ReactElement } from 'react'
import { useOpenSafenetStakingApp } from '@/hooks/useOpenSafenetStakingApp'
import { SafenetStakeButtonView } from '@views/components/balances/AssetsTable/SafenetStakeButtonView'

const SafenetStakeButton = (): ReactElement => {
  const { openSafenetStakingApp, isNavigating } = useOpenSafenetStakingApp()

  return <SafenetStakeButtonView onClick={openSafenetStakingApp} isNavigating={isNavigating} />
}

export default SafenetStakeButton
