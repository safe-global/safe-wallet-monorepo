import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Button, DialogActions, DialogContent, Typography } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import ModalDialog from './index'
import { TOKEN_LISTS } from '@/store/settingsSlice'

const createInitialState = () => ({
  settings: {
    currency: 'usd',
    hiddenTokens: {},
    tokenList: TOKEN_LISTS.ALL,
    shortName: { copy: true, qr: true },
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
        <DialogContent>
          <Typography>Are you sure you want to proceed with this transaction?</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined">Cancel</Button>
          <Button variant="contained">Confirm</Button>
        </DialogActions>
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
      <DialogContent>
        <Typography>Modal without chain indicator.</Typography>
      </DialogContent>
    ),
  },
}
