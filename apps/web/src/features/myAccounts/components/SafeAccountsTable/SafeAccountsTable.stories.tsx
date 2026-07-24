import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import type { AllSafeItems } from '@/hooks/safes'
import SafeAccountsTable from './index'

const meta = {
  title: 'Features/MyAccounts/SafeAccountsTable',
  component: SafeAccountsTable,
  decorators: [withMockProvider()],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SafeAccountsTable>

export default meta
type Story = StoryObj<typeof meta>

const singleAndMulti: AllSafeItems = [
  {
    name: 'Treasury',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    isPinned: true,
    chainId: '1',
    isReadOnly: false,
    lastVisited: Date.now(),
  },
  {
    name: 'Ops',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    isPinned: true,
    lastVisited: Date.now(),
    safes: [
      {
        name: 'Ops',
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        chainId: '1',
        isReadOnly: false,
        isPinned: true,
        lastVisited: Date.now(),
      },
      {
        name: 'Ops',
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        chainId: '10',
        isReadOnly: false,
        isPinned: true,
        lastVisited: Date.now(),
      },
    ],
  },
]

export const Default: Story = {
  args: {
    items: singleAndMulti,
  },
}

export const Empty: Story = {
  args: {
    items: [],
  },
}

export const NameAndBalanceOnly: Story = {
  args: {
    items: singleAndMulti,
    columns: ['name', 'balance', 'actions'],
  },
}

/** Manual-sort mode: hover a row to reveal the drag grip in the left gutter, outside the table. */
export const Reorder: Story = {
  args: {
    items: singleAndMulti,
    reorder: { onReorder: () => {} },
  },
}

/**
 * Selection + reorder together (the "Manage my account list" modal in Manual sort): each row keeps
 * its checkbox and gains a drag grip, hosted on the leading checkbox cell so it sits left of the box.
 */
export const SelectionAndReorder: Story = {
  args: {
    items: singleAndMulti,
    columns: ['select', 'name', 'threshold', 'networks', 'balance'],
    selection: { selectedKeys: new Set(['1:0x1234567890abcdef1234567890abcdef12345678']), onToggle: () => {} },
    reorder: { onReorder: () => {} },
  },
}

// 40-hex helper so look-alikes share a front-4 / back-6 but differ in the middle.
const addr = (head: string, fill: string, tail: string) =>
  '0x' + head + fill.repeat(40 - head.length - tail.length) + tail

const REAL = '0x8675b754342754a30a2aef474d114d8460bca19b' // trusted "Treasury" — front 8675 … back bca19b
const IMPOSTOR_1 = addr('8675', 'a', 'bca19b') // shares BOTH front-4 (8675) and back-4 (bca19b)
const IMPOSTOR_2 = addr('1f9e', 'c', 'bca19b') // shares ONLY the back-4 (bca19b)
const OPS = addr('1111', '1', '111111') // unrelated, normal row
const VAULT_A = addr('2222', 'a', '333333') // intra-list look-alike pair (no trusted anchor)
const VAULT_B = addr('2222', 'b', '333333')

// Deliberately interleaved (cluster members NOT adjacent) to exercise the table's similarity ordering,
// which pulls each cluster together at its lead's position.
const groupedItems: AllSafeItems = [
  { name: 'Treasury', address: REAL, isPinned: true, chainId: '1', isReadOnly: false, lastVisited: Date.now() },
  { name: 'Ops', address: OPS, isPinned: true, chainId: '1', isReadOnly: false, lastVisited: Date.now() },
  { name: 'Treasury', address: IMPOSTOR_1, isPinned: false, chainId: '1', isReadOnly: true, lastVisited: 0 },
  { name: 'Vault A', address: VAULT_A, isPinned: false, chainId: '1', isReadOnly: true, lastVisited: 0 },
  { name: 'Treasury', address: IMPOSTOR_2, isPinned: false, chainId: '1', isReadOnly: true, lastVisited: 0 },
  { name: 'Vault B', address: VAULT_B, isPinned: false, chainId: '1', isReadOnly: true, lastVisited: 0 },
]

// g1 = anchor case (REAL trusted + 2 impostors); g2 = intra-list (two look-alikes, no trusted member).
const similarityGroups = new Map<string, string>([
  [REAL, 'g1'],
  [IMPOSTOR_1, 'g1'],
  [IMPOSTOR_2, 'g1'],
  [VAULT_A, 'g2'],
  [VAULT_B, 'g2'],
])

// ⚠️ on look-alikes only — the trusted REAL anchor is in the band but carries no warning.
const flaggedAddresses = new Set([IMPOSTOR_1, IMPOSTOR_2, VAULT_A, VAULT_B])

/**
 * Address-poisoning similarity band (Approach A: tinted rows + header, no bordered card yet).
 * g1: a trusted anchor (checked, no ⚠️) grouped with its two impostors (⚠️).
 * g2: an intra-list pair where neither is trusted → both ⚠️.
 */
export const SimilarityGrouped: Story = {
  args: {
    items: groupedItems,
    columns: ['select', 'name', 'threshold', 'networks', 'balance'],
    selection: { selectedKeys: new Set([`1:${REAL}`]), onToggle: () => {} },
    flaggedAddresses,
    similarityGroups,
  },
}

/** Manual / reorder mode: the band survives drag-and-drop — clusters stay grouped as one unit. */
export const SimilarityGroupedReorder: Story = {
  args: {
    items: groupedItems,
    columns: ['select', 'name', 'threshold', 'networks', 'balance'],
    selection: { selectedKeys: new Set([`1:${REAL}`]), onToggle: () => {} },
    flaggedAddresses,
    similarityGroups,
    reorder: { onReorder: () => {} },
  },
}
