import type { Meta, StoryObj } from '@storybook/react'
import { useEffect } from 'react'
import LedgerHashComparison from './index'
import { showLedgerHashComparison, hideLedgerHashComparison } from '../../store'

const meta = {
  title: 'Features/Ledger/LedgerHashComparison',
  component: LedgerHashComparison,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof LedgerHashComparison>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    useEffect(() => {
      showLedgerHashComparison('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
      return () => hideLedgerHashComparison()
    }, [])
    return <LedgerHashComparison />
  },
}

export const ShortHash: Story = {
  render: () => {
    useEffect(() => {
      showLedgerHashComparison('0xabc123')
      return () => hideLedgerHashComparison()
    }, [])
    return <LedgerHashComparison />
  },
}

export const Hidden: Story = {
  render: () => {
    useEffect(() => {
      hideLedgerHashComparison()
    }, [])
    return <LedgerHashComparison />
  },
}
