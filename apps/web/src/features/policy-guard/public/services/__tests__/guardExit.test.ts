import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { isAllowlistRemoval, isSetGuardAccess } from '../guardExit'

const SAFE = '0x5afe5afE5afE5afE5afE5aFe5afe5Afe5afE5AFe'
const OTHER_SAFE = '0x1111111111111111111111111111111111111111'
const ALLOW_POLICY = '0x92e94Af03982C2486dffa8DcBc5d069D33996eF2'

describe('isSetGuardAccess', () => {
  it("should match, when the access is the Safe's setGuard in any casing", () => {
    expect(isSetGuardAccess({ target: SAFE.toLowerCase(), selector: '0xE19A9DD9' }, SAFE)).toBe(true)
  })

  it("should not match, when the access is the Safe's setModuleGuard", () => {
    expect(isSetGuardAccess({ target: SAFE, selector: '0xe068df37' }, SAFE)).toBe(false)
  })

  it("should not match, when the access is another Safe's setGuard", () => {
    expect(isSetGuardAccess({ target: OTHER_SAFE, selector: '0xe19a9dd9' }, SAFE)).toBe(false)
  })
})

describe('isAllowlistRemoval', () => {
  it("should be a removal, when a configuration binds a policy to the Safe's setGuard", () => {
    expect(isAllowlistRemoval([{ target: SAFE, selector: '0xe19a9dd9', policy: ALLOW_POLICY }], SAFE)).toBe(true)
  })

  it("should not be a removal, when the configuration unbinds the Safe's setGuard", () => {
    expect(isAllowlistRemoval([{ target: SAFE, selector: '0xe19a9dd9', policy: ZERO_ADDRESS }], SAFE)).toBe(false)
  })

  it('should not be a removal, when no configuration touches setGuard', () => {
    expect(isAllowlistRemoval([{ target: OTHER_SAFE, selector: '0xa9059cbb', policy: ALLOW_POLICY }], SAFE)).toBe(false)
  })
})
