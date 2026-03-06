import type { Meta, StoryObj } from '@storybook/react'
import { useEffect } from 'react'
import TrezorHashComparison from './index'
import { showTrezorHashComparison, hideTrezorHashComparison } from '../../store'

const meta = {
  title: 'Features/Trezor/TrezorHashComparison',
  component: TrezorHashComparison,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TrezorHashComparison>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    useEffect(() => {
      showTrezorHashComparison('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
      return () => hideTrezorHashComparison()
    }, [])
    return <TrezorHashComparison />
  },
}

export const ShortHash: Story = {
  render: () => {
    useEffect(() => {
      showTrezorHashComparison('0xabc123')
      return () => hideTrezorHashComparison()
    }, [])
    return <TrezorHashComparison />
  },
}

export const Hidden: Story = {
  render: () => {
    useEffect(() => {
      hideTrezorHashComparison()
    }, [])
    return <TrezorHashComparison />
  },
}
