// Features that follow the public/ convention. Other code may import them only through their public/ folder.
const PUBLIC_FOLDER_FEATURES = [
  'actions-tray',
  'assets',
  'bridge',
  'counterfactual',
  'feature-flag-overrides',
  'global-search',
  'ledger',
  'multichain',
  'nfts',
  'no-fee-campaign',
  'portfolio',
  'positions',
  'recovery',
  'safe-overview',
  'safe-shield',
  'speedup',
  'support-chat',
  'targeted-features',
  'targeted-outreach',
  'transactions',
  'tx-notes',
  'wallet',
  'walletconnect',
]

export const featurePublicImportPatterns = PUBLIC_FOLDER_FEATURES.map((feature) => ({
  regex: `^@/features/${feature}(/(?!public/).*)?$`,
  message: `Import ${feature} code only from @/features/${feature}/public/. Inside the feature, use relative imports.`,
}))
