import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { StoreDecorator } from '@/stories/storeDecorator'
import ModalDialog from './index'
import { TOKEN_LISTS } from '@/store/settingsSlice'

const createInitialState = () => ({
  settings: {
    currency: 'usd',
    hiddenTokens: {},
    tokenList: TOKEN_LISTS.ALL,
    shortName: { qr: true },
    theme: { darkMode: false },
    env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
    signing: { onChainSigning: false, blindSigning: false },
    transactionExecution: true,
  },
  chains: {
    data: [
      {
        chainId: '1',
        chainName: 'Ethereum',
        shortName: 'eth',
        nativeCurrency: { symbol: 'ETH', decimals: 18, name: 'Ether' },
        theme: { backgroundColor: '#E8E7E6', textColor: '#001428' },
      },
    ],
  },
})

const meta: Meta<typeof ModalDialog> = {
  title: 'Components/Common/ModalDialog',
  component: ModalDialog,
  parameters: { layout: 'centered' },
  decorators: [
    (Story, context) => (
      <StoreDecorator initialState={createInitialState()} context={context}>
        <Story />
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    open: true,
    dialogTitle: 'Confirm Transaction',
    onClose: fn(),
    children: (
      <>
        <div className="p-6">
          <Typography>Are you sure you want to proceed with this transaction?</Typography>
        </div>
        {/* eslint-disable-next-line no-restricted-syntax -- story-only: demonstrates a custom-padded footer row */}
        <DialogFooter className="p-6 pt-0 sm:flex-row sm:justify-end">
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </>
    ),
  },
}

export const WithoutChainIndicator: Story = {
  args: {
    open: true,
    dialogTitle: 'Settings',
    hideChainIndicator: true,
    onClose: fn(),
    children: (
      <div className="p-6">
        <Typography>Modal without chain indicator.</Typography>
      </div>
    ),
  },
}
