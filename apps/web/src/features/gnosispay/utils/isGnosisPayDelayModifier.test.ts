import { isGnosisPayDelayModifier, GNOSIS_PAY_DELAY_MODIFIER_ADDRESS } from './isGnosisPayDelayModifier'
import { rpcFixture, DELAY } from '../tests/rpcFixture'
const fixture = rpcFixture()
beforeEach(() => fixture.server.use(fixture.handler))
afterAll(() => {
  fixture.provider.destroy()
})
beforeEach(() => {
  fixture.values.fail = false
  fixture.values.code = '0x'
})
it('recognizes the canonical Delay implementation', async () =>
  expect(await isGnosisPayDelayModifier(GNOSIS_PAY_DELAY_MODIFIER_ADDRESS, fixture.provider)).toBe(true))
it('recognizes an EIP-1167 proxy to the Delay implementation', async () => {
  fixture.values.code = `0x363d3d373d3d3d363d73${GNOSIS_PAY_DELAY_MODIFIER_ADDRESS.slice(2)}5af43d82803e903d91602b57fd5bf3`
  expect(await isGnosisPayDelayModifier(DELAY, fixture.provider)).toBe(true)
})
it('rejects unrelated bytecode and invalid addresses', async () => {
  expect(await isGnosisPayDelayModifier(DELAY, fixture.provider)).toBe(false)
  expect(await isGnosisPayDelayModifier('invalid', fixture.provider)).toBe(false)
})
it('bounds cyclic proxy chains', async () => {
  fixture.values.code = `0x363d3d373d3d3d363d73${DELAY.slice(2)}5af43d82803e903d91602b57fd5bf3`
  expect(await isGnosisPayDelayModifier(DELAY, fixture.provider)).toBe(false)
})
it('propagates failed RPC reads', async () => {
  fixture.values.fail = true
  await expect(isGnosisPayDelayModifier(DELAY, fixture.provider)).rejects.toThrow()
})

it('reads the full masterCopy address returned by a Gnosis proxy', async () => {
  fixture.values.code =
    '0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea265627a7a72315820d8a00dc4fe6bf675a9d7416fc2d00bb3433362aa8186b750f76c4027269667ff64736f6c634300050e0032'
  fixture.values.masterCopy = GNOSIS_PAY_DELAY_MODIFIER_ADDRESS
  expect(await isGnosisPayDelayModifier(DELAY, fixture.provider)).toBe(true)
})
