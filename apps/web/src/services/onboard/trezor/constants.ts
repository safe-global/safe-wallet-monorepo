import type { Asset, BasePath, DerivationPath } from '@web3-onboard/hw-common'

export const TREZOR_LIVE_PATH: DerivationPath = "m/44'/60'"
export const TREZOR_LEGACY_PATH: DerivationPath = "m/44'/60'/0'"

export const DEFAULT_BASE_PATHS: Array<BasePath> = [
  { label: 'Trezor Live', value: TREZOR_LIVE_PATH },
  { label: 'Trezor Legacy', value: TREZOR_LEGACY_PATH },
]

export const DEFAULT_ASSETS: Array<Asset> = [{ label: 'ETH' }]
