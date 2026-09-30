import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import type { WalletKitTypes } from '@reown/walletkit'
import { renderWithStore, createTestStore } from '@/src/tests/test-utils'
import { SessionProposalSheet } from '../SessionProposalSheet'

const makePending = (): { id: number; proposal: WalletKitTypes.SessionProposal } => ({
  id: 123,
  proposal: {
    id: 123,
    params: {
      proposer: { metadata: { name: 'Uniswap', url: 'https://uniswap.org/', icons: ['https://x/icon.png'] } },
      requiredNamespaces: { eip155: { chains: ['eip155:1'], methods: [], events: [] } },
      optionalNamespaces: {},
    },
    verifyContext: { verified: { validation: 'VALID' } },
  } as unknown as WalletKitTypes.SessionProposal,
})

// Presentation only: the Connect CTA lives in RequestSheetHost's footer (tested there).
describe('SessionProposalSheet', () => {
  it('renders dApp name and domain', () => {
    const { getByText } = renderWithStore(<SessionProposalSheet pending={makePending()} />, createTestStore())
    expect(getByText('Uniswap')).toBeTruthy()
    expect(getByText('uniswap.org')).toBeTruthy()
  })

  it('asks the host to open the permissions panel when the domain pill is pressed', () => {
    const onOpenPermissions = jest.fn()
    const { getByTestId } = renderWithStore(
      <SessionProposalSheet pending={makePending()} onOpenPermissions={onOpenPermissions} />,
      createTestStore(),
    )
    fireEvent.press(getByTestId('wc-proposal-domain'))
    expect(onOpenPermissions).toHaveBeenCalledTimes(1)
  })

  it('hides the domain pill when the dApp provides no URL', () => {
    const pending = {
      id: 123,
      proposal: {
        id: 123,
        params: {
          proposer: { metadata: { name: 'Uniswap', icons: [] } },
          requiredNamespaces: { eip155: { chains: ['eip155:1'], methods: [], events: [] } },
          optionalNamespaces: {},
        },
        verifyContext: { verified: { validation: 'VALID' } },
      } as unknown as WalletKitTypes.SessionProposal,
    }
    const { getByText, queryByTestId } = renderWithStore(<SessionProposalSheet pending={pending} />, createTestStore())
    expect(getByText('Uniswap')).toBeTruthy()
    expect(queryByTestId('wc-proposal-domain')).toBeNull()
  })
})
