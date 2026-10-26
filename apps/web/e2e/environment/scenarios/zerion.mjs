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

const ETH = { address: null, symbol: 'ETH', name: 'Ether', decimals: 18 }
const SAFE_TOKEN = {
  address: '0x5aFE3855358E112B5647B952709E6165e1c1eEEe',
  symbol: 'SAFE',
  name: 'Safe Token',
  decimals: 18,
}
const DAI = {
  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  symbol: 'DAI',
  name: 'Dai Stablecoin',
  decimals: 18,
}
const COMP = { address: '0xc00e94Cb662C3520282E6f5717214004A7f26888', symbol: 'COMP', name: 'Compound', decimals: 18 }
const OSETH = {
  address: '0xf1C9acDc66974dFB6dEcB12aA385b9cD01190E38',
  symbol: 'osETH',
  name: 'Staked ETH',
  decimals: 18,
}
const WETH = {
  address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  symbol: 'WETH',
  name: 'Wrapped Ether',
  decimals: 18,
}
const WBTC = { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 }

const SAFENET = { name: 'Safenet', url: 'https://safe.global/staking' }
const COMPOUND = { name: 'Compound V2', url: 'https://app.compound.finance' }
const STAKEWISE = { name: 'StakeWise', url: 'https://app.stakewise.io/' }
const BALANCER = { name: 'Balancer', url: 'https://balancer.fi/' }

/** A mainnet position of `app` in the group `groupId`, named `name` */
const position = (app, name, groupId, type, token, quantity, value) => ({
  chainId: '1',
  type,
  token,
  quantity,
  value,
  price: value / Number(quantity),
  app,
  name,
  groupId,
})

/**
 * A mainnet Safe with the kinds of DeFi positions that Zerion reports for real Safes (taken from a staging Safe): one
 * group with two position types, two groups with one name, a deposit with a loan against it, a two-token pool, and a
 * plain token, which is no position.
 */
export async function prepareZerionPositionsScenario(env, owners) {
  const context = await createSafe(onChain(env, MAINNET), owners, {
    ownerAddresses: [owners.owner4.address],
    threshold: 1,
  })
  try {
    await registerZerionPositions(env, context.safeAddress, [
      { chainId: '1', type: 'wallet', token: ETH, quantity: '1', value: 2000, price: 2000 },
      position(SAFENET, 'SAFE Staking', 'safenet-staking', 'staked', SAFE_TOKEN, '350.495', 35.07),
      position(SAFENET, 'SAFE Staking', 'safenet-staking', 'locked', SAFE_TOKEN, '250.495', 25.06),
      position(COMPOUND, 'Compound V2 Lending', 'compound-dai', 'deposit', DAI, '8.2291', 8.23),
      position(COMPOUND, 'Compound V2 Lending', 'compound-dai', 'reward', COMP, '0.000191', 0.0039),
      position(COMPOUND, 'Compound V2 Lending', 'compound-eth', 'deposit', ETH, '0.002009', 4.69),
      position(COMPOUND, 'Compound V2 Lending', 'compound-eth', 'reward', COMP, '0.0001', 0.002),
      position(STAKEWISE, 'StakeWise Lending', 'stakewise-eth', 'deposit', ETH, '0.0025755', 6.01),
      position(STAKEWISE, 'StakeWise Lending', 'stakewise-eth', 'loan', OSETH, '0.0010024', 2.52),
      position(BALANCER, 'Balancer WBTC/WETH Pool', 'balancer-wbtc-weth', 'deposit', WETH, '0.000617', 1.44),
      position(BALANCER, 'Balancer WBTC/WETH Pool', 'balancer-wbtc-weth', 'deposit', WBTC, '0.00001792', 1.44),
    ])
    return { safes: { static: { ETH_ZERION_POSITIONS_SAFE: `eth:${context.safeAddress}` } } }
  } finally {
    context.provider.destroy()
  }
}
