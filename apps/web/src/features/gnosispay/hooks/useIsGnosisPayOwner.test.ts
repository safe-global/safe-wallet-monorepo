import { renderHook, waitFor } from '@/tests/test-utils'
import { useIsGnosisPayOwner } from './useIsGnosisPayOwner'
import { rpcFixture, DELAY, OWNER } from '../tests/rpcFixture'
const mockFixture = rpcFixture()
const mockModule = { value: DELAY }
let mockWallet: { address: string } | undefined = { address: OWNER }
jest.mock('@/hooks/wallets/useWallet', () => () => mockWallet)
jest.mock('@/hooks/wallets/web3', () => ({ useWeb3ReadOnly: () => mockFixture.provider }))
jest.mock('./useGnosisPayDelayModule', () => ({ useGnosisPayDelayModule: () => [mockModule] }))
beforeEach(() => mockFixture.server.use(mockFixture.handler))
afterAll(() => {
  mockFixture.provider.destroy()
})
beforeEach(() => {
  mockWallet = { address: OWNER }
  mockFixture.values.owner = true
  mockFixture.values.fail = false
})
it('checks the connected wallet against enabled Delay modules', async () => {
  const { result } = renderHook(() => useIsGnosisPayOwner())
  await waitFor(() => expect(result.current).toEqual([true, undefined, false]))
  expect(mockFixture.calls).toContain('isModuleEnabled')
})
it('rejects a wallet not enabled on the Delay even with the old localStorage switch', async () => {
  localStorage.setItem('gnosisPayForceOwner', '1')
  mockFixture.values.owner = false
  const { result } = renderHook(() => useIsGnosisPayOwner())
  await waitFor(() => expect(result.current).toEqual([false, undefined, false]))
  localStorage.removeItem('gnosisPayForceOwner')
})
it('rejects a disconnected viewer', async () => {
  mockWallet = undefined
  const { result } = renderHook(() => useIsGnosisPayOwner())
  await waitFor(() => expect(result.current).toEqual([false, undefined, false]))
})
it('surfaces failed ownership reads without authorizing a write', async () => {
  mockFixture.values.fail = true
  const { result } = renderHook(() => useIsGnosisPayOwner())
  await waitFor(() => expect(result.current[1]).toBeInstanceOf(Error))
  expect(result.current[0]).not.toBe(true)
})
