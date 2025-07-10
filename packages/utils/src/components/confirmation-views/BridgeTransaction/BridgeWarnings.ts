export type WarningSeverity = 'warning' | 'error'

export interface BridgeWarning {
  title: string
  description: string
  severity: WarningSeverity
}

export const BridgeWarnings: Record<string, BridgeWarning> = {
  DIFFERENT_SETUP: {
    title: 'Different Safe setup on target chain',
    description:
      'Your Safe exists on the target chain but with a different configuration. Review carefully before proceeding. Funds sent may be inaccessible if the setup is incorrect.',
    severity: 'warning',
  },
  NO_MULTICHAIN_SUPPORT: {
    title: 'Incompatible Safe version',
    description:
      'This Safe account cannot add new networks. You will not be able to claim ownership of the same address on other networks. Funds sent may be inaccessible.',
    severity: 'error',
  },
  SAFE_NOT_DEPLOYED: {
    title: 'No ownership on target chain',
    description:
      'This Safe account is not activated on the target chain. First, create the Safe, execute a test transaction, and then proceed with bridging. Funds sent may be inaccessible.',
    severity: 'warning',
  },
  DIFFERENT_ADDRESS: {
    title: 'Unknown address',
    description:
      'The recipient is not a Safe you own or a known recipient in your address book. If this address is incorrect, your funds could be lost permanently.',
    severity: 'warning',
  },
  UNKNOWN_CHAIN: {
    title: 'The target network is not supported',
    description:
      'app.safe.global does not support the network. Unless you have a wallet deployed there, we recommend not to bridge. Funds sent may be inaccessible.',
    severity: 'error',
  },
} as const
