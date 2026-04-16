import { useContext, useEffect } from 'react'
import { render, screen, waitFor } from '@/tests/test-utils'
import SafeTxProvider, { SafeTxContext } from '../SafeTxProvider'

jest.mock('@/components/tx/shared/hooks', () => ({
  useRecommendedNonce: () => undefined,
  useSafeTxGas: () => undefined,
}))

const TestConsumer = () => {
  const { txOrigin } = useContext(SafeTxContext)
  return <div data-testid="origin">{txOrigin ?? 'undefined'}</div>
}

describe('SafeTxProvider', () => {
  it('should set a default txOrigin with the app URL and brand name', () => {
    render(
      <SafeTxProvider>
        <TestConsumer />
      </SafeTxProvider>,
    )

    const expected = JSON.stringify({ url: window.location.origin, name: '' })
    expect(screen.getByTestId('origin')).toHaveTextContent(expected)
  })

  it('should allow Safe Apps to override the default txOrigin', async () => {
    const safeAppOrigin = '{"url":"https://dapp.example.com","name":"MyDapp"}'

    const TestOverride = () => {
      const { txOrigin, setTxOrigin } = useContext(SafeTxContext)
      useEffect(() => {
        setTxOrigin(safeAppOrigin)
      }, [setTxOrigin])
      return <div data-testid="origin">{txOrigin}</div>
    }

    render(
      <SafeTxProvider>
        <TestOverride />
      </SafeTxProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('origin')).toHaveTextContent(safeAppOrigin)
    })
  })
})
