import React from 'react'
import { Text } from 'tamagui'
import type { SessionTypes } from '@walletconnect/types'
import { renderWithStore, createTestStore } from '@/src/tests/test-utils'
import { DappOriginProvider, useDappOrigin } from '../DappOriginContext'
import { addSession, setOutstandingRequest } from '@/src/features/WalletConnect/Wallet/store/walletKitSlice'

function OriginProbe() {
  const origin = useDappOrigin()
  return <Text>{origin ? `${origin.name}|${origin.logoUri ?? ''}` : 'no-origin'}</Text>
}

const seedDappTx = (store: ReturnType<typeof createTestStore>, safeTxHash: string) => {
  store.dispatch(
    addSession({
      topic: 't',
      peer: { metadata: { name: 'Uniswap', url: 'https://uniswap.org', icons: ['https://x/icon.png'] } },
    } as unknown as SessionTypes.Struct),
  )
  store.dispatch(
    setOutstandingRequest({
      safeTxHash,
      topic: 't',
      id: 1,
      method: 'eth_sendTransaction',
      chainId: '1',
      safeAddress: '0xsafe',
    }),
  )
}

describe('DappOriginProvider', () => {
  it('resolves the originating dApp from the store for a WalletConnect tx', () => {
    const store = createTestStore()
    seedDappTx(store, '0xabc')
    const { getByText } = renderWithStore(
      <DappOriginProvider txId="0xabc">
        <OriginProbe />
      </DappOriginProvider>,
      store,
    )
    expect(getByText('Uniswap|https://x/icon.png')).toBeTruthy()
  })

  it('provides null for a tx with no WalletConnect origin', () => {
    const { getByText } = renderWithStore(
      <DappOriginProvider txId="0xnope">
        <OriginProbe />
      </DappOriginProvider>,
      createTestStore(),
    )
    expect(getByText('no-origin')).toBeTruthy()
  })
})
