import { getAddress, id, Interface, keccak256 } from 'ethers'
import { faker } from '@faker-js/faker'
import { OperationType } from '@safe-global/types-kit'
import type { PolicyConfiguration } from '../../types'
import {
  createApplyConfigurationTx,
  createFirstSetupTxs,
  createRequestConfigurationTx,
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
