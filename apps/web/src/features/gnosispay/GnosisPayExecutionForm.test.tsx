import { safeTxBuilder } from '@/tests/builders/safeTx'
import type { ComponentProps } from 'react'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { GnosisPayExecutionForm } from './GnosisPayExecutionForm'
import { EURE_TOKEN_ADDRESS } from './utils/getGnosisPayTxWarnings'
import { Interface } from 'ethers'
const mockTxNonce = jest.fn(async () => 4n)
const mockDelay = { delayModifier: { txNonce: mockTxNonce } }
const mockExecute = jest.fn()
const mockEnqueue = jest.fn()
const mockGuard = jest.fn<Promise<void>, unknown[]>(async () => undefined)
let mockWrongChain = false
jest.mock('./hooks/useGnosisPayDelayModifier', () => ({ useGnosisPayDelayModifier: () => [mockDelay] }))
jest.mock('./hooks/useGnosisPayCooldown', () => ({ useGnosisPayCooldown: () => [27, undefined, false] }))
jest.mock('./hooks/useGnosisPayActions', () => ({
  useGnosisPayActions: () => ({ executeTx: mockExecute, enqueueTx: mockEnqueue }),
}))
jest.mock('./utils/submitGnosisPayTx', () => ({
  ...jest.requireActual('./utils/submitGnosisPayTx'),
  assertGnosisPayExecution: (...args: unknown[]) => mockGuard(...args),
}))
jest.mock('@/hooks/wallets/useWallet', () => () => ({
  address: '0x0000000000000000000000000000000000000020',
  chainId: '100',
}))
jest.mock('@/hooks/useIsWrongChain', () => () => mockWrongChain)
jest.mock(
  '@/components/common/CheckWallet',
  () =>
    ({ children }: { children: (ok: boolean) => React.ReactNode }) =>
      children(true),
)
jest.mock('@/components/new-safe/create/NetworkWarning', () => () => null)
const props = (): ComponentProps<typeof GnosisPayExecutionForm> => ({
  isGnosisPayOwner: [true, undefined, false],
  isExecutionLoop: false,
  txSecurity: { needsRiskConfirmation: false, isRiskConfirmed: true } as ComponentProps<
    typeof GnosisPayExecutionForm
  >['txSecurity'],
  safeInfo: { safe: safeInfoBuilder().build() } as ComponentProps<typeof GnosisPayExecutionForm>['safeInfo'],
  queuedGnosisPayTx: {
    isNext: true,
    queueNonce: 4,
    txData: { to: EURE_TOKEN_ADDRESS, value: '0', data: '0x' },
    executableAt: 0,
    expiresAt: null,
  },
})
beforeEach(() => {
  jest.clearAllMocks()
  mockWrongChain = false
  mockTxNonce.mockResolvedValue(4n)
  mockGuard.mockResolvedValue(undefined)
})
it('enables a ready queue head for an authorized owner', async () => {
  render(<GnosisPayExecutionForm {...props()} />)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Execute' })).toBeEnabled())
})
it.each([
  'later',
  'stale',
  'cooldown',
  'expired',
  'nonOwner',
  'ownerLoading',
  'ownerError',
  'wrongChain',
  'risk',
  'disabled',
  'loop',
])('blocks %s even on a direct form submit', async (condition) => {
  const p = props()
  if (condition === 'later') p.queuedGnosisPayTx!.queueNonce = 5
  if (condition === 'stale') p.queuedGnosisPayTx!.queueNonce = 3
  if (condition === 'cooldown') p.queuedGnosisPayTx!.executableAt = Date.now() + 180000
  if (condition === 'expired') p.queuedGnosisPayTx!.expiresAt = 1
  if (condition === 'nonOwner') p.isGnosisPayOwner = [false, undefined, false]
  if (condition === 'ownerLoading') p.isGnosisPayOwner = [true, undefined, true]
  if (condition === 'ownerError') p.isGnosisPayOwner = [true, new Error('read failed'), false]
  if (condition === 'wrongChain') mockWrongChain = true
  if (condition === 'risk') p.txSecurity = { ...p.txSecurity, needsRiskConfirmation: true, isRiskConfirmed: false }
  if (condition === 'disabled') p.disableSubmit = true
  if (condition === 'loop') p.isExecutionLoop = true
  const { container } = render(<GnosisPayExecutionForm {...p} />)
  await waitFor(() => expect(mockTxNonce).toHaveBeenCalled())
  expect(screen.getByRole('button', { name: 'Execute' })).toBeDisabled()
  fireEvent.submit(container.querySelector('form')!)
  expect(mockExecute).not.toHaveBeenCalled()
  expect(mockEnqueue).not.toHaveBeenCalled()
})
it('blocks submission when nonce loading fails', async () => {
  mockTxNonce.mockRejectedValue(new Error('RPC unavailable'))
  render(<GnosisPayExecutionForm {...props()} />)
  await waitFor(() => expect(mockTxNonce).toHaveBeenCalled())
  expect(screen.getByRole('button', { name: 'Execute' })).toBeDisabled()
})
it('warns about the queued payload without a SafeTransaction', async () => {
  const p = props()
  p.queuedGnosisPayTx!.txData.data = new Interface(['function approve(address,uint256)']).encodeFunctionData(
    'approve',
    [EURE_TOKEN_ADDRESS, 1n],
  )
  render(<GnosisPayExecutionForm {...p} />)
  expect(screen.getByText(/gives an EURe allowance/)).toBeInTheDocument()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Execute' })).toBeEnabled())
})
it('rechecks contract authorization before sending', async () => {
  mockGuard.mockRejectedValue(new Error('Owner revoked'))
  const { container } = render(<GnosisPayExecutionForm {...props()} />)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Execute' })).toBeEnabled())
  fireEvent.submit(container.querySelector('form')!)
  await waitFor(() => expect(mockGuard).toHaveBeenCalled())
  expect(mockExecute).not.toHaveBeenCalled()
})

it('executes only after revalidation and reports the mined transaction', async () => {
  const onSubmit = jest.fn()
  mockExecute.mockResolvedValue({ wait: async () => ({ status: 1, hash: '0xfixture' }) })
  const { container } = render(<GnosisPayExecutionForm {...props()} onSubmit={onSubmit} />)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Execute' })).toBeEnabled())
  fireEvent.submit(container.querySelector('form')!)
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('0xfixture', true))
  expect(mockGuard).toHaveBeenCalledTimes(1)
  expect(mockExecute).toHaveBeenCalledTimes(1)
  expect(mockEnqueue).not.toHaveBeenCalled()
})
it('uses the contract cooldown and queues a new transaction', async () => {
  const onSubmit = jest.fn()
  mockEnqueue.mockResolvedValue({ wait: async () => ({ status: 1, hash: '0xqueued' }) })
  const { container } = render(
    <GnosisPayExecutionForm
      {...props()}
      queuedGnosisPayTx={undefined}
      safeTx={safeTxBuilder().build()}
      onSubmit={onSubmit}
    />,
  )
  expect(screen.getByText(/cooldown of 27 seconds/)).toBeInTheDocument()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Execute' })).toBeEnabled())
  fireEvent.submit(container.querySelector('form')!)
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('0xqueued', undefined))
  expect(mockEnqueue).toHaveBeenCalledTimes(1)
  expect(mockExecute).not.toHaveBeenCalled()
})
