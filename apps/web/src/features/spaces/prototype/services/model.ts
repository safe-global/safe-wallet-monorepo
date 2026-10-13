import type { Account, BatchAction, Filter, Persona, Proposal, Scenario } from '../types'

// Synthetic full addresses are used only to render fixture identicons; signer counts are sample configuration.
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
    address: '0xd8dA…6045',
    iconAddress: '0xd8da000000000000000000000000000000006045',
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
    owners: ['Ana', 'Jonas', 'Lena', 'Max'],
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
    title: 'October payroll',
    recipient: '14 recipients · Batch transfer',
    amount: '32,400 USDC',
    actions: generateBatchActions(14, 'Employee'),
    age: '5h ago',
    signers: ['Ana', 'Max'],
    eligible: true,
    note: {
      text: 'October salaries. Amounts match HR sheet v3. Please review all 14 recipients.',
      author: 'Ana Reyes',
      date: '8 Oct, 10:30',
    },
  },
  {
    id: 'treasury-42',
    account: 'treasury',
    nonce: 42,
    title: 'Contractor payments',
    recipient: 'Bitwave Payroll · 0x1c9f…77aa',
    amount: '48.5 ETH',
    age: '3d ago',
    signers: ['Ana', 'Max'],
    eligible: true,
    note: {
      text: 'September contractor payouts. Finance reference FIN-221. Confirm the recipient and amount against the invoice.',
      author: 'Ana Reyes',
      date: '6 Oct, 09:15',
    },
  },
  {
    id: 'treasury-43',
    account: 'treasury',
    nonce: 43,
    title: 'Add a signer',
    recipient: 'Priya · 0x3e1b…09cd',
    amount: 'Safe settings',
    age: '1d ago',
    signers: ['Ana', 'Max', 'Dev'],
    eligible: true,
    note: { text: 'Add Priya from Operations. Threshold stays at 3 signatures.', author: 'Dev', date: '8 Oct, 11:00' },
  },
  {
    id: 'treasury-44',
    account: 'treasury',
    nonce: 44,
    title: 'Q4 vendor payment',
    recipient: 'Lightbridge Ltd · 0x4f2a…c81e',
    amount: '125,000 USDC',
    age: '6h ago',
    signers: ['Ana'],
    eligible: true,
    note: { text: 'Q4 vendor payment for invoice #4471.', author: 'Lena Okafor', date: '8 Oct, 14:20' },
  },
  {
    id: 'payroll-18',
    account: 'payroll',
    nonce: 18,
    title: 'Payroll services',
    recipient: 'Deel · 0x90ab…12ef',
    amount: '1,200 USDC',
    age: '1h ago',
    signers: [],
    eligible: true,
  },
  {
    id: 'grants-8',
    account: 'grants',
    nonce: 8,
    title: 'Wave 4 grant',
    recipient: 'Milestone 2 · 0x55c1…e3f0',
    amount: '25,000 ARB',
    age: '4d ago',
    signers: ['Jonas'],
    eligible: false,
    note: {
      text: 'Milestone 2 of Wave 4. Deliverables discussed on 1 October.',
      author: 'Lena Okafor',
      date: '5 Oct, 16:00',
    },
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
  if (scenario === 'empty') return []
  const items = proposals.map((tx) => ({ ...tx, signers: [...tx.signers] }))
  if (scenario === 'conflict')
    items.push({
      id: 'treasury-42-swap',
      account: 'treasury',
      nonce: 42,
      title: 'Rebalance treasury',
      recipient: 'CoW Swap · USDC → ETH',
      amount: '200,000 USDC',
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
        title: 'Supplier settlement',
        recipient: 'Transaction Builder · Batch',
        amount: '',
        age: '2d ago',
        signers: ['Ana', 'Max', 'Lena'],
        eligible: true,
        actions: generateBatchActions(46),
      },
      {
        id: 'treasury-42-owner',
        account: 'treasury',
        nonce: 42,
        title: 'Add Priya as signer',
        recipient: 'Priya · 0x3e1b…09cd',
        amount: 'Safe settings',
        age: '2d ago',
        signers: ['Ana', 'Jonas', 'Lena'],
        eligible: true,
      },
      {
        id: 'treasury-42-threshold',
        account: 'treasury',
        nonce: 42,
        title: 'Change threshold to 2',
        recipient: 'Treasury Main policy',
        amount: 'Safe settings',
        age: '1d ago',
        signers: ['Max', 'Jonas', 'Lena'],
        eligible: true,
      },
    ]
  }
  if (scenario === 'gap') return items.filter((tx) => tx.id !== 'treasury-42')
  if (scenario === 'partial') return items.filter((tx) => tx.account !== 'grants')
  return items
}
export const getPrimaryStatus = (tx: Proposal, persona: Persona): Exclude<Filter, 'all'> => {
  const state = getState(tx, persona)
  if (state.ready) return 'ready'
  if (state.canSign) return 'sign'
  if (state.waiting) return 'waiting'
  return 'awaiting'
}

export const matchesFilter = (tx: Proposal, filter: Filter, persona: Persona) => {
  const state = getState(tx, persona)
  return (
    filter === 'all' ||
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
  if (state.canSign) return 'Review and sign'
  if (state.waiting) return 'View earlier transactions'
  return 'View details'
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
export const getStatusLabel = (tx: Proposal, persona: Persona) => {
  const state = getState(tx, persona)
  if (state.ready) return 'Ready to execute'
  if (state.waiting) return `Waiting on #${getAccount(tx).nextNonce}`
  if (state.canSign) return 'Ready to sign'
  return 'Waiting on signatures'
}
