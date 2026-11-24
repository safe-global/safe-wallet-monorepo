import { renderHook, waitFor } from '@/tests/test-utils'
import { useGnosisPayCooldown } from './useGnosisPayCooldown'
import { rpcFixture, DELAY } from '../tests/rpcFixture'
const mockFixture = rpcFixture()
const mockModule = { value: DELAY }
jest.mock('@/hooks/wallets/web3', () => ({ useWeb3ReadOnly: () => mockFixture.provider }))
jest.mock('./useGnosisPayDelayModule', () => ({ useGnosisPayDelayModule: () => [mockModule] }))
beforeEach(() => {
  mockFixture.server.use(mockFixture.handler)
  mockFixture.values.fail = false
})
afterAll(() => mockFixture.provider.destroy())
it('reads the actual configured cooldown rather than assuming three minutes', async () => {
  mockFixture.values.cooldown = 27n
  const { result } = renderHook(() => useGnosisPayCooldown())
  await waitFor(() => expect(result.current).toEqual([27, undefined, false]))
})
it('does not invent a cooldown when the read fails', async () => {
  mockFixture.values.fail = true
  const { result } = renderHook(() => useGnosisPayCooldown())
  await waitFor(() => expect(result.current[1]).toBeInstanceOf(Error))
  expect(result.current[0]).toBeUndefined()
})
