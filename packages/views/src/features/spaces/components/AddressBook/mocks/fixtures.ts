/**
 * Story fixtures for the workspace address book: a fictional company, "Lumen Labs", with four
 * workspace Safes, their signers, the DeFi contracts they use, vendors and contractors. Contract
 * addresses are the real mainnet deployments; every person, vendor and Safe is made up.
 */
import type { ImportReviewRow } from '../dialogs/ImportReview'
import type { AddressBookContact, ChainInfo, SuggestedContact } from '../types'

const logo = (chainId: string) => `https://safe-transaction-assets.safe.global/chains/${chainId}/chain_logo.png`

export const CHAINS = {
  ethereum: { chainId: '1', name: 'Ethereum', logoUri: logo('1') },
  optimism: { chainId: '10', name: 'OP Mainnet', logoUri: logo('10') },
  gnosis: { chainId: '100', name: 'Gnosis Chain', logoUri: logo('100') },
  polygon: { chainId: '137', name: 'Polygon', logoUri: logo('137') },
  base: { chainId: '8453', name: 'Base', logoUri: logo('8453') },
  arbitrum: { chainId: '42161', name: 'Arbitrum', logoUri: logo('42161') },
} satisfies Record<string, ChainInfo>

export const ALL_CHAINS: ChainInfo[] = Object.values(CHAINS)

const { ethereum, optimism, gnosis, polygon, base, arbitrum } = CHAINS

export const MEMBERS = {
  maya: 'Maya Chen',
  jonas: 'Jonas Weber',
  priya: 'Priya Raman',
  lena: 'Lena Fischer',
}

export const ADDRESSES = {
  treasury: '0x45c7Fd96d30Ed7aA53371e67aBdA8e48dA7FAD71',
  treasuryLookAlike: '0x45C7E1b2c3D4e5f60718293a4b5c6d7e8F9AAd71',
  payroll: '0x5bf1E5dA2CA960aaD1Ee0c58dCfC5Eac5f350EFf',
  ops: '0x75eBC53EfFAd4C718372C74a05c0a6fcAa0083F7',
  grants: '0x051c891dED564e402FBce2970afA826Ff61502bC',
  maya: '0x7A495Df3A1941C247e2023DaA0Cca7BaCb87Fa65',
  jonas: '0xA3A5a84DBD3e16D1a5B9112eDB183D54d83eFdCD',
  priya: '0xeF36C76871ddf9836E7Cb5b82C033DAA05af9063',
  tom: '0x5d1F5187e8a4Ed1C7250202f5Ee946eCd9FE7feE',
  lena: '0xc30f8D6C17CB22e70d652e6400b19b4CeAB0B152',
  securityCouncil: '0x8f2159581d285052b1442dEb37685De3d7A017c2',
  northwind: '0x2370307bF88498417B4Ab26042bE8b976Ca39B48',
  blueHarbor: '0x9B57036B422B1A318B974fD0b29c9e2ABfa4d402',
  atlas: '0xE2d0cD30155A865a2CE71f8Fb6CE0e8bE52843af',
  otcDesk: '0x7a1Ad70772d6F6Db6F25E213713dA192255Fef98',
  exchangeDeposit: '0x058D2a5bC9AB675eeE2b32D81775DcaAED783953',
  partnerDao: '0x731dbcD82D400C4Df4DA40b1F18AAFFE55E49672',
  lighthouse: '0x9244BDF6c18b8bFd9C1f497FD73396B65a1E54E9',
  kevin: '0xCbE43c9f54C1dEfa1Ef93615CcE1F9A1b5C1b214',
  amara: '0x71b2cBe5574c2F308868Ee14da404eb36e13E9ce',
  sam: '0x712C44E2596dDc25E4Ba5C910511729d83ef1a7b',
  oldVendor: '0x67A5956408c662D8d866aE9Dbb018A64617B77aD',
  hackathon: '0x64831640794E19561517BafaeE6425b16B29e1a3',
  orbit: '0x1103642da9Faf8279318983Ca383e5023d5a5402',
  impostor: '0xdd78E22D8598832D2223FBe6e9e839844CBd29D7',
  // Real mainnet contracts
  universalRouter: '0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af',
  aavePool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
  cowSettlement: '0x9008D19f58AAbD9eD0D60971565AA8510560ab41',
  steth: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  safeToken: '0x5aFE3855358E112B5647B952709E6165e1c1eEEe',
}

const contact = (fields: Partial<AddressBookContact> & Pick<AddressBookContact, 'address' | 'name'>) => ({
  chains: [ethereum],
  signerOf: [],
  tags: [],
  addedBy: MEMBERS.maya,
  ...fields,
})

export const WORKSPACE_CONTACTS: AddressBookContact[] = [
  // Workspace Safes
  contact({
    address: ADDRESSES.treasury,
    name: 'Treasury',
    chains: [ethereum, arbitrum, optimism],
    isWorkspaceSafe: true,
    tags: ['Treasury'],
  }),
  contact({
    address: ADDRESSES.payroll,
    name: 'Payroll',
    chains: [base, ethereum],
    isWorkspaceSafe: true,
    tags: ['Payroll'],
  }),
  contact({
    address: ADDRESSES.ops,
    name: 'Ops multisig',
    chains: [gnosis],
    isWorkspaceSafe: true,
    tags: ['Ops'],
    addedBy: MEMBERS.jonas,
  }),
  contact({
    address: ADDRESSES.grants,
    name: 'Grants program',
    chains: [optimism, arbitrum],
    isWorkspaceSafe: true,
    tags: ['Grants'],
    addedBy: MEMBERS.lena,
  }),

  // Signers
  contact({
    address: ADDRESSES.maya,
    name: 'Maya Chen (CFO)',
    chains: [ethereum, arbitrum, optimism, base],
    signerOf: ['Treasury', 'Payroll', 'Grants program'],
    tags: ['Finance'],
  }),
  contact({
    address: ADDRESSES.jonas,
    name: 'Jonas Weber',
    chains: [ethereum, gnosis],
    signerOf: ['Treasury', 'Ops multisig'],
    tags: [],
    addedBy: MEMBERS.jonas,
  }),
  contact({
    address: ADDRESSES.priya,
    name: 'Priya Raman',
    chains: [base, ethereum],
    signerOf: ['Payroll'],
    tags: ['Finance'],
    addedBy: MEMBERS.priya,
  }),
  contact({
    address: ADDRESSES.tom,
    name: 'Tom Okafor · Ledger',
    signerOf: ['Treasury'],
    tags: ['Hardware wallet'],
    addedBy: MEMBERS.jonas,
  }),
  contact({
    address: ADDRESSES.lena,
    name: 'Lena Fischer',
    chains: [ethereum, gnosis, optimism, arbitrum, base],
    signerOf: ['Ops multisig', 'Grants program', 'Treasury', 'Payroll'],
    tags: ['Ops'],
    addedBy: MEMBERS.lena,
  }),
  contact({
    address: ADDRESSES.securityCouncil,
    name: 'Security council',
    chains: [ethereum, arbitrum],
    signerOf: ['Treasury'],
    tags: ['Security'],
  }),

  // Contracts
  contact({
    address: ADDRESSES.universalRouter,
    name: 'Uniswap Universal Router',
    chains: [ethereum],
    tags: ['DeFi'],
    addedBy: MEMBERS.jonas,
  }),
  contact({
    address: ADDRESSES.aavePool,
    name: 'Aave V3 Pool',
    tags: ['DeFi', 'Lending'],
    addedBy: MEMBERS.jonas,
  }),
  contact({
    address: ADDRESSES.cowSettlement,
    name: 'CoW Protocol settlement',
    chains: [ethereum, gnosis, arbitrum, base],
    tags: ['DeFi'],
    addedBy: MEMBERS.jonas,
  }),
  contact({
    address: ADDRESSES.steth,
    name: 'Lido stETH',
    tags: ['DeFi', 'Staking'],
    addedBy: MEMBERS.priya,
  }),
  contact({
    address: ADDRESSES.usdc,
    name: 'USDC',
    tags: ['Stablecoin'],
    addedBy: MEMBERS.priya,
  }),
  contact({ address: ADDRESSES.safeToken, name: 'SAFE token', addedBy: MEMBERS.lena }),

  // Other Safes
  contact({
    address: ADDRESSES.partnerDao,
    name: 'Partner DAO treasury',
    chains: [optimism],
    tags: ['Partner', 'Grants'],
    addedBy: MEMBERS.lena,
  }),
  contact({
    address: ADDRESSES.lighthouse,
    name: 'Lighthouse Ventures Fund II strategic multisig (Series A lead)',
    chains: [ethereum, base],
    tags: ['Investor'],
  }),

  // Vendors, exchanges, contractors
  contact({
    address: ADDRESSES.northwind,
    name: 'Northwind Design Studio',
    chains: [base],
    tags: ['Vendor', 'Recurring', 'EU'],
    addedBy: MEMBERS.priya,
  }),
  contact({
    address: ADDRESSES.blueHarbor,
    name: 'Blue Harbor Legal',
    tags: ['Vendor', 'Legal', 'US'],
    addedBy: MEMBERS.priya,
  }),
  contact({
    address: ADDRESSES.atlas,
    name: 'Atlas Audits',
    chains: [ethereum, arbitrum],
    tags: ['Vendor', 'Security'],
  }),
  contact({
    address: ADDRESSES.otcDesk,
    name: 'Meridian OTC desk',
    chains: [ethereum, polygon],
    tags: ['Exchange', 'Whitelisted', 'Recurring', 'US'],
    addedBy: MEMBERS.jonas,
  }),
  contact({
    address: ADDRESSES.exchangeDeposit,
    name: 'Exchange deposit (main)',
    chains: [ethereum, base, arbitrum, optimism, polygon],
    tags: ['Exchange'],
    addedBy: MEMBERS.jonas,
  }),
  contact({
    address: ADDRESSES.kevin,
    name: 'Kevin Duarte',
    chains: [base],
    tags: ['Contractor', 'Payroll'],
    addedBy: MEMBERS.priya,
  }),
  contact({
    address: ADDRESSES.amara,
    name: 'Amara Nwosu',
    chains: [base, optimism],
    tags: ['Contractor', 'Payroll', 'EU'],
    addedBy: MEMBERS.priya,
  }),
  contact({ address: ADDRESSES.sam, name: 'Sam Rivera (starts Nov)', chains: [base], tags: ['Payroll'] }),

  // Untagged
  contact({
    address: ADDRESSES.oldVendor,
    name: 'Old vendor wallet',
    tags: ['Vendor'],
    addedBy: MEMBERS.lena,
  }),
  contact({ address: ADDRESSES.hackathon, name: 'Hackathon prize winner', chains: [polygon] }),
]

export const LOCAL_CONTACTS: AddressBookContact[] = [
  contact({
    address: '0xf38760B55A5dCDce6DAf42972D935D2374a57082',
    name: 'My hardware wallet',
    isLocal: true,
    addedBy: undefined,
  }),
  contact({
    address: '0xF7de50884c90E30Eb06d9A3fafd5BBe9DEc0A122',
    name: 'Test deployer',
    chains: [ethereum, base],
    isLocal: true,
    addedBy: undefined,
  }),
  contact({
    address: ADDRESSES.aavePool,
    name: 'Aave pool',
    isLocal: true,
    addedBy: undefined,
  }),
]

/** Signers of the workspace Safes that are not in the book: the Suggested tab today. */
export const SUGGESTED_SIGNERS: SuggestedContact[] = [
  {
    address: '0x60E543e244f513795d6a7fbCf0479A4DBA950a9A',
    chains: [ethereum, arbitrum, optimism],
    suggestedName: 'Treasury signer 4',
    reason: { kind: 'signer', safes: ['Treasury'] },
  },
  {
    address: '0xFf23675C1fc258d5DB60fd1A6259d2209255221D',
    chains: [base, ethereum],
    suggestedName: 'Payroll signer 3',
    reason: { kind: 'signer', safes: ['Payroll'] },
  },
  {
    address: '0x834984C04f21A982f8BfC1f18157087E5B52B21C',
    chains: [gnosis, optimism, arbitrum],
    suggestedName: 'Ops multisig signer 2',
    reason: { kind: 'signer', safes: ['Ops multisig', 'Grants program'] },
  },
  {
    address: '0x19cc57aF6C4bcd078b72522c3ef6B6705c6d1d22',
    chains: [optimism, arbitrum],
    suggestedName: 'Grants program signer 3',
    reason: { kind: 'signer', safes: ['Grants program'] },
  },
]

/** Suggestions with a transaction-count reason. */
export const FREQUENT_SUGGESTIONS: SuggestedContact[] = [
  {
    address: '0xF921Ff74Ae82745576557496E1FD271f47f81310',
    chains: [base],
    suggestedName: 'Frequent recipient 1',
    reason: { kind: 'frequent', transactions: 24 },
  },
  {
    address: '0x50718f37C022885Ab36f03D2951aDD16cDE1a32b',
    chains: [ethereum, arbitrum],
    suggestedName: 'Frequent recipient 2',
    reason: { kind: 'frequent', transactions: 11 },
  },
  {
    address: '0x2Af9edFE200E1E4ec357424596fC4871F21eA7F2',
    chains: [ethereum],
    suggestedName: 'Frequent recipient 3',
    reason: { kind: 'frequent', transactions: 3 },
  },
]

/** One file whose rows hit every import status, most severe first. */
export const IMPORT_REVIEW_ROWS: ImportReviewRow[] = [
  {
    id: 'r8',
    line: 8,
    name: 'Broken row',
    address: '0x1234',
    status: 'invalid',
    reason: 'Not a valid Ethereum address',
    chains: [ethereum],
    tags: [],
    canInclude: false,
    includedByDefault: false,
  },
  {
    id: 'r9',
    line: 9,
    name: 'Orbit Data Co',
    address: ADDRESSES.orbit,
    status: 'duplicate',
    chains: [base],
    tags: [],
    canInclude: false,
    includedByDefault: false,
  },
  {
    id: 'r7',
    line: 7,
    name: 'Treasury (new)',
    address: ADDRESSES.treasuryLookAlike,
    status: 'look-alike',
    existing: { name: 'Treasury', address: ADDRESSES.treasury },
    chains: [ethereum],
    tags: [],
    canInclude: true,
    includedByDefault: false,
  },
  {
    id: 'r6',
    line: 6,
    name: 'Payroll',
    address: ADDRESSES.impostor,
    status: 'same-name-different-address',
    existing: { name: 'Payroll', address: ADDRESSES.payroll },
    chains: [base],
    tags: [],
    canInclude: true,
    includedByDefault: false,
  },
  {
    id: 'r3',
    line: 3,
    name: 'Northwind Studio GmbH',
    address: ADDRESSES.northwind,
    status: 'name-differs',
    existing: { name: 'Northwind Design Studio', address: ADDRESSES.northwind },
    chains: [base],
    tags: ['Vendor', 'Recurring', 'EU'],
    canInclude: true,
    includedByDefault: true,
  },
  {
    id: 'r4',
    line: 4,
    name: 'Blue Harbor Legal',
    address: ADDRESSES.blueHarbor,
    status: 'adds-tags',
    existing: { name: 'Blue Harbor Legal', address: ADDRESSES.blueHarbor },
    chains: [ethereum],
    tags: ['Vendor', 'Legal', 'US', 'Retainer'],
    canInclude: true,
    includedByDefault: true,
  },
  {
    id: 'r5',
    line: 5,
    name: 'Atlas Audits',
    address: ADDRESSES.atlas,
    status: 'adds-chains',
    existing: { name: 'Atlas Audits', address: ADDRESSES.atlas },
    chains: [ethereum, arbitrum, base],
    tags: ['Vendor', 'Security'],
    canInclude: true,
    includedByDefault: true,
  },
  {
    id: 'r2',
    line: 2,
    name: 'Orbit Data Co',
    address: ADDRESSES.orbit,
    status: 'new',
    chains: [ethereum, base],
    tags: ['Vendor'],
    canInclude: true,
    includedByDefault: true,
  },
  {
    id: 'r10',
    line: 10,
    name: 'Aave V3 Pool',
    address: ADDRESSES.aavePool,
    status: 'unchanged',
    existing: { name: 'Aave V3 Pool', address: ADDRESSES.aavePool },
    chains: [ethereum],
    tags: ['DeFi', 'Lending'],
    canInclude: false,
    includedByDefault: false,
  },
]
