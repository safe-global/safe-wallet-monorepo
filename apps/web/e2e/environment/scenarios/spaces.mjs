import { Wallet, parseEther, toQuantity } from 'ethers'
import { createSafe, proposeTransaction } from './safe.mjs'
import { waitForQueued, waitUntil } from './indexing.mjs'
import { SEPOLIA } from './chain.mjs'

function gatewaySession(env) {
  let cookie = ''
  return async (path, method = 'GET', body) => {
    const response = await fetch(`${env.SAFE_CGW_BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30_000),
    })
    if (!response.ok) throw new Error(`Spaces setup ${method} ${path} returned ${response.status}`)
    const cookies = response.headers.getSetCookie()
    if (cookies.length) cookie = cookies.map((value) => value.split(';')[0]).join('; ')
    const text = await response.text()
    return text ? JSON.parse(text) : undefined
  }
}

async function signIn(env, request, wallet) {
  const { nonce } = await request('/v1/auth/nonce')
  const origin = new URL(env.SAFE_E2E_WEB_URL || 'http://localhost:8080')
  // EIP-4361 (Sign-In with Ethereum) message
  const message = [
    `${origin.host} wants you to sign in with your Ethereum account:`,
    wallet.address,
    '',
    'Set up local regression data.',
    '',
    `URI: ${origin.origin}`,
    'Version: 1',
    `Chain ID: ${SEPOLIA}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join('\n')
  await request('/v1/auth/verify', 'POST', { message, signature: await wallet.signMessage(message) })
}

// The local billing service stores the Space's plan and announces it to the gateway, which writes the entitlements.
async function subscribe(env, request, space) {
  const billingUrl = `${new URL(env.SAFE_CGW_BASE_URL).origin}/billing`
  const response = await fetch(`${billingUrl}/__test/customers/${space.uuid}/subscriptions`, {
    method: 'POST',
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) throw new Error(`Billing setup for Space ${space.uuid} returned ${response.status}`)
  const { plan } = await request(`/v1/spaces/${space.uuid}/entitlements`)
  if (!plan) throw new Error(`The gateway holds no plan for Space ${space.uuid} after the billing webhook`)
}

// A Safe with three transactions awaiting OWNER_1, so the Space shows them as pending.
async function queueTransfers(context, owners) {
  const hashes = []
  for (const nonce of [0, 1, 2]) {
    const transaction = await context.safe.createTransaction({
      transactions: [{ to: owners.owner1.address, value: '1', data: '0x' }],
      options: { nonce },
    })
    hashes.push((await proposeTransaction(context, transaction)).hash)
  }
  await waitForQueued(context.env, context, hashes)
}

async function fund(context) {
  await context.provider.send('anvil_setBalance', [context.safeAddress, toQuantity(parseEther('0.1'))])
  await waitUntil(context.env, `${context.path}/balances/USD`, (balances) =>
    balances.items?.some(
      (item) => item.tokenInfo.type === 'NATIVE_TOKEN' && item.balance === parseEther('0.1').toString(),
    ),
  )
}

/** Creates the staging Spaces of OWNER_1: one with three Safes and pending transactions, one empty. */
export async function prepareSpacesDashboardScenario(env, owners) {
  const contexts = []
  try {
    for (let index = 0; index < 3; index++) {
      contexts.push(
        await createSafe(env, owners, {
          ownerAddresses: [owners.owner4.address, owners.owner1.address, Wallet.createRandom().address],
          threshold: 2,
        }),
      )
    }
    // The spec clicks the first row, so "Pending tx" gets the lowest address and stays first in either sort order.
    contexts.sort((a, b) => a.safeAddress.toLowerCase().localeCompare(b.safeAddress.toLowerCase()))
    await queueTransfers(contexts[0], owners)
    for (const context of contexts.slice(1)) await fund(context)
  } finally {
    for (const context of contexts) context.provider.destroy()
  }
  const addresses = contexts.map(({ safeAddress }) => safeAddress)
  const pending = addresses[0]
  const request = gatewaySession(env)
  await signIn(env, request, owners.owner1)
  const dashboard = await request('/v1/spaces', 'POST', { name: 'Automation Test Space' })
  const empty = await request('/v1/spaces', 'POST', { name: 'Automation Empty Space' })
  await subscribe(env, request, dashboard)
  await subscribe(env, request, empty)
  await request(`/v1/spaces/${dashboard.uuid}/safes`, 'POST', {
    safes: addresses.map((address) => ({ chainId: String(SEPOLIA), address })),
  })
  await request(`/v1/spaces/${dashboard.uuid}/address-book`, 'PUT', {
    items: addresses.map((address, index) => ({
      name: index === 0 ? 'Pending tx' : `Test account ${index}`,
      address,
      chainIds: [String(SEPOLIA)],
    })),
  })
  const { safes } = await request(`/v1/spaces/${dashboard.uuid}/safes`)
  if (!addresses.every((address) => safes[SEPOLIA]?.includes(address))) {
    throw new Error('The Space does not contain the prepared Safes')
  }
  return {
    safes: { static: {} },
    fixtures: {
      'spaces.dashboardWithSafes': {
        uuid: dashboard.uuid,
        name: dashboard.name,
        safeAccountsPageCount: addresses.length,
        pendingTxAccount: {
          name: 'Pending tx',
          address: pending,
          chainShortName: 'sep',
          safeUrlParam: `sep:${pending}`,
          ownersThreshold: '2/3',
        },
      },
      'spaces.emptyGettingStarted': { uuid: empty.uuid, name: empty.name },
    },
  }
}
