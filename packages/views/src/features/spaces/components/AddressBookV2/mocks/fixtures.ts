/**
 * Story and test fixtures for the workspace address book: a fictional company, "Lumen Labs".
 * Contract addresses are the real mainnet deployments; every person, vendor and Safe is made up.
 */
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import type { AddressBookContact } from '../types'

const logo = (chainId: string) => `https://safe-transaction-assets.safe.global/chains/${chainId}/chain_logo.png`

export const CHAINS = {
  ethereum: { chainId: '1', chainName: 'Ethereum', chainLogoUri: logo('1'), shortName: 'eth' },
  optimism: { chainId: '10', chainName: 'OP Mainnet', chainLogoUri: logo('10'), shortName: 'oeth' },
  gnosis: { chainId: '100', chainName: 'Gnosis Chain', chainLogoUri: logo('100'), shortName: 'gno' },
  polygon: { chainId: '137', chainName: 'Polygon', chainLogoUri: logo('137'), shortName: 'matic' },
  base: { chainId: '8453', chainName: 'Base', chainLogoUri: logo('8453'), shortName: 'base' },
  arbitrum: { chainId: '42161', chainName: 'Arbitrum', chainLogoUri: logo('42161'), shortName: 'arb1' },
} satisfies Record<string, ChainInfo>

export const ALL_CHAINS: ChainInfo[] = Object.values(CHAINS)

const { ethereum, optimism, gnosis, base, arbitrum } = CHAINS

export const MEMBERS = {
  maya: 'Maya Chen',
  jonas: 'Jonas Weber',
  lena: 'Lena Fischer',
}

export const ADDRESSES = {
  treasury: '0x45c7Fd96d30Ed7aA53371e67aBdA8e48dA7FAD71',
  treasuryLookAlike: '0x45C7E1b2c3D4e5f60718293a4b5c6d7e8F9AAd71',
  payroll: '0x5bf1E5dA2CA960aaD1Ee0c58dCfC5Eac5f350EFf',
  ops: '0x75eBC53EfFAd4C718372C74a05c0a6fcAa0083F7',
  maya: '0x7A495Df3A1941C247e2023DaA0Cca7BaCb87Fa65',
  jonas: '0xA3A5a84DBD3e16D1a5B9112eDB183D54d83eFdCD',
  northwind: '0x2370307bF88498417B4Ab26042bE8b976Ca39B48',
  atlas: '0xE2d0cD30155A865a2CE71f8Fb6CE0e8bE52843af',
  lighthouse: '0x9244BDF6c18b8bFd9C1f497FD73396B65a1E54E9',
  hardwareWallet: '0x1103642da9Faf8279318983Ca383e5023d5a5402',
  // Real mainnet contracts
  cowSettlement: '0x9008D19f58AAbD9eD0D60971565AA8510560ab41',
  usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
}

const contact = (fields: Partial<AddressBookContact> & Pick<AddressBookContact, 'address' | 'name'>) => ({
  chains: [ethereum],
  addedBy: MEMBERS.maya,
  ...fields,
})

export const WORKSPACE_CONTACTS: AddressBookContact[] = [
  contact({ address: ADDRESSES.treasury, name: 'Treasury', chains: [ethereum, arbitrum, optimism] }),
  contact({ address: ADDRESSES.payroll, name: 'Payroll', chains: [base, ethereum] }),
  contact({ address: ADDRESSES.ops, name: 'Ops multisig', chains: [gnosis], addedBy: MEMBERS.jonas }),
  contact({ address: ADDRESSES.maya, name: 'Maya Chen (CFO)', chains: [ethereum, arbitrum, optimism, base] }),
  contact({ address: ADDRESSES.jonas, name: 'Jonas Weber', chains: [ethereum, gnosis], addedBy: MEMBERS.lena }),
  contact({ address: ADDRESSES.northwind, name: 'Northwind Logistics', addedBy: MEMBERS.jonas }),
  contact({ address: ADDRESSES.atlas, name: 'Atlas Audits', addedBy: undefined }),
  contact({
    address: ADDRESSES.lighthouse,
    name: 'Lighthouse Ventures Fund II strategic multisig (Series A lead)',
    chains: [ethereum, base],
  }),
  contact({ address: ADDRESSES.cowSettlement, name: 'CoW settlement', chains: [ethereum, gnosis, arbitrum, base] }),
  contact({ address: ADDRESSES.usdc, name: 'USDC', addedBy: MEMBERS.lena }),
]

export const LOCAL_CONTACTS: AddressBookContact[] = [
  { address: ADDRESSES.hardwareWallet, name: 'My hardware wallet', chains: [ethereum, base] },
  { address: ADDRESSES.treasuryLookAlike, name: 'Old treasury', chains: [ethereum] },
  { address: ADDRESSES.treasury, name: 'Treasury', chains: [ethereum], isShared: true },
]
