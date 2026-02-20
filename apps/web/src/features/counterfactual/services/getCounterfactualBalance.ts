import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { TokenType } from '@safe-global/store/gateway/types'
import { getWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { BrowserProvider } from 'ethers'

/**
 * Lightweight helper to get the native token balance for a counterfactual safe.
 *
 * This is separated from safeDeployment.ts to avoid pulling in heavy deployment logic
 * when useCounterfactualBalances is imported.
 */
export const getCounterfactualBalance = async (safeAddress: string, provider?: BrowserProvider, chain?: Chain) => {
  let balance: bigint | undefined

  if (!chain) return undefined

  // Fetch balance via the connected wallet.
  // If there is no wallet connected we fetch and cache the balance instead
  if (provider) {
    balance = await provider.getBalance(safeAddress)
  } else {
    balance = (await getWeb3ReadOnly()?.getBalance(safeAddress)) ?? 0n
  }

  return <Balances>{
    fiatTotal: '0',
    items: [
      {
        tokenInfo: {
          type: TokenType.NATIVE_TOKEN,
          address: ZERO_ADDRESS,
          ...chain?.nativeCurrency,
        },
        balance: balance?.toString(),
        fiatBalance: '0',
        fiatConversion: '0',
      },
    ],
  }
}
