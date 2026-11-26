import { OperationType } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { isAllowlistRemoval, isGuardRemovalCleanup, isSetGuardAccess } from '../guardExit'
import { buildGuardRemovalCleanupConfigurations } from '../guardRemoval'

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

describe('isGuardRemovalCleanup', () => {
  it('should match, when the configurations are the clean-up root that a removal requests', () => {
    expect(isGuardRemovalCleanup(buildGuardRemovalCleanupConfigurations('11155111', SAFE), SAFE)).toBe(true)
  })

  it('should match, when the configurations unbind only the three Safe setters', () => {
    expect(
      isGuardRemovalCleanup(
        [
          { target: SAFE, selector: '0xe19a9dd9', operation: OperationType.Call, policy: ZERO_ADDRESS },
          { target: SAFE, selector: '0xe068df37', operation: OperationType.Call, policy: ZERO_ADDRESS },
          { target: SAFE, selector: '0xf08a0323', operation: OperationType.Call, policy: ZERO_ADDRESS },
        ],
        SAFE,
      ),
    ).toBe(true)
  })

  it('should, when the configurations unbind the three Safe setters and the reject access, match', () => {
    expect(
      isGuardRemovalCleanup(
        [
          { target: SAFE, selector: '0xe19a9dd9', operation: OperationType.Call, policy: ZERO_ADDRESS },
          { target: SAFE, selector: '0xe068df37', operation: OperationType.Call, policy: ZERO_ADDRESS },
          { target: SAFE, selector: '0xf08a0323', operation: OperationType.Call, policy: ZERO_ADDRESS },
          { target: SAFE, selector: '0x00000000', operation: OperationType.Call, policy: ZERO_ADDRESS },
        ],
        SAFE,
      ),
    ).toBe(true)
  })

  it("should not match, when the configurations do not unbind the Safe's setFallbackHandler", () => {
    expect(
      isGuardRemovalCleanup(
        [
          { target: SAFE, selector: '0xe19a9dd9', operation: OperationType.Call, policy: ZERO_ADDRESS },
          { target: SAFE, selector: '0xe068df37', operation: OperationType.Call, policy: ZERO_ADDRESS },
          { target: ZERO_ADDRESS, selector: '0x00000000', operation: OperationType.Call, policy: ZERO_ADDRESS },
        ],
        SAFE,
      ),
    ).toBe(false)
  })

  it('should not match, when the configurations also unbind a token rule', () => {
    expect(
      isGuardRemovalCleanup(
        [
          ...buildGuardRemovalCleanupConfigurations('11155111', SAFE),
          { target: OTHER_SAFE, selector: '0xa9059cbb', operation: OperationType.Call, policy: ZERO_ADDRESS },
        ],
        SAFE,
      ),
    ).toBe(false)
  })

  it("should not match, when a configuration binds a policy to the Safe's setGuard", () => {
    expect(
      isGuardRemovalCleanup(
        [
          { target: SAFE, selector: '0xe19a9dd9', operation: OperationType.Call, policy: ALLOW_POLICY },
          { target: SAFE, selector: '0xe068df37', operation: OperationType.Call, policy: ZERO_ADDRESS },
          { target: SAFE, selector: '0xf08a0323', operation: OperationType.Call, policy: ZERO_ADDRESS },
        ],
        SAFE,
      ),
    ).toBe(false)
  })

  it('should not match, when the setters it unbinds are those of another Safe', () => {
    expect(isGuardRemovalCleanup(buildGuardRemovalCleanupConfigurations('11155111', OTHER_SAFE), SAFE)).toBe(false)
  })

  it('should not match, when there are no configurations', () => {
    expect(isGuardRemovalCleanup([], SAFE)).toBe(false)
  })
})
