const WALLETCONNECT = 'WalletConnect'
const PRIVATE_KEY_MODULE_LABEL = 'PRIVATE KEY'

/* Check if the wallet is unlocked. */
export const isWalletUnlocked = async (walletName: string): Promise<boolean | undefined> => {
  if ([PRIVATE_KEY_MODULE_LABEL, WALLETCONNECT].includes(walletName)) return true

  const METAMASK_LIKE = ['MetaMask', 'Rabby Wallet', 'Zerion']

  // Only MetaMask exposes a method to check if the wallet is unlocked
  if (METAMASK_LIKE.includes(walletName)) {
    if (typeof window === 'undefined' || !window.ethereum?._metamask) return false
    try {
      return await window.ethereum?._metamask.isUnlocked()
    } catch {
      return false
    }
  }

  return false
}
