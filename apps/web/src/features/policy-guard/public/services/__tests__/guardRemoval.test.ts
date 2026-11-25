import { getAddress } from 'ethers'
import { faker } from '@faker-js/faker'
import { OperationType } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { buildGuardRemovalCleanupConfigurations } from '../guardRemoval'

const CHAIN_ID = '11155111'
const SAFE = getAddress(faker.finance.ethereumAddress())
const MULTI_SEND_CALL_ONLY = [
  '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
  '0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B',
  '0x9641d764fc13c8B624c04430C7356C1C7C8102e2',
  '0xA83c336B20401Af773B6219BA5027174338D1836',
]

const unbind = (target: string, selector: string, operation = OperationType.Call) => ({
  target,
  selector,
  operation,
  policy: ZERO_ADDRESS,
  data: '0x',
})

describe('buildGuardRemovalCleanupConfigurations', () => {
  it('should unbind the three Safe setters, the reject access, every MultiSendCallOnly rule and both fallback rules, when the guard comes off', () => {
    const configurations = buildGuardRemovalCleanupConfigurations(CHAIN_ID, SAFE)

    expect(configurations.slice(0, 4)).toEqual([
      unbind(SAFE, '0xe19a9dd9'),
      unbind(SAFE, '0xe068df37'),
      unbind(SAFE, '0xf08a0323'),
      unbind(SAFE, '0x00000000'),
    ])
    expect(
      configurations
        .slice(4, -2)
        .map(({ target }) => target)
        .sort(),
    ).toEqual([...MULTI_SEND_CALL_ONLY].sort())
    expect(configurations.slice(4, -2)[0]).toEqual(
      unbind(configurations[4].target, '0x8d80ff0a', OperationType.DelegateCall),
    )
    expect(configurations.slice(-2)).toEqual([
      unbind(ZERO_ADDRESS, '0x00000000', OperationType.Call),
      unbind(ZERO_ADDRESS, '0x00000000', OperationType.DelegateCall),
    ])
  })
})
