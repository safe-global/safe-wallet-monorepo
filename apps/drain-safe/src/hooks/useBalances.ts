import { useEffect, useState } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import type { TokenBalance } from '@safe-global/safe-apps-sdk'
import { isTransferable } from '../utils/transfers'

type Balances = {
  assets: TokenBalance[]
  error?: Error
  loaded: boolean
}

export function useBalances(): Balances {
  const { sdk } = useSafeAppsSDK()
  const [balances, setBalances] = useState<Balances>({ assets: [], loaded: false })

  useEffect(() => {
    sdk.safe
      .experimental_getBalances({ currency: 'USD' })
      .then(({ items }) => setBalances({ assets: items.filter(isTransferable), loaded: true }))
      .catch((error: Error) => setBalances({ assets: [], error, loaded: true }))
  }, [sdk])

  return balances
}
