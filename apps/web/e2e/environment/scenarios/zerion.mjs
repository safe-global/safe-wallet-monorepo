import { runInLocalService } from './local-service.mjs'
import { createSafe, onChain } from './safe.mjs'

const MAINNET = 1
const USDC = { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 }

/**
 * Makes the local Zerion (infra/mocks/zerion-api.ts) list `rows` for `address`; its Row type documents the fields.
 * Register before the first gateway request for the address: the gateway caches a portfolio for 10 seconds.
 */
export async function registerZerionPositions(env, address, rows) {
  await runInLocalService(
    env,
    'zerion-api',
    ['node', '/mocks/zerion-api.ts', 'register', address],
    JSON.stringify({ rows }),
  )
}

/**
 * A mainnet Safe that Zerion knows. The chain holds only its 1 ETH; Zerion also lists USDC, a trash token and an
 * Aave deposit, so the default token list and the positions can only come from Zerion.
 */
export async function prepareZerionPortfolioScenario(env, owners) {
  const context = await createSafe(onChain(env, MAINNET), owners, {
    ownerAddresses: [owners.owner4.address],
    threshold: 1,
  })
  try {
    await registerZerionPositions(env, context.safeAddress, [
      {
        chainId: '1',
        type: 'wallet',
        token: { address: null, symbol: 'ETH', name: 'Ether', decimals: 18 },
        quantity: '1',
        value: 2000,
        price: 2000,
      },
      { chainId: '1', type: 'wallet', token: USDC, quantity: '250', value: 250, price: 1 },
      {
        chainId: '1',
        type: 'wallet',
        token: { address: '0x000000000000000000000000000000000000dEaD', symbol: 'SCAM', name: 'Scam', decimals: 18 },
        quantity: '1000',
        value: 0,
        price: 0,
        trash: true,
      },
      {
        chainId: '1',
        type: 'deposit',
        token: {
          address: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
          symbol: 'aEthUSDC',
          name: 'Aave Ethereum USDC',
          decimals: 6,
        },
        quantity: '100',
        value: 100,
        price: 1,
        app: { name: 'Aave V3', url: 'https://app.aave.com' },
      },
    ])
    return { safes: { static: { ETH_ZERION_SAFE: `eth:${context.safeAddress}` } } }
  } finally {
    context.provider.destroy()
  }
}
