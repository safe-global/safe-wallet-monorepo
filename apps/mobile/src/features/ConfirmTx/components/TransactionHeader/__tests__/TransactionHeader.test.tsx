import React from 'react'
import { renderWithStore, createTestStore } from '@/src/tests/test-utils'
import { TransactionHeader } from '../TransactionHeader'
import { DappOriginContextProvider } from '../../DappOriginContext'
import type { IconName } from '@/src/types/iconTypes'

const baseProps = {
  badgeIcon: 'info' as IconName,
  badgeColor: '$primary',
  title: 'Some contract',
  submittedAt: 1_700_000_000_000,
}

describe('TransactionHeader', () => {
  it('shows the contract title when there is no dApp origin', () => {
    const { getByText } = renderWithStore(<TransactionHeader {...baseProps} />, createTestStore())
    expect(getByText('Some contract')).toBeTruthy()
  })

  it('falls back to the contract title when the dApp publishes an empty name', () => {
    const { getByText } = renderWithStore(
      <DappOriginContextProvider value={{ name: '', logoUri: 'https://x/icon.png' }}>
        <TransactionHeader {...baseProps} />
      </DappOriginContextProvider>,
      createTestStore(),
    )
    expect(getByText('Some contract')).toBeTruthy()
  })

  it('replaces the title with the originating dApp name when present', () => {
    const { getByText, queryByText } = renderWithStore(
      <DappOriginContextProvider value={{ name: 'Uniswap', logoUri: 'https://x/icon.png' }}>
        <TransactionHeader {...baseProps} />
      </DappOriginContextProvider>,
      createTestStore(),
    )
    expect(getByText('Uniswap')).toBeTruthy()
    expect(queryByText('Some contract')).toBeNull()
  })
})
