import { getAddress } from 'ethers'
import type {
  Account,
  BatchAction,
  Filter,
  Persona,
  Proposal,
  Scenario,
  SettingsChange,
  TransactionKind,
} from '../types'
import { getYou, isSignerOf, isYou } from './personas'

// Synthetic full addresses are used only to render fixture identicons; signer counts are sample configuration.
// An owner nobody named in the address book, so the UI falls back to the address.
export const UNNAMED_SIGNER = '0x65F84b1E9a0c2D7f3B6e8A1c5d9F0e2b4a7CC7B0'
const SIGNER_ADDRESSES: Record<string, string> = {
  Dev: '0x1F3a9c0B7e2D4f6A8b5C3e1D9f7A2c4E6b8D0a12',
  Ana: '0x7C21e4B9a3D6f8C0e2A5b7D9c1E3f5A7b9C0d2E4',
  Max: '0x9A0b2C4d6E8f1A3b5C7d9E0f2A4b6C8d0E1f3A5b',
  Jonas: '0x2B4c6D8e0F1a3B5c7D9e1F2a4B6c8D0e2F3a5B7c',
  Lena: '0x4D6e8F0a2B3c5D7e9F1a2B4c6D8e0F1a3B5c7D9e',
  Sam: '0x5a4d000000000000000000000000000000009e1f',
}
// Signers who aren't workspace members. Reminders can't reach them, so admins invite them instead.
const OUTSIDE_WORKSPACE = [UNNAMED_SIGNER]
export const isWorkspaceMember = (id: string) => !OUTSIDE_WORKSPACE.includes(id)
const fixtureAddress = (seed: string) =>
  `0x${Array.from({ length: 40 }, (_, index) => ((seed.charCodeAt(index % seed.length) * (index + 7)) % 16).toString(16)).join('')}`
export const getSignerIdentity = (id: string) => ({
  name: id.startsWith('0x') ? null : id,
  address: getAddress((id.startsWith('0x') ? id : (SIGNER_ADDRESSES[id] ?? fixtureAddress(id))).toLowerCase()),
})
export const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`
export const getSignerName = (id: string) => {
  const { name, address } = getSignerIdentity(id)
  return name ?? shortAddress(address)
}
export const accounts: Account[] = [
  {
    id: 'treasury',
    name: 'Treasury Main',
    network: 'Ethereum',
    chainId: '1',
    address: '0x8675…c3d2',
    iconAddress: '0x867500000000000000000000000000000000c3d2',
    owners: ['Dev', 'Ana', 'Max', 'Jonas', 'Lena'],
    nextNonce: 42,
    threshold: 3,
  },
  {
    id: 'payroll',
    name: 'Ops Payroll',
    network: 'Base',
    chainId: '8453',
    address: '0x5afe…0b17',
    iconAddress: '0x5afe000000000000000000000000000000000b17',
    owners: ['Dev', 'Ana', 'Max', 'Sam'],
    nextNonce: 17,
    threshold: 2,
  },
  {
    id: 'grants',
    name: 'Grants',
    network: 'Arbitrum',
    chainId: '42161',
    address: '0xAb58…eC9B',
    iconAddress: '0xab5800000000000000000000000000000000ec9b',
    owners: ['Ana', 'Jonas', 'Lena', 'Max', UNNAMED_SIGNER],
    nextNonce: 8,
    threshold: 2,
  },
]
// Many Safes: a protocol team's workspace with 20 Safes. About half have nothing queued.
const MANY_SAFES: [id: string, name: string, network: string, chainId: string, nextNonce: number][] = [
  ['market-making', 'Market Making', 'Ethereum', '1', 212],
  ['grants-committee', 'Grants Committee', 'Optimism', '10', 31],
  ['security-council', 'Security Council', 'Ethereum', '1', 9],
  ['liquidity-ops', 'Liquidity Ops', 'Arbitrum', '42161', 87],
  ['marketing', 'Marketing', 'Base', '8453', 54],
  ['ecosystem-fund', 'Ecosystem Fund', 'Polygon', '137', 23],
  ['bug-bounty', 'Bug Bounty', 'Ethereum', '1', 15],
  ['legal', 'Legal & Compliance', 'Ethereum', '1', 6],
  ['payroll-eu', 'Payroll EU', 'Gnosis', '100', 64],
  ['payroll-us', 'Payroll US', 'Base', '8453', 71],
  ['vesting', 'Vesting Escrow', 'Ethereum', '1', 12],
  ['partnerships', 'Partnerships', 'Arbitrum', '42161', 19],
  ['events', 'Events', 'Polygon', '137', 28],
  ['research', 'Research', 'Optimism', '10', 11],
  ['infra', 'Infra Costs', 'Base', '8453', 140],
  ['dao-reserve', 'DAO Reserve', 'Ethereum', '1', 4],
  ['hot-ops', 'Hot Wallet Ops', 'Arbitrum', '42161', 503],
]
export const manySafesAccounts: Account[] = MANY_SAFES.map(([id, name, network, chainId, nextNonce]) => {
  const address = fixtureAddress(id)
  return {
    id,
    name,
    network,
    chainId,
    address: shortAddress(address),
    iconAddress: address,
    owners: ['Dev', 'Ana', 'Max', 'Jonas'],
    nextNonce,
    threshold: 2,
  }
})
// Protocol team: 50 Safes, one per team and chain. Most chains run the same set of Safes.
const PROTOCOL_CHAINS: [network: string, chainId: string][] = [
  ['Ethereum', '1'],
  ['Arbitrum', '42161'],
  ['Base', '8453'],
  ['Optimism', '10'],
  ['Polygon', '137'],
  ['Gnosis', '100'],
  ['BNB Chain', '56'],
  ['Avalanche', '43114'],
]
const TREASURY_SIGNERS = ['Dev', 'Ana', 'Max', 'Jonas', 'Lena']
const SECURITY_SIGNERS = ['Jonas', 'Lena', 'Max', 'Ana', UNNAMED_SIGNER]
const OPS_SIGNERS = ['Dev', 'Ana', 'Max', 'Lena']
const PROTOCOL_TEAMS: [id: string, name: string, chains: number, owners: string[], threshold: number][] = [
  ['treasury', 'Treasury', 5, TREASURY_SIGNERS, 3],
  ['bridge', 'Bridge escrow', 8, SECURITY_SIGNERS, 3],
  ['security', 'Security council', 3, SECURITY_SIGNERS, 3],
  ['liquidity', 'Liquidity', 8, OPS_SIGNERS, 2],
  ['incentives', 'Incentives', 8, OPS_SIGNERS, 2],
  ['market', 'Market making', 4, OPS_SIGNERS, 2],
  ['grants', 'Grants', 3, OPS_SIGNERS, 2],
  ['vesting', 'Vesting', 3, TREASURY_SIGNERS, 3],
  ['keepers', 'Keepers', 4, OPS_SIGNERS, 2],
  ['payroll', 'Payroll', 2, ['Dev', 'Ana', 'Sam'], 2],
  ['reserve', 'DAO reserve', 2, TREASURY_SIGNERS, 3],
]
const PAYROLL_CHAINS = ['Base', 'Gnosis']
export const protocolAccounts: Account[] = PROTOCOL_TEAMS.flatMap(([team, name, count, owners, threshold]) =>
  PROTOCOL_CHAINS.filter(([network]) => team !== 'payroll' || PAYROLL_CHAINS.includes(network))
    .slice(0, count)
    .map(([network, chainId]) => {
      const id = `${team}-${network.toLowerCase().replace(/ /g, '-')}`
      const address = fixtureAddress(id)
      return {
        id,
        name: `${name} ${network}`,
        network,
        chainId,
        address: shortAddress(address),
        iconAddress: address,
        // Sam signs one Safe only. Omar signs an idle Safe, so nothing waits on him.
        owners:
          team === 'payroll' && network !== 'Base'
            ? owners.filter((owner) => owner !== 'Sam')
            : id === 'reserve-arbitrum'
              ? [...owners, 'Omar']
              : owners,
        nextNonce: 4 + ([...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 180),
        threshold,
      }
    }),
)
// Fleet admin: 20 Safes and 11 signers, with conflicts, untrusted and stale proposals to monitor.
const CHAIN_IDS: Record<string, string> = {
  Ethereum: '1',
  Arbitrum: '42161',
  Base: '8453',
  Optimism: '10',
  Gnosis: '100',
}
const FLEET_SAFES: [name: string, network: string, owners: string[], threshold: number][] = [
  ['Treasury', 'Ethereum', TREASURY_SIGNERS, 3],
  ['Treasury', 'Arbitrum', TREASURY_SIGNERS, 3],
  ['Treasury', 'Base', TREASURY_SIGNERS, 3],
  ['Security council', 'Ethereum', ['Jonas', 'Lena', 'Max', 'Nadia', UNNAMED_SIGNER], 3],
  ['Security council', 'Arbitrum', ['Jonas', 'Lena', 'Max', 'Nadia', UNNAMED_SIGNER], 3],
  ['Bridge escrow', 'Ethereum', ['Jonas', 'Lena', 'Theo', 'Ana'], 3],
  ['Bridge escrow', 'Base', ['Jonas', 'Lena', 'Theo', 'Ana'], 3],
  ['Bridge escrow', 'Optimism', ['Jonas', 'Lena', 'Theo', 'Ana'], 3],
  ['Liquidity', 'Ethereum', ['Dev', 'Ana', 'Max', 'Kai'], 2],
  ['Liquidity', 'Arbitrum', ['Dev', 'Ana', 'Max', 'Kai'], 2],
  ['Liquidity', 'Base', ['Dev', 'Ana', 'Max', 'Kai'], 2],
  ['Market making', 'Ethereum', ['Dev', 'Max', 'Kai', 'Theo'], 2],
  ['Market making', 'Arbitrum', ['Dev', 'Max', 'Kai', 'Theo'], 2],
  ['Grants', 'Optimism', ['Ana', 'Lena', 'Nadia', 'Theo'], 2],
  ['Grants', 'Base', ['Ana', 'Lena', 'Nadia', 'Theo'], 2],
  ['Payroll', 'Base', ['Dev', 'Ana', 'Sam'], 2],
  ['Payroll', 'Gnosis', ['Dev', 'Ana', 'Nadia'], 2],
  ['Vesting', 'Ethereum', ['Dev', 'Max', 'Jonas', 'Lena'], 3],
  ['Keepers', 'Arbitrum', ['Ana', 'Kai', 'Theo'], 2],
  ['DAO reserve', 'Ethereum', ['Dev', 'Ana', 'Max', 'Jonas', 'Omar'], 3],
]
export const fleetAccounts: Account[] = FLEET_SAFES.map(([name, network, owners, threshold]) => {
  const id = `fleet-${name.toLowerCase().replace(/ /g, '-')}-${network.toLowerCase()}`
  const address = fixtureAddress(id)
  return {
    id,
    name: `${name} ${network}`,
    network,
    chainId: CHAIN_IDS[network],
    address: shortAddress(address),
    iconAddress: address,
    owners,
    nextNonce: 3 + ([...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 120),
    threshold,
  }
})
export const knownAccounts = [...accounts, ...manySafesAccounts, ...protocolAccounts, ...fleetAccounts]
export const getScenarioAccounts = (scenario: Scenario) =>
  scenario === 'many-safes'
    ? [...accounts, ...manySafesAccounts]
    : scenario === 'protocol'
      ? protocolAccounts
      : scenario === 'fleet'
        ? fleetAccounts
        : accounts

const queued = (
  account: string,
  nonce: number,
  recipient: string,
  amount: string,
  signers: string[],
  age: string,
  kind: TransactionKind = { type: 'transfer' },
): Proposal => ({ id: `${account}-${nonce}`, account, nonce, recipient, amount, kind, age, signers, eligible: true })
// Threshold is 2 of 4. Two signatures at the next nonce is ready, Dev alone is waiting, a later nonce is blocked.
const manySafesProposals = (): Proposal[] => [
  queued('market-making', 212, 'Litware Markets · 0x51c7…9a02', '1,500,000 USDC', ['Ana', 'Max'], '4h ago'),
  queued('market-making', 213, 'Litware Markets · 0x51c7…9a02', '400 ETH', ['Ana'], '2h ago'),
  queued('security-council', 9, 'Pause guardian', '', ['Jonas'], '1d ago', {
    type: 'settings',
    change: { kind: 'setGuard', guard: 'Pause guardian' },
  }),
  queued('security-council', 10, 'Priya · 0x3e1b…09cd', '', ['Ana', 'Max'], '20h ago', {
    type: 'settings',
    change: { kind: 'addOwner', owner: 'Priya' },
  }),
  queued('liquidity-ops', 87, 'Uniswap v3 · ETH/USDC', '250 ETH', ['Dev'], '3h ago'),
  queued('bug-bounty', 15, 'Whitehat · 0x0b9d…e441', '50,000 USDC', ['Max'], '2d ago'),
  queued('payroll-eu', 64, '22 recipients · Batch transfer', '118,300 EURe', ['Ana', 'Jonas'], '6h ago', {
    type: 'batch',
    actions: generateBatchActions(22, 'Employee'),
  }),
  queued('vesting', 12, 'Investor unlock · 0x77fe…2c10', '2,000,000 SAFE', ['Max', 'Jonas'], '1d ago'),
  queued('partnerships', 19, 'Northwind · 0x2a8c…f3b1', '75,000 USDC', ['Dev'], '5d ago'),
  queued('infra', 140, 'Cloud hosting · 0x9c1e…4d7a', '18,420 USDC', ['Ana'], '8h ago'),
  queued('dao-reserve', 4, 'Aave v3 · Supply', '5,000,000 USDC', ['Jonas'], '3d ago'),
  queued('dao-reserve', 5, 'Lido · Stake', '1,200 ETH', ['Dev'], '2d ago'),
  queued('dao-reserve', 6, 'Woodgrove Custody · 0x6b2d…a9e0', '800 ETH', ['Ana', 'Max'], '1d ago'),
]
export const generateBatchActions = (count: number, recipient = 'Supplier'): BatchAction[] =>
  Array.from({ length: count }, (_, index) => {
    const id = (index + 1).toString(16).padStart(4, '0')
    return {
      method: index % 5 === 4 ? 'approve' : 'transfer',
      to: `${recipient} ${index + 1} · 0x${id}…${id}`,
      value: `${((index % 7) + 1) * 250} USDC`,
    }
  })

// Fleet admin: 6 conflicting proposals at 3 nonces, 3 untrusted, 5 stale for 7+ days.
const fleetProposals = (): Proposal[] => {
  const at = (
    account: string,
    offset: number,
    recipient: string,
    amount: string,
    signers: string[],
    age: string,
    kind?: TransactionKind,
  ) => {
    const id = `fleet-${account}`
    return queued(
      id,
      fleetAccounts.find((item) => item.id === id)!.nextNonce + offset,
      recipient,
      amount,
      signers,
      age,
      kind,
    )
  }
  const reject = (account: string, signers: string[], age: string): Proposal => ({
    ...at(account, 0, 'This Safe account', '0 ETH', signers, age, { type: 'rejection' }),
    id: `fleet-${account}-reject`,
  })
  const untrusted = (tx: Proposal): Proposal => ({ ...tx, proposedBy: `Proposer · ${tx.recipient.split(' · ')[1]}` })
  const noted = (tx: Proposal, text: string, author: string, date: string): Proposal => ({
    ...tx,
    note: { text, author, date },
  })
  const addPriya: TransactionKind = { type: 'settings', change: { kind: 'addOwner', owner: 'Priya' } }
  const priya = 'Priya · 0x3e1b…09cd'
  return [
    {
      ...at('security-council-ethereum', 0, 'Bridge router · 0x4b2a…91fe', '', ['Jonas'], '25m ago', {
        type: 'contract',
        contract: 'Bridge router',
        method: 'pause',
        verified: true,
      }),
      emergency:
        'Monitoring flagged unusual outflows from the bridge router. Pausing stops every bridge transfer until the council unpauses it.',
      note: {
        text: 'Paging the council now. Unpause only after the bridge team signs off.',
        author: 'Jonas',
        date: '21 Oct, 11:50',
      },
    },
    noted(
      at('treasury-ethereum', 0, 'Audit firm · 0x2c4d…8e1f', '180,000 USDC', ['Dev', 'Ana'], '12d ago'),
      'Final audit milestone. Finance approved the invoice.',
      'Ana',
      '14 Oct, 10:05',
    ),
    reject('treasury-ethereum', ['Max'], '1d ago'),
    at('treasury-ethereum', 1, 'Coinbase Prime · 0x7a9b…c210', '2,000 ETH', ['Dev'], '9d ago'),
    at('treasury-base', 0, 'Coinbase Prime · 0x7a9b…c210', '250,000 USDC', ['Ana', 'Max'], '6h ago'),
    noted(
      at('market-making-ethereum', 0, 'Market making Ethereum policy', '', ['Max'], '3d ago', {
        type: 'settings',
        change: { kind: 'changeThreshold', threshold: 1 },
      }),
      'Temporary, for the market maker rotation. We revert it next week.',
      'Max',
      '18 Oct, 16:40',
    ),
    noted(
      reject('market-making-ethereum', ['Kai'], '1d ago'),
      'Rejecting the drop to 1 signature. Too risky for this Safe.',
      'Kai',
      '20 Oct, 10:30',
    ),
    noted(
      at('liquidity-arbitrum', 0, 'CoW Swap · USDC → ETH', '400,000 USDC', ['Dev'], '3h ago', {
        type: 'swap',
        sell: '400,000 USDC',
        buy: '124.8 ETH',
        order: 'market',
        expiry: 'Expires in 20h',
      }),
      'Rebalance before the next incentives epoch.',
      'Dev',
      '21 Oct, 09:15',
    ),
    {
      ...at('liquidity-arbitrum', 0, 'Uniswap v4 · ETH/USDC', '400,000 USDC', ['Ana'], '2h ago'),
      id: 'fleet-liquidity-arbitrum-alt',
    },
    untrusted(at('liquidity-base', 0, 'Unknown · 0x9f3e…77c1', '480,000 USDT', [], '35m ago')),
    untrusted(at('grants-optimism', 0, 'Unknown · 0x1d0c…a3e9', '120,000 USDC', [], '2h ago')),
    untrusted(at('keepers-arbitrum', 0, 'Unknown · 0x5b7e…c0d4', '60 ETH', [], '5h ago')),
    noted(
      at('vesting-ethereum', 0, 'Investor unlock · 0x77fe…2c10', '2,000,000 SAFE', ['Max', 'Jonas'], '15d ago'),
      'Unlock from the vesting schedule.',
      'Max',
      '6 Oct, 12:00',
    ),
    noted(
      at('grants-base', 0, '14 recipients · Batch transfer', '310,000 USDC', ['Ana'], '8d ago', {
        type: 'batch',
        actions: generateBatchActions(14, 'Grantee'),
      }),
      'Grants round 2. Waiting on Lena since last week.',
      'Ana',
      '13 Oct, 15:20',
    ),
    at('bridge-escrow-optimism', 0, priya, '', ['Jonas'], '10d ago', addPriya),
    noted(
      at('bridge-escrow-ethereum', 0, priya, '', ['Jonas', 'Lena', 'Theo'], '1d ago', addPriya),
      'Priya replaces Theo on the bridge escrows. Same change on every chain.',
      'Jonas',
      '20 Oct, 11:00',
    ),
    at('bridge-escrow-base', 0, priya, '', ['Jonas'], '1d ago', addPriya),
    at('security-council-arbitrum', 0, 'Timelock guard', '', ['Jonas'], '2d ago', {
      type: 'settings',
      change: { kind: 'setGuard', guard: 'Timelock guard' },
    }),
    at('liquidity-ethereum', 0, 'Uniswap v4 · ETH/USDC', '1,200 ETH', ['Dev', 'Ana'], '2h ago'),
    at('market-making-arbitrum', 0, 'Litware Markets · 0x51c7…9a02', '1,000,000 USDC', ['Max'], '30m ago'),
    noted(
      at('payroll-base', 0, '31 recipients · Batch transfer', '412,000 USDC', ['Ana'], '4h ago', {
        type: 'batch',
        actions: generateBatchActions(31, 'Employee'),
      }),
      'October payroll. Three new hires this month, please check them.',
      'Ana',
      '21 Oct, 08:30',
    ),
    at('payroll-gnosis', 0, '18 recipients · Batch transfer', '96,500 EURe', ['Dev', 'Ana'], '3h ago', {
      type: 'batch',
      actions: generateBatchActions(18, 'Employee'),
    }),
    // The busiest Safes, each with 5 to 10 transactions queued.
    at('security-council-ethereum', 1, 'Nadia · 0x6d2a…b4f0', '', ['Jonas', 'Lena'], '1d ago', {
      type: 'settings',
      change: { kind: 'removeOwner', owner: 'Nadia' },
    }),
    at('security-council-ethereum', 2, 'Whitehat · 0x0b9d…e441', '50,000 USDC', ['Lena'], '2d ago'),
    at('security-council-ethereum', 3, 'Security council Ethereum policy', '', ['Jonas'], '2d ago', {
      type: 'settings',
      change: { kind: 'changeThreshold', threshold: 4 },
    }),
    at('security-council-ethereum', 4, 'Recovery module', '', ['Max'], '3d ago', {
      type: 'settings',
      change: { kind: 'enableModule', module: 'Recovery module' },
    }),
    at('treasury-ethereum', 2, 'Northwind · 0x2a8c…f3b1', '75,000 USDC', ['Ana'], '2d ago'),
    at('treasury-ethereum', 3, 'CoW Swap · ETH → USDC', '300 ETH', ['Dev'], '1d ago', {
      type: 'swap',
      sell: '300 ETH',
      buy: '958,000 USDC',
      order: 'limit',
      expiry: 'Expires in 3d',
    }),
    at('treasury-ethereum', 4, 'Legal counsel · 0x4e6f…1a2b', '42,000 USDC', ['Max'], '5h ago'),
    at('treasury-ethereum', 5, 'Contoso Ltd · 0x4f2a…c81d', '18,500 USDC', ['Dev', 'Ana'], '2h ago'),
    at('liquidity-arbitrum', 1, 'Camelot · ETH/ARB', '90 ETH', ['Kai'], '1d ago'),
    at('liquidity-arbitrum', 2, 'Uniswap v4 · ARB/USDC', '500,000 ARB', ['Dev'], '20h ago'),
    at('liquidity-arbitrum', 3, 'Merkl · 0x48d1…0f6e', '200,000 ARB', ['Max'], '6h ago'),
    at('liquidity-arbitrum', 4, 'Market making Arbitrum · 0x9d1c…77e0', '1,000,000 USDC', ['Ana'], '1h ago'),
    at('liquidity-ethereum', 1, 'Curve · 3pool', '2,000,000 USDC', ['Dev'], '1d ago'),
    at('liquidity-ethereum', 2, 'Aave v3 · 0x6c2f…a914', '500 ETH', ['Kai'], '20h ago'),
    at('liquidity-ethereum', 3, 'Balancer · wstETH/ETH', '800 ETH', ['Max', 'Ana'], '8h ago'),
    at('liquidity-ethereum', 4, 'Lido · 0x1d4e…7b30', '1,000 ETH', ['Dev'], '4h ago'),
    at('market-making-ethereum', 1, 'Litware Markets · 0x51c7…9a02', '2,500,000 USDC', ['Kai'], '2d ago'),
    at('market-making-ethereum', 2, 'Fabrikam OTC · 0x90ab…12c3', '800 ETH', ['Theo'], '1d ago'),
    at('market-making-ethereum', 3, 'Tailspin Labs · 0x55c1…e3f0', '1,200,000 USDC', ['Dev'], '9h ago'),
    at('vesting-ethereum', 1, 'Advisor unlock · 0x31aa…7c02', '250,000 SAFE', ['Jonas'], '4d ago'),
    at('vesting-ethereum', 2, 'Team unlock · 0x8b2e…0f19', '1,500,000 SAFE', ['Max'], '3d ago'),
    at('vesting-ethereum', 3, 'Vesting escrow · 0x92c4…aa31', '500,000 SAFE', ['Lena', 'Jonas'], '2d ago'),
    at('vesting-ethereum', 4, 'Investor unlock · 0x77fe…2c10', '750,000 SAFE', ['Dev'], '6h ago'),
    at('treasury-base', 1, 'Coinbase Prime · 0x7a9b…c210', '120,000 USDC', ['Jonas'], '5d ago'),
    at('treasury-base', 2, 'Aerodrome · ETH/USDC', '80 ETH', ['Ana', 'Lena'], '2d ago'),
    at('treasury-base', 3, 'Northwind · 0x2a8c…f3b1', '30,000 USDC', ['Dev'], '1d ago'),
    at('treasury-base', 4, 'Morpho · 0x5e81…c2d7', '400,000 USDC', ['Max'], '3h ago'),
    at('payroll-base', 1, 'Contractor · 0x1c9f…77aa', '12,000 USDC', ['Dev'], '3d ago'),
    at('payroll-base', 2, '6 recipients · Batch transfer', '48,000 USDC', ['Sam'], '2d ago', {
      type: 'batch',
      actions: generateBatchActions(6, 'Contractor'),
    }),
    at('payroll-base', 3, 'Benefits provider · 0x6a1d…92e3', '22,400 USDC', ['Ana'], '1d ago'),
    at('payroll-base', 4, 'Contractor · 0x4c7b…10ef', '9,500 USDC', ['Dev', 'Sam'], '4h ago'),
    at('bridge-escrow-ethereum', 1, 'Theo · 0x5d91…a0b7', '', ['Jonas'], '4d ago', {
      type: 'settings',
      change: { kind: 'removeOwner', owner: 'Theo' },
    }),
    at('bridge-escrow-ethereum', 2, 'Bridge router · 0x4b2a…91fe', '5,000,000 USDC', ['Lena'], '2d ago'),
    at('bridge-escrow-ethereum', 3, 'Bridge escrow Ethereum policy', '', ['Ana'], '1d ago', {
      type: 'settings',
      change: { kind: 'changeThreshold', threshold: 2 },
    }),
    at('bridge-escrow-ethereum', 4, 'Bridge router · 0x4b2a…91fe', '1,200 ETH', ['Jonas', 'Theo'], '5h ago'),
    at('payroll-gnosis', 1, 'Contractor · 0x7e2a…3c90', '8,200 EURe', ['Nadia'], '4d ago'),
    at('payroll-gnosis', 2, '9 recipients · Batch transfer', '41,000 EURe', ['Dev'], '2d ago', {
      type: 'batch',
      actions: generateBatchActions(9, 'Employee'),
    }),
    at('payroll-gnosis', 3, 'Benefits provider · 0x6a1d…92e3', '14,300 EURe', ['Ana'], '1d ago'),
    at('payroll-gnosis', 4, 'Contractor · 0x2f8d…b561', '6,750 EURe', ['Nadia', 'Dev'], '2h ago'),
  ]
}

// Protocol team: two emergencies, a signer rotation across the bridge Safes, config changes, untrusted and stale proposals.
const protocolProposals = (): Proposal[] => {
  const at = (
    account: string,
    offset: number,
    recipient: string,
    amount: string,
    signers: string[],
    age: string,
    kind?: TransactionKind,
  ) =>
    queued(
      account,
      protocolAccounts.find((item) => item.id === account)!.nextNonce + offset,
      recipient,
      amount,
      signers,
      age,
      kind,
    )
  const contract = (name: string, method: string): TransactionKind => ({
    type: 'contract',
    contract: name,
    method,
    verified: true,
  })
  const addPriya: TransactionKind = { type: 'settings', change: { kind: 'addOwner', owner: 'Priya' } }
  const priya = 'Priya · 0x3e1b…09cd'
  const untrusted = (tx: Proposal): Proposal => ({ ...tx, proposedBy: `Proposer · ${tx.recipient.split(' · ')[1]}` })
  return [
    {
      ...at(
        'security-ethereum',
        0,
        'Bridge router · 0x4b2a…91fe',
        '',
        ['Jonas'],
        '25m ago',
        contract('Bridge router', 'pause'),
      ),
      emergency:
        'Monitoring flagged unusual outflows from the bridge router. Pausing stops every bridge transfer until the council unpauses it.',
    },
    {
      ...at('bridge-arbitrum', 0, 'USDC · 0x2b7c…e406', '', ['Lena'], '40m ago', contract('USDC', 'approve')),
      emergency:
        'A bridge adapter with an open USDC approval was reported compromised. This sets the approval to 0 so it can no longer move funds.',
    },
    at('bridge-arbitrum', 1, priya, '', ['Jonas'], '1d ago', addPriya),
    at('bridge-ethereum', 0, priya, '', ['Jonas', 'Lena', 'Ana'], '1d ago', addPriya),
    at('bridge-base', 0, priya, '', ['Jonas', 'Lena'], '1d ago', addPriya),
    at('bridge-optimism', 0, priya, '', ['Jonas'], '1d ago', addPriya),
    at('bridge-polygon', 0, priya, '', ['Jonas', 'Ana'], '1d ago', addPriya),
    at('bridge-gnosis', 0, priya, '', ['Jonas'], '1d ago', addPriya),
    at('bridge-bnb-chain', 0, priya, '', ['Jonas', 'Lena', 'Max'], '1d ago', addPriya),
    at('bridge-avalanche', 0, priya, '', ['Jonas'], '1d ago', addPriya),
    at('market-ethereum', 0, 'Market making Ethereum policy', '', ['Max'], '3d ago', {
      type: 'settings',
      change: { kind: 'changeThreshold', threshold: 1 },
    }),
    at('incentives-base', 0, 'Allowance module', '', ['Dev'], '2d ago', {
      type: 'settings',
      change: { kind: 'enableModule', module: 'Allowance module' },
    }),
    at('vesting-ethereum', 0, 'Timelock guard', '', ['Jonas'], '5d ago', {
      type: 'settings',
      change: { kind: 'setGuard', guard: 'Timelock guard' },
    }),
    untrusted(at('liquidity-bnb-chain', 0, 'Unknown · 0x9f3e…77c1', '480,000 USDT', [], '35m ago')),
    // Conflicts: signers reject the untrusted proposal and the threshold drop to 1 at the same nonces.
    {
      ...at('liquidity-bnb-chain', 0, 'This Safe account', '0 ETH', ['Dev'], '20m ago', { type: 'rejection' }),
      id: 'liquidity-bnb-chain-reject',
    },
    {
      ...at('market-ethereum', 0, 'This Safe account', '0 ETH', ['Ana'], '1d ago', { type: 'rejection' }),
      id: 'market-ethereum-reject',
    },
    untrusted(at('grants-ethereum', 0, 'Unknown · 0x1d0c…a3e9', '120,000 USDC', [], '2h ago')),
    at('treasury-ethereum', 0, 'Audit firm · 0x2c4d…8e1f', '180,000 USDC', ['Dev', 'Ana'], '12d ago'),
    at('treasury-ethereum', 1, 'Coinbase Prime · 0x7a9b…c210', '2,000 ETH', ['Dev'], '9d ago'),
    at('reserve-ethereum', 0, 'Treasury Ethereum · 0x8675…c3d2', '5,000,000 USDC', ['Max', 'Jonas'], '15d ago'),
    at('grants-arbitrum', 0, '14 recipients · Batch transfer', '310,000 ARB', ['Ana'], '8d ago', {
      type: 'batch',
      actions: generateBatchActions(14, 'Grantee'),
    }),
    at('keepers-optimism', 0, 'Gelato · 0x3a1f…bb02', '2 ETH', ['Ana'], '11d ago'),
    at('treasury-arbitrum', 0, 'CoW Swap · USDC → ETH', '400,000 USDC', ['Dev'], '3h ago', {
      type: 'swap',
      sell: '400,000 USDC',
      buy: '124.8 ETH',
      order: 'market',
      expiry: 'Expires in 20h',
    }),
    at('treasury-base', 0, 'Coinbase Prime · 0x7a9b…c210', '250,000 USDC', ['Ana', 'Max'], '6h ago'),
    at('liquidity-ethereum', 0, 'Uniswap v4 · ETH/USDC', '1,200 ETH', ['Dev', 'Ana'], '2h ago'),
    at('liquidity-arbitrum', 0, 'Uniswap v4 · ETH/USDC', '800 ETH', ['Ana', 'Max'], '4h ago'),
    at('liquidity-base', 0, 'Aerodrome · ETH/USDC', '300 ETH', ['Dev'], '1h ago'),
    at('liquidity-optimism', 0, 'Velodrome · ETH/OP', '150 ETH', ['Max'], '5h ago'),
    at('incentives-arbitrum', 0, '40 recipients · Batch transfer', '900,000 ARB', ['Ana'], '1d ago', {
      type: 'batch',
      actions: generateBatchActions(40, 'Liquidity provider'),
    }),
    at('incentives-optimism', 0, '25 recipients · Batch transfer', '500,000 OP', ['Dev', 'Max'], '20h ago', {
      type: 'batch',
      actions: generateBatchActions(25, 'Liquidity provider'),
    }),
    at('incentives-polygon', 0, 'Merkl · 0x48d1…0f6e', '200,000 POL', ['Lena'], '7h ago'),
    at('market-arbitrum', 0, 'Litware Markets · 0x51c7…9a02', '3,000,000 USDC', ['Ana', 'Max'], '1d ago'),
    at('market-base', 0, 'Litware Markets · 0x51c7…9a02', '1,000,000 USDC', ['Dev'], '30m ago'),
    at('payroll-base', 0, '31 recipients · Batch transfer', '412,000 USDC', ['Ana'], '4h ago', {
      type: 'batch',
      actions: generateBatchActions(31, 'Employee'),
    }),
    at('payroll-gnosis', 0, '18 recipients · Batch transfer', '96,500 EURe', ['Dev', 'Ana'], '3h ago', {
      type: 'batch',
      actions: generateBatchActions(18, 'Employee'),
    }),
    at('keepers-ethereum', 0, 'Chainlink Automation · 0x6593…a2b1', '5,000 LINK', ['Max'], '1d ago'),
    at('vesting-arbitrum', 0, 'Investor unlock · 0x77fe…2c10', '1,000,000 ARB', ['Max', 'Jonas'], '2d ago'),
    at('grants-base', 0, 'Northwind · 0x2a8c…f3b1', '75,000 USDC', ['Dev', 'Lena'], '6h ago'),
  ]
}
const proposals: Proposal[] = [
  {
    id: 'payroll-17',
    account: 'payroll',
    nonce: 17,
    recipient: '14 recipients · Batch transfer',
    amount: '32,400 USDC',
    kind: { type: 'batch', actions: generateBatchActions(14, 'Employee') },
    age: '5h ago',
    signers: ['Ana', 'Max'],
    eligible: true,
    note: {
      text: 'October salaries. Please review all 14 recipients.',
      author: 'Ana',
      date: '8 Oct, 10:30',
    },
  },
  {
    id: 'treasury-42',
    account: 'treasury',
    nonce: 42,
    recipient: 'Globex Payroll · 0x1c9f…77aa',
    amount: '48.5 ETH',
    fiat: '$155,200',
    kind: { type: 'transfer' },
    age: '3d ago',
    signers: ['Ana', 'Max'],
    eligible: true,
    note: {
      text: 'September contractor payouts. Confirm the recipient and amount against the invoice.',
      author: 'Ana',
      date: '6 Oct, 09:15',
    },
  },
  {
    id: 'treasury-43',
    account: 'treasury',
    nonce: 43,
    recipient: 'Priya · 0x3e1b…09cd',
    amount: '',
    kind: { type: 'settings', change: { kind: 'addOwner', owner: 'Priya' } },
    age: '1d ago',
    signers: ['Ana', 'Max', 'Dev'],
    eligible: true,
    note: { text: 'Add Priya from Operations. Threshold stays at 3 signatures.', author: 'Dev', date: '8 Oct, 11:00' },
  },
  {
    id: 'treasury-44',
    account: 'treasury',
    nonce: 44,
    recipient: 'Contoso Ltd · 0x4f2a…c81e',
    amount: '125,000 USDC',
    kind: { type: 'transfer' },
    age: '6h ago',
    signers: ['Ana'],
    eligible: true,
    note: { text: 'Q4 vendor payment.', author: 'Lena', date: '8 Oct, 14:20' },
  },
  {
    id: 'payroll-18',
    account: 'payroll',
    nonce: 18,
    recipient: 'Fabrikam · 0x90ab…12ef',
    amount: '1,200 USDC',
    kind: { type: 'transfer' },
    age: '1h ago',
    signers: [],
    eligible: true,
  },
  {
    id: 'grants-8',
    account: 'grants',
    nonce: 8,
    recipient: 'Tailspin Labs · 0x55c1…e3f0',
    amount: '25,000 ARB',
    fiat: '$20,000',
    kind: { type: 'transfer' },
    age: '4d ago',
    signers: ['Jonas'],
    eligible: false,
    note: {
      text: 'Grant milestone 2. Deliverables reviewed.',
      author: 'Lena',
      date: '5 Oct, 16:00',
    },
  },
]
// A realistic mix: decoder gaps, delegate calls, competing sends and an unknown bridge network.
const realisticProposals: Proposal[] = [
  {
    id: 'treasury-45',
    account: 'treasury',
    nonce: 45,
    recipient: 'LI.FI Diamond · 0x1231…deae',
    amount: '0.04 ETH',
    kind: { type: 'bridge', sell: '0.04 ETH', destinationChainId: '999', fees: '0.0004 ETH' },
    age: '2h ago',
    signers: ['Ana'],
    eligible: true,
  },
  {
    id: 'treasury-46',
    account: 'treasury',
    nonce: 46,
    recipient: 'Uniswap Universal Router · 0x66a9…e7af',
    amount: '1.2 ETH',
    kind: {
      type: 'contract',
      contract: 'Uniswap Universal Router',
      method: 'execute',
      verified: true,
      steps: ['Wrap 1.2 ETH', 'Swap 1.2 WETH for 4,180 USDC', 'Sweep USDC to this Safe'],
    },
    age: '2h ago',
    signers: ['Max'],
    eligible: true,
  },
  {
    id: 'treasury-47',
    account: 'treasury',
    nonce: 47,
    recipient: 'Exchange deposit · 0x2910…54fa',
    amount: '10 ETH',
    fiat: '$32,000',
    kind: { type: 'transfer' },
    age: '1h ago',
    signers: ['Ana', 'Max'],
    eligible: true,
  },
  {
    id: 'treasury-47-alt',
    account: 'treasury',
    nonce: 47,
    recipient: 'Exchange deposit · 0x2910…54fa',
    amount: '1 ETH',
    fiat: '$3,200',
    kind: { type: 'transfer' },
    age: '40m ago',
    signers: ['Lena'],
    eligible: true,
  },
  {
    id: 'treasury-48',
    account: 'treasury',
    nonce: 48,
    recipient: 'Zodiac Roles · 0x9646…7a21',
    amount: '',
    kind: { type: 'settings', change: { kind: 'enableModule', module: 'Zodiac Roles' } },
    age: '30m ago',
    signers: ['Jonas'],
    eligible: true,
  },
  {
    id: 'payroll-19',
    account: 'payroll',
    nonce: 19,
    recipient: 'MultiSendCallOnly · 0x40a2…3a1e',
    amount: '',
    kind: {
      type: 'batch',
      delegateCall: 'trusted',
      actions: [
        { method: 'approve', to: 'Dai · 0x6b17…1d0f', value: '5,000 DAI' },
        { method: 'setPreSignature', to: 'GPv2Settlement · 0x9008…ab41' },
      ],
    },
    age: '3h ago',
    signers: ['Ana'],
    eligible: true,
  },
  {
    id: 'payroll-20',
    account: 'payroll',
    nonce: 20,
    recipient: 'Treasury Main · 0x8675…c3d2',
    amount: '',
    kind: { type: 'nested', parentSafe: 'Treasury Main', parentNonce: 44 },
    age: '20m ago',
    signers: [],
    eligible: true,
  },
  {
    id: 'grants-9',
    account: 'grants',
    nonce: 9,
    recipient: 'CoW Swap · ARB → USDC',
    amount: '10,000 ARB',
    kind: {
      type: 'swap',
      sell: '10,000 ARB',
      buy: '7,950 USDC',
      order: 'limit',
      expiry: 'Expired 2h ago',
      expired: true,
    },
    age: '2d ago',
    signers: [UNNAMED_SIGNER],
    eligible: true,
  },
  {
    id: 'grants-10',
    account: 'grants',
    nonce: 10,
    recipient: 'Grants · 0xAb58…eC9B',
    amount: '0.1 ETH',
    fiat: '$320',
    kind: { type: 'transfer', toSelf: true },
    age: '1d ago',
    signers: ['Ana'],
    eligible: true,
  },
  {
    id: 'grants-11',
    account: 'grants',
    nonce: 11,
    recipient: 'Tailspin Labs · 0x55c1…e3f0',
    amount: '5,000 ARB',
    fiat: '$4,000',
    kind: { type: 'transfer' },
    age: '15m ago',
    signers: [],
    eligible: true,
    proposedBy: 'Proposer · 0x8f1c…22d0',
  },
]
export const getAccount = (tx: Proposal) => {
  const account = knownAccounts.find((account) => account.id === tx.account)!
  return tx.queueNextNonce === undefined ? account : { ...account, nextNonce: tx.queueNextNonce }
}
export const getOutstandingSigners = (tx: Proposal) =>
  getAccount(tx).owners.filter((name) => !tx.signers.includes(name))
export const getState = (tx: Proposal, persona: Persona = 'owner') => {
  const account = getAccount(tx)
  const confirmations = tx.signers.filter((name) => account.owners.includes(name))
  const missing = Math.max(0, account.threshold - confirmations.length)
  const waiting = tx.nonce > account.nextNonce
  const canSign =
    tx.nonce >= account.nextNonce &&
    isSignerOf(account, persona) &&
    tx.eligible &&
    !confirmations.includes(getYou(persona)!) &&
    missing > 0
  return {
    missing,
    waiting,
    canSign,
    ready: missing === 0 && tx.nonce === account.nextNonce,
    finalSignature: canSign && missing === 1 && tx.nonce === account.nextNonce,
  }
}
export const getScenario = (scenario: Scenario): Proposal[] => {
  if (scenario === 'empty' || scenario === 'loading' || scenario === 'error') return []
  const items = proposals.map((tx) => ({ ...tx, signers: [...tx.signers] }))
  if (scenario === 'many-safes') return [...items, ...manySafesProposals()]
  if (scenario === 'protocol') return protocolProposals()
  if (scenario === 'fleet') return fleetProposals()
  if (scenario === 'conflict')
    items.push({
      id: 'treasury-42-swap',
      account: 'treasury',
      nonce: 42,
      recipient: 'CoW Swap · USDC → ETH',
      amount: '200,000 USDC',
      kind: { type: 'swap', sell: '200,000 USDC', buy: '62.4 ETH', order: 'market', expiry: 'Expires in 18h' },
      age: '2d ago',
      signers: ['Max'],
      eligible: true,
    })
  if (scenario === 'conflict-heavy') {
    const fullySigned = (tx: Proposal): Proposal =>
      tx.id === 'treasury-42'
        ? { ...tx, signers: ['Ana', 'Max', 'Jonas'] }
        : tx.id === 'payroll-18'
          ? { ...tx, signers: ['Ana', 'Max'] }
          : tx
    return [
      ...items.map(fullySigned),
      {
        id: 'treasury-42-batch',
        account: 'treasury',
        nonce: 42,
        recipient: 'Transaction Builder · Batch',
        amount: '',
        age: '2d ago',
        signers: ['Ana', 'Max', 'Lena'],
        eligible: true,
        kind: { type: 'batch', actions: generateBatchActions(46) },
      },
      {
        id: 'treasury-42-owner',
        account: 'treasury',
        nonce: 42,
        recipient: 'Marco · 0x7d2e…41ab',
        amount: '',
        kind: { type: 'settings', change: { kind: 'addOwner', owner: 'Marco' } },
        age: '2d ago',
        signers: ['Ana', 'Jonas', 'Lena'],
        eligible: true,
      },
      {
        id: 'treasury-42-threshold',
        account: 'treasury',
        nonce: 42,
        recipient: 'Treasury Main policy',
        amount: '',
        kind: { type: 'settings', change: { kind: 'changeThreshold', threshold: 2 } },
        age: '1d ago',
        signers: ['Max', 'Jonas', 'Lena'],
        eligible: true,
      },
    ]
  }
  if (scenario === 'conflict-mixed')
    return [
      ...items.map((tx) => (tx.id === 'treasury-42' ? { ...tx, signers: ['Ana', 'Max', 'Jonas'] } : tx)),
      {
        id: 'treasury-42-swap',
        account: 'treasury',
        nonce: 42,
        recipient: 'CoW Swap · USDC → ETH',
        amount: '200,000 USDC',
        kind: { type: 'swap', sell: '200,000 USDC', buy: '62.4 ETH', order: 'market', expiry: 'Expires in 18h' },
        age: '2d ago',
        signers: ['Max'],
        eligible: true,
      },
      {
        id: 'treasury-42-owner',
        account: 'treasury',
        nonce: 42,
        recipient: 'Marco · 0x7d2e…41ab',
        amount: '',
        kind: { type: 'settings', change: { kind: 'addOwner', owner: 'Marco' } },
        age: '1d ago',
        signers: ['Dev', 'Lena'],
        eligible: true,
      },
      {
        id: 'treasury-43-threshold',
        account: 'treasury',
        nonce: 43,
        recipient: 'Treasury Main policy',
        amount: '',
        kind: { type: 'settings', change: { kind: 'changeThreshold', threshold: 2 } },
        age: '5h ago',
        signers: ['Jonas'],
        eligible: true,
      },
    ]
  if (scenario === 'realistic')
    return [...items, ...realisticProposals.map((tx) => ({ ...tx, signers: [...tx.signers] }))]
  if (scenario === 'gap') return items.filter((tx) => tx.id !== 'treasury-42')
  if (scenario === 'partial') return items.filter((tx) => tx.account !== 'grants')
  return items
}
export const getPrimaryStatus = (tx: Proposal, persona: Persona): Filter => {
  const state = getState(tx, persona)
  if (state.ready) return 'ready'
  if (state.canSign) return 'sign'
  if (state.waiting) return 'waiting'
  return 'awaiting'
}

// `exclusive` (next steps): each row matches one status only, the status of its section.
export const matchesFilter = (tx: Proposal, filter: Filter, persona: Persona, exclusive = false) => {
  if (exclusive) return getPrimaryStatus(tx, persona) === filter
  const state = getState(tx, persona)
  return (
    (filter === 'sign' && state.canSign) ||
    (filter === 'ready' && state.ready) ||
    (filter === 'waiting' && state.waiting) ||
    (filter === 'awaiting' && getPrimaryStatus(tx, persona) === 'awaiting')
  )
}
export const getConflicts = (tx: Proposal, items: Proposal[]) =>
  items.filter((other) => other.id !== tx.id && other.account === tx.account && other.nonce === tx.nonce)
export const getAction = (tx: Proposal, persona: Persona) => {
  const state = getState(tx, persona)
  if (state.ready) return 'Review and execute'
  if (state.finalSignature) return 'Review, sign and execute'
  return 'Review and sign'
}
export const clusterByNonce = (items: Proposal[]) => {
  const seen = new Set<string>()
  return items.flatMap((tx) => {
    const key = `${tx.account}:${tx.nonce}`
    if (seen.has(key)) return []
    seen.add(key)
    return items.filter((other) => other.account === tx.account && other.nonce === tx.nonce)
  })
}
export const getRowAction = (tx: Proposal, persona: Persona) => {
  const state = getState(tx, persona)
  if (state.ready) return 'Execute'
  if (state.canSign) return 'Sign'
  return 'Review'
}
export type RowSecondaryAction = 'replace' | 'reject'
export const getSecondaryActions = (tx: Proposal, persona: Persona): RowSecondaryAction[] =>
  isSignerOf(getAccount(tx), persona) ? ['replace', 'reject'] : []
export const getStatusLabel = (tx: Proposal, persona: Persona) => {
  const state = getState(tx, persona)
  if (state.ready) return 'Ready to execute'
  if (state.waiting) return `Blocked by #${getAccount(tx).nextNonce}`
  if (state.canSign) return 'Ready to sign'
  return 'Waiting on others'
}
export const getRecipientName = (tx: Proposal) => tx.recipient.split(' · ')[0]
export const getRecipientAddress = (tx: Proposal) => tx.recipient.split(' · ')[1]
export const getCounterparty = (tx: Proposal): { label: string; value: string } | undefined => {
  const { kind } = tx
  switch (kind.type) {
    case 'transfer':
      return { label: 'To', value: kind.toSelf ? 'This Safe account' : getRecipientName(tx) }
    case 'contract':
      return { label: 'Contract', value: kind.contract }
    case 'batch':
      return { label: 'Contract', value: getRecipientName(tx) }
    case 'bridge':
      return { label: 'To', value: getDestinationLabel(kind) }
    case 'nested':
      return { label: 'Parent Safe', value: kind.parentSafe }
    default:
      return undefined
  }
}
export const getToken = (amount: string) => amount.split(' ').at(-1) ?? ''
export const TYPE_LABELS = [
  'Send',
  'Swap',
  'Bridge',
  'Batch',
  'Contract',
  'Settings',
  'Nested',
  'On-chain rejection',
] as const
export type TypeLabel = (typeof TYPE_LABELS)[number]
export const getTypeLabel = (tx: Proposal): TypeLabel =>
  (
    ({
      transfer: 'Send',
      swap: 'Swap',
      bridge: 'Bridge',
      batch: 'Batch',
      contract: 'Contract',
      settings: 'Settings',
      nested: 'Nested',
      rejection: 'On-chain rejection',
    }) as const
  )[tx.kind.type]
const describeChange = (change: SettingsChange, completed: boolean) => {
  const verb = (present: string, past: string) => (completed ? past : present)
  switch (change.kind) {
    case 'addOwner':
      return `${verb('Add', 'Added')} signer ${change.owner}`
    case 'removeOwner':
      return `${verb('Remove', 'Removed')} signer ${change.owner}`
    case 'changeThreshold':
      return `${verb('Change', 'Changed')} threshold to ${change.threshold}`
    case 'enableModule':
      return `${verb('Enable', 'Enabled')} module ${change.module}`
    case 'setGuard':
      return `Set guard ${change.guard}`
    case 'setFallbackHandler':
      return `Set fallback handler ${change.handler}`
    case 'updateVersion':
      return `${verb('Update', 'Updated')} Safe to ${change.to}`
  }
}
const getDestinationLabel = (kind: Extract<TransactionKind, { type: 'bridge' }>) =>
  kind.destination ?? 'Unknown network'
export const getTransactionLabel = (tx: Proposal, completed = false) => {
  const { kind } = tx
  const verb = (present: string, past: string) => (completed ? past : present)
  switch (kind.type) {
    case 'rejection':
      return 'On-chain rejection'
    case 'settings':
      return describeChange(kind.change, completed)
    case 'batch':
      return `Batch · ${kind.actions.length} actions`
    case 'contract':
      return `${verb('Call', 'Called')} ${kind.method} on ${kind.contract}`
    case 'swap':
      return `${verb('Swap', 'Swapped')} ${getToken(kind.sell)} → ${getToken(kind.buy)}`
    case 'bridge':
      return `${verb('Bridge', 'Bridged')} ${getToken(kind.sell)} to ${getDestinationLabel(kind)}`
    case 'nested':
      return `${verb('Approve', 'Approved')} #${kind.parentNonce} on ${kind.parentSafe}`
    case 'transfer':
      return kind.toSelf ? `${verb('Send', 'Sent')} to this Safe` : `${verb('Send', 'Sent')} to ${getRecipientName(tx)}`
  }
}
const describeChangeShort = (change: SettingsChange, threshold: number) => {
  switch (change.kind) {
    case 'addOwner':
      return `New signer: ${change.owner}`
    case 'removeOwner':
      return `Remove signer: ${change.owner}`
    case 'changeThreshold':
      return `Threshold ${threshold} → ${change.threshold}`
    case 'enableModule':
      return `Enable module: ${change.module}`
    case 'setGuard':
      return `Set guard: ${change.guard}`
    case 'setFallbackHandler':
      return `Fallback handler: ${change.handler}`
    case 'updateVersion':
      return `Safe version ${change.from} → ${change.to}`
  }
}
export const getAmountLabel = (tx: Proposal) => {
  const { kind } = tx
  switch (kind.type) {
    case 'rejection':
      return `Replaces #${tx.nonce}`
    case 'settings':
      return describeChangeShort(kind.change, getAccount(tx).threshold)
    case 'batch':
      return [`${kind.actions.length} actions`, tx.amount, tx.fiat].filter(Boolean).join(' · ')
    case 'contract':
      return `${kind.method} · ${kind.contract}`
    case 'swap':
      return `${kind.sell} → ${kind.buy}${kind.order === 'limit' ? ' · Limit' : kind.order === 'twap' ? ' · TWAP' : ''}`
    case 'bridge':
      return `${kind.sell} → ${getDestinationLabel(kind)}`
    case 'nested':
      return `Approves #${kind.parentNonce} on ${kind.parentSafe}`
    case 'transfer':
      return [tx.amount, tx.fiat, kind.toSelf && 'to this Safe'].filter(Boolean).join(' · ')
  }
}
export type Warning = 'delegateCall' | 'unverifiedContract' | 'unknownNetwork' | 'expired' | 'policyChange' | 'toSelf'
export const WARNING_LABELS: Record<Warning, string> = {
  delegateCall: 'Unexpected delegate call',
  unverifiedContract: 'Unverified contract',
  unknownNetwork: 'Unknown network',
  expired: 'Order expired',
  policyChange: 'Changes who controls funds',
  toSelf: 'Sends to this Safe',
}
export const WARNING_DETAILS: Record<Warning, string> = {
  delegateCall:
    'This batch runs another contract’s code with full control of this Safe. Only sign if you trust that contract.',
  unverifiedContract: 'The contract’s source code isn’t verified, so we can’t decode what this call does.',
  unknownNetwork:
    'We don’t support the destination chain, so we can’t show where the funds arrive. Check the chain ID.',
  expired: 'This order can’t fill anymore. Reject it to free up the nonce.',
  policyChange:
    'Modules, guards and fallback handlers can move funds or block transactions without the usual signatures.',
  toSelf: 'The recipient is this Safe, so no funds leave it. Make sure that’s intended.',
}
const POLICY_CHANGES: SettingsChange['kind'][] = ['enableModule', 'setGuard', 'setFallbackHandler', 'updateVersion']
export const getWarnings = (tx: Proposal): Warning[] => {
  const { kind } = tx
  return [
    kind.type === 'batch' && kind.delegateCall === 'untrusted' && 'delegateCall',
    kind.type === 'contract' && !kind.verified && 'unverifiedContract',
    kind.type === 'bridge' && !kind.destination && 'unknownNetwork',
    kind.type === 'swap' && kind.expired && 'expired',
    kind.type === 'settings' && POLICY_CHANGES.includes(kind.change.kind) && 'policyChange',
    kind.type === 'transfer' && kind.toSelf && 'toSelf',
  ].filter((warning): warning is Warning => !!warning)
}
export const getSignatureCount = (tx: Proposal) =>
  tx.signers.filter((name) => getAccount(tx).owners.includes(name)).length
// The RFC's plain-language answer to "can this execute, and if not, why not?"
export const getExecutionReason = (tx: Proposal, persona: Persona, items: Proposal[]) => {
  const state = getState(tx, persona)
  const { nextNonce } = getAccount(tx)
  const competing = getConflicts(tx, items).length
  const replaces = competing
    ? ` Executing it cancels ${competing} competing ${competing === 1 ? 'proposal' : 'proposals'}.`
    : ''
  const more = `${state.missing} more ${state.missing === 1 ? 'signature' : 'signatures'}`
  if (state.ready) return `All signatures are in and #${tx.nonce} is next, so it can execute now.${replaces}`
  if (state.waiting)
    return `Blocked by #${nextNonce}. Earlier transactions must execute first.${state.canSign ? ' You can still sign now.' : ''}`
  if (state.canSign) return `Needs ${more}, including yours. It can execute once the threshold is reached.`
  return `Needs ${more} from other signers before it can execute.`
}
const AGE_UNITS: Record<string, number> = { m: 60_000, h: 3_600_000, d: 86_400_000 }
// Fixtures only carry a relative age, so the full timestamp is derived from it.
export const getCreatedAt = (tx: Proposal, now = Date.now()) => {
  const match = tx.age.match(/^(\d+)([mhd]) ago$/)
  return match ? now - Number(match[1]) * AGE_UNITS[match[2]] : now
}
// Fixtures have no signing times, so the proposer signs at creation and the rest are spread until now.
export const getSignedAt = (tx: Proposal, index: number, now = Date.now()) => {
  const created = getCreatedAt(tx, now)
  return index === 0 ? created : created + Math.round(((now - created) * index) / (tx.signers.length + 1))
}
export const getCreator = (tx: Proposal) => tx.proposedBy ?? (tx.signers[0] ? getSignerName(tx.signers[0]) : undefined)
export const getSignerSummary = (tx: Proposal, persona: Persona) => {
  const { missing } = getState(tx, persona)
  if (!missing) return 'Threshold met'
  const names = getOutstandingSigners(tx).map((name) => (isYou(name, persona) ? 'you' : getSignerName(name)))
  return `${missing} more from ${names.join(', ')}`
}
// Next steps: short chip labels that follow the section. `after`: a row you can sign behind an earlier nonce.
export const getStepsStatus = (tx: Proposal, persona: Persona) => {
  const status = getPrimaryStatus(tx, persona)
  const { nextNonce } = getAccount(tx)
  const labels: Record<Filter, string> = {
    ready: 'Execute',
    sign: 'Sign',
    awaiting: 'Waiting',
    waiting: `Blocked by #${nextNonce}`,
  }
  return {
    label: labels[status],
    tone: status === 'ready' || status === 'sign' ? ('success' as const) : ('warning' as const),
    after: status === 'sign' && getState(tx, persona).waiting ? nextNonce : undefined,
  }
}
export const getStatusTone = (tx: Proposal, persona: Persona) => {
  const state = getState(tx, persona)
  return state.ready || (state.canSign && !state.waiting) ? 'success' : 'warning'
}
