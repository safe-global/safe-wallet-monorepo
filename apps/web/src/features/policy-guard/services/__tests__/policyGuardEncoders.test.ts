import { Safe__factory } from '@safe-global/utils/types/contracts/factories/@safe-global/safe-deployments/dist/assets/v1.5.0/Safe__factory'
import { getAddress, id, Interface, keccak256 } from 'ethers'
import { faker } from '@faker-js/faker'
import { OperationType } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { PolicyConfiguration } from '../../types'
import {
  createApplyConfigurationTx,
  createFirstSetupTxs,
  createRemoveGuardTxs,
  createRequestConfigurationTx,
  createSetGuardTx,
  createSetModuleGuardTx,
  describeSetupCall,
  getCallConfigurations,
  getConfigurationRoot,
} from '../policyGuardEncoders'

const TUPLE = 'tuple(address target, bytes4 selector, uint8 operation, address policy, bytes data)'
const guardIface = new Interface([
  `function configureImmediately(${TUPLE}[] configurations)`,
  'function requestConfiguration(bytes32 configureRoot)',
  `function applyConfiguration(${TUPLE}[] configurations)`,
])
const safeIface = new Interface(['function setGuard(address)', 'function setModuleGuard(address)'])

const safeAddress = getAddress(faker.finance.ethereumAddress())
const guardAddress = getAddress(faker.finance.ethereumAddress())
const configurations: PolicyConfiguration[] = [
  {
    target: faker.finance.ethereumAddress(),
    selector: '0xa9059cbb',
    operation: OperationType.Call,
    policy: faker.finance.ethereumAddress(),
    data: '0x1234',
  },
]

describe('createFirstSetupTxs', () => {
  it('configures before setting either guard slot', () => {
    const txs = createFirstSetupTxs({ safeAddress, guardAddress, configurations })

    expect(txs.map((tx) => tx.to)).toEqual([guardAddress, safeAddress, safeAddress])
    expect(guardIface.parseTransaction({ data: txs[0].data })?.name).toBe('configureImmediately')
    expect(safeIface.parseTransaction({ data: txs[1].data })?.name).toBe('setGuard')
    expect(safeIface.parseTransaction({ data: txs[1].data })?.args[0]).toBe(guardAddress)
    expect(safeIface.parseTransaction({ data: txs[2].data })?.name).toBe('setModuleGuard')
    expect(safeIface.parseTransaction({ data: txs[2].data })?.args[0]).toBe(guardAddress)
    expect(txs.every((tx) => tx.value === '0')).toBe(true)
  })

  it('round-trips the configurations', () => {
    const [configure] = createFirstSetupTxs({ safeAddress, guardAddress, configurations })
    const [decoded] = guardIface.decodeFunctionData('configureImmediately', configure.data)
    expect(decoded[0].selector).toBe('0xa9059cbb')
    expect(Number(decoded[0].operation)).toBe(OperationType.Call)
    expect(decoded[0].data).toBe('0x1234')
  })
})

describe('createSetGuardTx / createSetModuleGuardTx', () => {
  it('target the Safe with the guard address', () => {
    const guardTx = createSetGuardTx(safeAddress, guardAddress)
    const moduleTx = createSetModuleGuardTx(safeAddress, guardAddress)
    expect([guardTx.to, moduleTx.to]).toEqual([safeAddress, safeAddress])
    expect(safeIface.parseTransaction({ data: guardTx.data })?.name).toBe('setGuard')
    expect(safeIface.parseTransaction({ data: moduleTx.data })?.name).toBe('setModuleGuard')
    expect(safeIface.parseTransaction({ data: moduleTx.data })?.args[0]).toBe(guardAddress)
  })
})

describe('createRemoveGuardTxs', () => {
  it('should set both guard slots of the Safe to the zero address, when the guard comes off', () => {
    const [guardTx, moduleTx] = createRemoveGuardTxs(safeAddress)

    expect([guardTx.to, moduleTx.to]).toEqual([safeAddress, safeAddress])
    expect(safeIface.parseTransaction({ data: guardTx.data })?.name).toBe('setGuard')
    expect(safeIface.parseTransaction({ data: guardTx.data })?.args[0]).toBe(ZERO_ADDRESS)
    expect(safeIface.parseTransaction({ data: moduleTx.data })?.name).toBe('setModuleGuard')
    expect(safeIface.parseTransaction({ data: moduleTx.data })?.args[0]).toBe(ZERO_ADDRESS)
  })
})

describe('createRequestConfigurationTx', () => {
  it('passes the root through to the guard', () => {
    const root = `0x${'ab'.repeat(32)}`
    const tx = createRequestConfigurationTx(guardAddress, root)
    expect(tx.to).toBe(guardAddress)
    expect(guardIface.decodeFunctionData('requestConfiguration', tx.data)[0]).toBe(root)
  })
})

describe('createApplyConfigurationTx', () => {
  it('sends the full configuration array, not the root', () => {
    const tx = createApplyConfigurationTx(guardAddress, configurations)
    expect(tx.to).toBe(guardAddress)
    expect(guardIface.parseTransaction({ data: tx.data })?.name).toBe('applyConfiguration')
  })
})

describe('getConfigurationRoot', () => {
  it('is stable for equal input and changes with the input', () => {
    const root = getConfigurationRoot(configurations)
    expect(root).toMatch(/^0x[0-9a-f]{64}$/)
    expect(getConfigurationRoot([...configurations])).toBe(root)
    expect(getConfigurationRoot([{ ...configurations[0], data: '0x' }])).not.toBe(root)
  })
})

describe('selectors', () => {
  const CONFIGURATION = '(address,bytes4,uint8,address,bytes)'
  const selectorOf = (signature: string) => id(signature).slice(0, 10)

  it('match the canonical SafePolicyGuard and Safe signatures', () => {
    const [configure, setGuard, setModuleGuard] = createFirstSetupTxs({ safeAddress, guardAddress, configurations })

    expect(configure.data.slice(0, 10)).toBe(selectorOf(`configureImmediately(${CONFIGURATION}[])`))
    expect(setGuard.data.slice(0, 10)).toBe(selectorOf('setGuard(address)'))
    expect(setModuleGuard.data.slice(0, 10)).toBe(selectorOf('setModuleGuard(address)'))
    expect(createRequestConfigurationTx(guardAddress, `0x${'00'.repeat(32)}`).data.slice(0, 10)).toBe(
      selectorOf('requestConfiguration(bytes32)'),
    )
    expect(createApplyConfigurationTx(guardAddress, configurations).data.slice(0, 10)).toBe(
      selectorOf(`applyConfiguration(${CONFIGURATION}[])`),
    )
  })
})

describe('getConfigurationRoot vs applyConfiguration', () => {
  it('hashes exactly the arguments applyConfiguration sends, as the contract recomputes them', () => {
    const { data } = createApplyConfigurationTx(guardAddress, configurations)
    expect(getConfigurationRoot(configurations)).toBe(keccak256(`0x${data.slice(10)}`))
  })
})

describe('describeSetupCall', () => {
  it('names the guard calls without params', () => {
    const [configure] = createFirstSetupTxs({ safeAddress, guardAddress, configurations })
    const request = createRequestConfigurationTx(guardAddress, getConfigurationRoot(configurations))

    expect(describeSetupCall(configure)).toEqual({ method: 'configureImmediately', target: 'guard' })
    expect(describeSetupCall(request)).toEqual({ method: 'requestConfiguration', target: 'guard' })
  })

  it.each([
    ['setGuard', 'guard', createSetGuardTx],
    ['setModuleGuard', 'moduleGuard', createSetModuleGuardTx],
  ] as const)('names %s with the guard it sets', (method, name, create) => {
    expect(describeSetupCall(create(safeAddress, guardAddress))).toEqual({
      method,
      target: 'safe',
      param: { name, value: guardAddress },
    })
  })

  it('returns undefined for a call it does not know', () => {
    expect(describeSetupCall({ data: '0xa9059cbb' })).toBeUndefined()
    expect(describeSetupCall({ data: '0x' })).toBeUndefined()
    expect(
      describeSetupCall({ data: Safe__factory.createInterface().encodeFunctionData('changeThreshold', [1]) }),
    ).toBeUndefined()
  })
})

describe('getCallConfigurations', () => {
  const decoded = configurations.map((configuration) => ({
    ...configuration,
    target: getAddress(configuration.target),
    policy: getAddress(configuration.policy),
  }))

  it('should read the configurations from the calldata, when the call configures immediately', () => {
    const [configure] = createFirstSetupTxs({ safeAddress, guardAddress, configurations })

    expect(getCallConfigurations(configure)).toEqual(decoded)
  })

  it('should read the configurations from the calldata, when the call applies them', () => {
    expect(getCallConfigurations(createApplyConfigurationTx(guardAddress, configurations))).toEqual(decoded)
  })

  it('should return the requested configurations, when they hash to the root of the request', () => {
    const request = createRequestConfigurationTx(guardAddress, getConfigurationRoot(configurations))

    expect(getCallConfigurations(request, configurations)).toBe(configurations)
  })

  it('should return nothing, when the requested configurations do not hash to the root of the request', () => {
    const request = createRequestConfigurationTx(guardAddress, getConfigurationRoot(configurations))

    expect(getCallConfigurations(request, [{ ...configurations[0], data: '0x' }])).toBeUndefined()
    expect(getCallConfigurations(request)).toBeUndefined()
  })

  it('should return nothing, when the call is not a configuring call', () => {
    expect(getCallConfigurations(createSetGuardTx(safeAddress, guardAddress))).toBeUndefined()
    expect(getCallConfigurations({ data: '0x' })).toBeUndefined()
  })

  it('should return nothing, when the calldata of a configuring call is malformed', () => {
    const { data } = createApplyConfigurationTx(guardAddress, configurations)

    expect(getCallConfigurations({ data: data.slice(0, 20) })).toBeUndefined()
  })
})
