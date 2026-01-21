import { BRAND_NAME } from '@/config/constants'

export const SAFE_COMPATIBLE_METHODS = [
  'eth_accounts',
  'net_version',
  'eth_chainId',
  'personal_sign',
  'eth_sign',
  'eth_signTypedData',
  'eth_signTypedData_v4',
  'eth_sendTransaction',
  'eth_blockNumber',
  'eth_getBalance',
  'eth_getCode',
  'eth_getTransactionCount',
  'eth_getStorageAt',
  'eth_getBlockByNumber',
  'eth_getBlockByHash',
  'eth_getTransactionByHash',
  'eth_getTransactionReceipt',
  'eth_estimateGas',
  'eth_call',
  'eth_getLogs',
  'eth_gasPrice',
  'wallet_switchEthereumChain',
  'wallet_sendCalls',
  'wallet_getCallsStatus',
  'wallet_showCallsStatus',
  'wallet_getCapabilities',
  'safe_setSettings',
]

export const SAFE_COMPATIBLE_EVENTS = ['chainChanged', 'accountsChanged']

export const SAFE_WALLET_METADATA = {
  name: BRAND_NAME,
  url: 'https://app.safe.global',
  description: 'Smart contract wallet for Ethereum',
  icons: ['https://app.safe.global/images/logo-round.svg'],
}

export const EIP155 = 'eip155' as const

// Bridges enforcing same address on destination chains
export const BlockedBridges = [
  'app.chainport.io',
  'cbridge.celer.network',
  'www.orbiter.finance',
  'zksync-era.l2scan.co',
  'www.portalbridge.com',
  'wallet.polygon.technology',

  // Unsupported chain bridges
  'bridge.zora.energy',
  'bridge.mantle.xyz',
  'bridge.metis.io',
  'pacific-bridge.manta.network',
  'tokenbridge.rsk.co',
  'canto.io',
  'gateway.boba.network',
  'bttc.bittorrent.com',
  'iotube.org',
  'bridge.telos.net',
  'ultronswap.com',
]

// Bridges that initially select the same address on the destination chain but allow changing it
export const WarnedBridges = [
  'core.app',
  'across.to', // doesn't send their URL in the session proposal
  'app.allbridge.io',
  'app.rhino.fi',
  'bridge.arbitrum.io',
  'bridge.base.org',
  'bridge.linea.build',
  'core.allbridge.io',
  'bungee.exchange',
  'www.carrier.so',
  'app.chainport.io',
  'bridge.gnosischain.com',
  'app.hop.exchange', // doesn't send their URL in the session proposal
  'app.interport.fi',
  'jumper.exchange',
  'www.layerswap.io',
  'meson.fi',
  'satellite.money',
  'stargate.finance',
  'app.squidrouter.com',
  'app.symbiosis.finance',
  'www.synapseprotocol.com',
  'app.thevoyager.io',
  'portal.txsync.io',
  'bridge.wanchain.org',
  'app.xy.finance',
  'scroll.io',
]

export const WarnedBridgeNames = ['Across Bridge', 'Hop']
