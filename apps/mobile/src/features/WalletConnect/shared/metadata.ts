import type { CoreTypes } from '@walletconnect/types'

export const SAFE_WALLET_METADATA: CoreTypes.Metadata = {
  name: 'Safe{Mobile}',
  description: 'Safe multi-signature wallet',
  url: 'https://app.safe.global',
  icons: ['https://app.safe.global/favicons/favicon.ico'],
  // Returns the user to the dApp after approving a deep-linked session; keep `native` in sync with app.config.ts scheme.
  redirect: {
    native: 'safe://',
    universal: 'https://app.safe.global',
  },
}
