const STAGING_OWNER_4_ADDRESS = '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED'

// The support file and each spec are separate bundles with their own copy of this module,
// so the values live on the window that they share.
const shared = (globalThis.safeE2eWallets ??= { credentials: {}, defaultOwnerAddress: STAGING_OWNER_4_ADDRESS })

/**
 * The test wallets' private keys and addresses (OWNER_1_PRIVATE_KEY, OWNER_1_WALLET_ADDRESS, ...).
 * A root before hook fills it, so read it in hooks and tests, never at module level.
 */
export const walletCredentials = shared.credentials

export function setWalletCredentials(credentials) {
  for (const key of Object.keys(walletCredentials)) delete walletCredentials[key]
  Object.assign(walletCredentials, credentials)
}

/** Staging OWNER_4, or the scenario's generated OWNER_4 in isolated runs; call it in hooks and tests. */
export const defaultOwnerAddress = () => shared.defaultOwnerAddress

export function setDefaultOwnerAddress(address) {
  shared.defaultOwnerAddress = address
}
