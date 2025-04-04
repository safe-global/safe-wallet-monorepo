import { id } from 'ethers'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { setUpRolesMod, setUpRoles, applyAllowances } from 'zodiac-roles-sdk'
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { Allowance, Permission } from 'zodiac-roles-sdk'

import { SwapperRoleContracts } from './constants'
import {
  allowErc20Approve,
  allowWrappingNativeTokens,
  allowCreatingOrders,
  allowUnwrappingNativeTokens,
} from './permissions'
import { createAllowanceKey } from './allowances'

export const SWAPPER_ROLE_KEY = 'SafeSwapperRole'

const SafeInterface = Safe__factory.createInterface()

function isSupportChain(chainId: string): chainId is keyof typeof SwapperRoleContracts {
  return chainId in SwapperRoleContracts
}

export async function enableSwapper(
  safe: SafeInfo,
  members: Array<`0x${string}`>,
  config: Array<{
    token: `0x${string}`
    amount: bigint
    type: 'sell' | 'buy'
    periodInSeconds: number
  }>,
): Promise<Array<MetaTransactionData>> {
  if (!isSupportChain(safe.chainId)) {
    throw new Error('Unsupported chain')
  }

  const transactions = setUpRolesMod({
    avatar: safe.address.value as `0x${string}`,
    saltNonce: id(SWAPPER_ROLE_KEY + Date.now()) as `0x${string}`,
  })

  const enableModuleFragment = SafeInterface.getFunction('enableModule')!
  const enableModule = transactions.find((transaction) => {
    return transaction.data.startsWith(enableModuleFragment.selector)
  })

  if (!enableModule) {
    throw new Error('No enableModule not found')
  }

  const [rolesModifierAddress] = SafeInterface.decodeFunctionData('enableModule', enableModule.data)

  const permissions: Array<Permission> = []

  const { weth } = SwapperRoleContracts[safe.chainId]

  // Allow ERC-20 approve for CowSwap on WETH
  permissions.push(...allowErc20Approve([weth], [SwapperRoleContracts[safe.chainId].cowSwap.gpv2VaultRelayer]))

  // Allow wrapping of WETH
  permissions.push(allowWrappingNativeTokens(weth))

  // Allow unwrapping of WETH
  permissions.push(allowUnwrappingNativeTokens(weth))

  // Format allowances
  const allowances = config.map<Allowance>((config) => {
    const allowanceKey = createAllowanceKey(config.token, config.type)

    return {
      key: allowanceKey,
      balance: config.amount,
      refill: config.amount,
      maxRefill: config.amount,
      period: BigInt(config.periodInSeconds),
      timestamp: BigInt(0), // TODO: Check if this is correct
    }
  })

  // Apply allowances
  transactions.push(
    ...(
      await applyAllowances(allowances, {
        currentAllowances: [],
        mode: 'extend',
      })
    ).map((allowanceCallData) => ({
      data: allowanceCallData,
      to: rolesModifierAddress,
      value: '0',
    })),
  )

  // Allow creating orders using OrderSigner
  permissions.push(
    allowCreatingOrders(
      safe,
      config.map((config) => {
        const allowanceKey = createAllowanceKey(config.token, config.type)
        return {
          token: config.token,
          amount: config.amount,
          type: config.type,
          allowanceKey,
        }
      }),
    ),
  )

  transactions.push(
    ...setUpRoles({
      address: rolesModifierAddress,
      roles: [
        {
          key: SWAPPER_ROLE_KEY,
          members,
          permissions,
        },
      ],
    }),
  )

  return transactions
}
