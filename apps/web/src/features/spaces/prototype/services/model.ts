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

// Synthetic full addresses are used only to render fixture identicons; signer counts are sample configuration.
// An owner nobody named in the address book, so the UI falls back to the address.
export const UNNAMED_SIGNER = '0x65F84b1E9a0c2D7f3B6e8A1c5d9F0e2b4a7CC7B0'
const SIGNER_ADDRESSES: Record<string, string> = {
  Dev: '0x1F3a9c0B7e2D4f6A8b5C3e1D9f7A2c4E6b8D0a12',
  Ana: '0x7C21e4B9a3D6f8C0e2A5b7D9c1E3f5A7b9C0d2E4',
  Max: '0x9A0b2C4d6E8f1A3b5C7d9E0f2A4b6C8d0E1f3A5b',
  Jonas: '0x2B4c6D8e0F1a3B5c7D9e1F2a4B6c8D0e2F3a5B7c',
  Lena: '0x4D6e8F0a2B3c5D7e9F1a2B4c6D8e0F1a3B5c7D9e',
}
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
    owners: ['Dev', 'Ana', 'Max'],
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
export const generateBatchActions = (count: number, recipient = 'Supplier'): BatchAction[] =>
  Array.from({ length: count }, (_, index) => {
    const id = (index + 1).toString(16).padStart(4, '0')
    return {
      method: index % 5 === 4 ? 'approve' : 'transfer',
      to: `${recipient} ${index + 1} · 0x${id}…${id}`,
      value: `${((index % 7) + 1) * 250} USDC`,
    }
  })
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
  const account = accounts.find((account) => account.id === tx.account)!
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
    persona === 'owner' &&
    account.owners.includes('Dev') &&
    tx.eligible &&
    !confirmations.includes('Dev') &&
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
  persona === 'owner' && getAccount(tx).owners.includes('Dev') ? ['replace', 'reject'] : []
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
  'Update',
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
      settings: 'Update',
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
// "Dev" is the signed-in owner in these fixtures.
export const getSignerSummary = (tx: Proposal, persona: Persona) => {
  const { missing } = getState(tx, persona)
  if (!missing) return 'Threshold met'
  const names = getOutstandingSigners(tx).map((name) =>
    name === 'Dev' && persona === 'owner' ? 'you' : getSignerName(name),
  )
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
