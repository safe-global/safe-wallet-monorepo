import type { Meta, StoryObj } from '@storybook/react'
import React, { useEffect } from 'react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import { RequiredConfirmation } from './index'
import { WalletContext, type WalletContextType } from '@/components/common/WalletProvider'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { setSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'

const MOCK_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890'

const mockConnectedWallet: WalletContextType = {
  connectedWallet: {
    address: MOCK_WALLET_ADDRESS,
    chainId: '1',
    label: 'MetaMask',
    provider: null as never,
  },
  signer: {
    address: MOCK_WALLET_ADDRESS,
    chainId: '1',
    provider: null,
  },
  setSignerAddress: () => {},
}

const mockTxModalContext: TxModalContextType = {
  txFlow: undefined,
  setTxFlow: () => {},
  setFullWidth: () => {},
}

const MockSDKProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    setSafeSDK({} as never)
    return () => setSafeSDK(undefined)
  }, [])
  return <>{children}</>
}

const meta: Meta<typeof RequiredConfirmation> = {
  title: 'Components/Settings/RequiredConfirmations',
  component: RequiredConfirmation,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <MockSDKProvider>
        <WalletContext.Provider value={mockConnectedWallet}>
          <TxModalContext.Provider value={mockTxModalContext}>
            <StoreDecorator
              initialState={{
                chains: {
                  data: [{ chainId: '1' }],
                },
                safeInfo: {
                  data: {
                    address: { value: MOCK_WALLET_ADDRESS },
                    chainId: '1',
                    owners: [
                      { value: MOCK_WALLET_ADDRESS },
                      { value: '0xabcdef1234567890abcdef1234567890abcdef12' },
                      { value: '0x9876543210fedcba9876543210fedcba98765432' },
                    ],
                    threshold: 2,
                    deployed: true,
                  },
                  loading: false,
                  loaded: true,
                },
              }}
            >
              <Paper sx={{ padding: 3, maxWidth: 800 }}>
                <Story />
              </Paper>
            </StoreDecorator>
          </TxModalContext.Provider>
        </WalletContext.Provider>
      </MockSDKProvider>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { threshold: 2, owners: 3 },
}

export const SingleOwner: Story = {
  args: { threshold: 1, owners: 1 },
}
