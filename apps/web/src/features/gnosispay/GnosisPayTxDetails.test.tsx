import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { render, screen, waitFor } from '@/tests/test-utils'
import { GnosisPayTxDetails } from './GnosisPayTxDetails'
import { Interface } from 'ethers'
const recipient = '0x0000000000000000000000000000000000000020'
const abi = new Interface(['function approve(address spender,uint256 amount)'])
const txData = { to: recipient, value: '42', data: abi.encodeFunctionData('approve', [recipient, 10n]) }
const handler = http.post('*/v1/chains/:chain/transactions/:safe/preview', () =>
  HttpResponse.json({
    txData: {
      dataDecoded: {
        method: 'approve',
        parameters: [
          { name: 'spender', type: 'address', value: recipient },
          { name: 'amount', type: 'uint256', value: '10' },
        ],
      },
    },
  }),
)
jest.mock('@/hooks/useSafeInfo', () => () => ({
  safe: { chainId: '100', address: { value: '0x0000000000000000000000000000000000000010' } },
  safeAddress: '0x0000000000000000000000000000000000000010',
}))
jest.mock('@/hooks/useNativeTokenInfo', () => ({
  useNativeTokenInfo: () => ({ name: 'xDAI', symbol: 'xDAI', decimals: 18, logoUri: '' }),
}))
beforeEach(() => server.use(handler))
afterEach(() => server.resetHandlers())
it('shows the recipient, value and decoded queued call', async () => {
  render(<GnosisPayTxDetails txData={txData} />)
  expect(screen.getByText('Value (wei): 42')).toBeInTheDocument()
  await waitFor(() => expect(screen.getAllByText(/approve/).length).toBeGreaterThan(0))
  expect(screen.getAllByText(/0x0000/).length).toBeGreaterThan(0)
})
it('preserves raw calldata and value when decoding fails', async () => {
  server.use(http.post('*/v1/chains/:chain/transactions/:safe/preview', () => HttpResponse.json({}, { status: 503 })))
  render(<GnosisPayTxDetails txData={txData} />)
  await screen.findByText(/Could not decode the transaction/)
  expect(screen.getByText('Value (wei): 42')).toBeInTheDocument()
  expect(screen.getByTestId('hexData')).toBeInTheDocument()
})
