import type { Account } from '@web3-onboard/hw-common'
import type { StoredAccount } from './types'

const TREZOR_STORAGE_KEY = 'trezor_last_account'

export function loadStoredAccount(): StoredAccount | null {
  try {
    const raw = localStorage.getItem(TREZOR_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredAccount) : null
  } catch {
    return null
  }
}

export function saveStoredAccount(account: Account, chainId: string): void {
  try {
    localStorage.setItem(
      TREZOR_STORAGE_KEY,
      JSON.stringify({ address: account.address, derivationPath: account.derivationPath ?? '', chainId }),
    )
  } catch {
    // Ignore — localStorage may be unavailable (SSR, private browsing, storage full)
  }
}

export function clearStoredAccount(): void {
  try {
    localStorage.removeItem(TREZOR_STORAGE_KEY)
  } catch {
    // Ignore
  }
}
