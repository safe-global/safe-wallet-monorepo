import { useEffect, useState } from 'react'
import { formatEther, toHex } from 'viem'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import type { TokenBalance } from '@safe-global/safe-apps-sdk'
import { isNativeToken, tokenToTx } from '../utils/transfers'

/** The estimated fiat cost of transferring `item`, or 0 while unknown. */
export function useTransferCost(item: TokenBalance, gasPrice: bigint, nativeFiatPrice: number): number {
  const { sdk, safe } = useSafeAppsSDK()
  const [cost, setCost] = useState(0)

  useEffect(() => {
    if (gasPrice === 0n || nativeFiatPrice === 0) return

    const tx = tokenToTx(safe.safeAddress, item)
    sdk.eth
      .getEstimateGas({
        ...tx,
        value: isNativeToken(item) ? toHex(BigInt(tx.value)) : undefined,
        from: safe.safeAddress,
      })
      .then((gas) => setCost(Number(formatEther(gasPrice * BigInt(gas))) * nativeFiatPrice))
      .catch((error: Error) => console.warn(`Could not estimate the transfer of ${item.tokenInfo.symbol}`, error))
  }, [sdk, safe.safeAddress, item, gasPrice, nativeFiatPrice])

  return cost
}
