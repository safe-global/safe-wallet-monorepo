import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@testing-library/react'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { getAddress, JsonRpcProvider, ZeroAddress } from 'ethers'
import type { SafeTransaction } from '@safe-global/types-kit'
import { ERC721__factory, Multi_send__factory, Safe__factory } from '@safe-global/utils/types/contracts'
import { decodeSetGuardTargets, useGuardCheck } from '../useGuardCheck'
import { Severity, ThreatStatus } from '../../types'

jest.mock('@safe-global/utils/types/contracts', () => {
  const actual = jest.requireActual('@safe-global/utils/types/contracts')
  return {
    ...actual,
    ERC721__factory: {
      ...actual.ERC721__factory,
      connect: jest.fn(),
    },
  }
})

const safeInterface = Safe__factory.createInterface()
const multiSendInterface = Multi_send__factory.createInterface()
const mockedConnect = ERC721__factory.connect as jest.Mock

const mockSupportsInterface = (impl: () => Promise<boolean>) => {
  mockedConnect.mockReturnValue({ supportsInterface: jest.fn().mockImplementation(impl) })
}

const encodeSetGuard = (guard: string) => safeInterface.encodeFunctionData('setGuard', [guard])

// Builds an ethers-shaped rejection so the hook can classify reverts vs. transport failures.
const rpcError = (code: string): Error => Object.assign(new Error(code), { code })

// The hook only reads safeTx.data.{to,data,operation}; build a minimal transaction targeting `to`.
const makeTx = (to: string, data: string, operation = 0): SafeTransaction =>
  ({ data: { to, value: '0', data, operation } }) as unknown as SafeTransaction

const makeSetGuardTx = (guard: string, to: string): SafeTransaction => makeTx(to, encodeSetGuard(guard))

// Wraps inner calls in a MultiSend batch (operation 1, delegatecall to the MultiSend contract).
const makeMultiSendTx = (inner: Array<{ to: string; data: string }>, operation = 1): SafeTransaction => {
  const transactions = encodeMultiSendData(inner.map(({ to, data }) => ({ to, value: '0', data, operation: 0 })))
  return makeTx(
    getAddress(faker.finance.ethereumAddress()),
    multiSendInterface.encodeFunctionData('multiSend', [transactions]),
    operation,
  )
}

const web3ReadOnly = {} as JsonRpcProvider

describe('decodeSetGuardTargets', () => {
  const safeAddress = getAddress(faker.finance.ethereumAddress())
  const guard = getAddress(faker.finance.ethereumAddress())

  it('decodes the guard address for a setGuard call targeting the Safe', () => {
    expect(decodeSetGuardTargets(makeSetGuardTx(guard, safeAddress), safeAddress)).toEqual([guard])
  })

  it('decodes a setGuard nested in a MultiSend batch', () => {
    const other = getAddress(faker.finance.ethereumAddress())
    const tx = makeMultiSendTx([
      { to: other, data: '0xdeadbeef' },
      { to: safeAddress, data: encodeSetGuard(guard) },
    ])
    expect(decodeSetGuardTargets(tx, safeAddress)).toEqual([guard])
  })

  it('ignores a nested setGuard targeting a different contract', () => {
    const other = getAddress(faker.finance.ethereumAddress())
    const tx = makeMultiSendTx([{ to: other, data: encodeSetGuard(guard) }])
    expect(decodeSetGuardTargets(tx, safeAddress)).toEqual([])
  })

  it('ignores a MultiSend-shaped payload that is not a delegatecall', () => {
    const tx = makeMultiSendTx([{ to: safeAddress, data: encodeSetGuard(guard) }], 0)
    expect(decodeSetGuardTargets(tx, safeAddress)).toEqual([])
  })

  it('returns empty when the transaction targets a different contract', () => {
    const other = getAddress(faker.finance.ethereumAddress())
    expect(decodeSetGuardTargets(makeSetGuardTx(guard, other), safeAddress)).toEqual([])
  })

  it('returns empty for a non-setGuard transaction', () => {
    expect(decodeSetGuardTargets(makeTx(safeAddress, '0xdeadbeef'), safeAddress)).toEqual([])
  })

  it('returns empty when there is no transaction', () => {
    expect(decodeSetGuardTargets(undefined, safeAddress)).toEqual([])
  })
})

describe('useGuardCheck', () => {
  const safeAddress = getAddress(faker.finance.ethereumAddress())
  const guard = getAddress(faker.finance.ethereumAddress())

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderGuardCheck = (props: Parameters<typeof useGuardCheck>[0]) => renderHook(() => useGuardCheck(props))

  it('flags a guard that does not implement the interface (supportsInterface returns false)', async () => {
    mockSupportsInterface(() => Promise.resolve(false))

    const { result } = renderGuardCheck({
      safeTx: makeSetGuardTx(guard, safeAddress),
      safeAddress,
      safeVersion: '1.3.0',
      web3ReadOnly,
    })

    await waitFor(() => expect(result.current[2]).toBe(false))

    const [findings] = result.current
    expect(findings).toHaveLength(1)
    expect(findings?.[0].type).toBe(ThreatStatus.INVALID_GUARD)
    expect(findings?.[0].severity).toBe(Severity.CRITICAL)
    expect(findings?.[0].addresses?.[0].address).toBe(guard)
  })

  it('flags an invalid guard nested in a MultiSend batch', async () => {
    mockSupportsInterface(() => Promise.resolve(false))
    const other = getAddress(faker.finance.ethereumAddress())
    const tx = makeMultiSendTx([
      { to: other, data: '0xdeadbeef' },
      { to: safeAddress, data: encodeSetGuard(guard) },
    ])

    const { result } = renderGuardCheck({ safeTx: tx, safeAddress, safeVersion: '1.3.0', web3ReadOnly })

    await waitFor(() => expect(result.current[2]).toBe(false))
    expect(result.current[0]?.[0].type).toBe(ThreatStatus.INVALID_GUARD)
    expect(result.current[0]?.[0].addresses?.[0].address).toBe(guard)
  })

  it('flags a guard when the interface check reverts (EOA / no ERC-165)', async () => {
    mockSupportsInterface(() => Promise.reject(rpcError('BAD_DATA')))

    const { result } = renderGuardCheck({
      safeTx: makeSetGuardTx(guard, safeAddress),
      safeAddress,
      safeVersion: '1.3.0',
      web3ReadOnly,
    })

    await waitFor(() => expect(result.current[2]).toBe(false))
    expect(result.current[0]?.[0].type).toBe(ThreatStatus.INVALID_GUARD)
  })

  it('does not flag a guard when the interface check hits a transport error', async () => {
    mockSupportsInterface(() => Promise.reject(rpcError('TIMEOUT')))

    const { result } = renderGuardCheck({
      safeTx: makeSetGuardTx(guard, safeAddress),
      safeAddress,
      safeVersion: '1.3.0',
      web3ReadOnly,
    })

    await waitFor(() => expect(result.current[2]).toBe(false))
    // Inconclusive failure surfaces as an error, never a false "bricked Safe" finding.
    expect(result.current[0]).toBeUndefined()
    expect(result.current[1]).toBeInstanceOf(Error)
  })

  it('does not flag a guard that implements the interface', async () => {
    mockSupportsInterface(() => Promise.resolve(true))

    const { result } = renderGuardCheck({
      safeTx: makeSetGuardTx(guard, safeAddress),
      safeAddress,
      safeVersion: '1.3.0',
      web3ReadOnly,
    })

    await waitFor(() => expect(result.current[2]).toBe(false))
    expect(result.current[0]).toEqual([])
  })

  it('skips the check when removing a guard (address(0))', async () => {
    mockSupportsInterface(() => Promise.resolve(false))

    const { result } = renderGuardCheck({
      safeTx: makeSetGuardTx(ZeroAddress, safeAddress),
      safeAddress,
      safeVersion: '1.3.0',
      web3ReadOnly,
    })

    await waitFor(() => expect(result.current[2]).toBe(false))
    expect(result.current[0]).toBeUndefined()
    expect(mockedConnect).not.toHaveBeenCalled()
  })

  it('skips the check on Safes >= 1.4.1 (contract self-protects)', async () => {
    mockSupportsInterface(() => Promise.resolve(false))

    const { result } = renderGuardCheck({
      safeTx: makeSetGuardTx(guard, safeAddress),
      safeAddress,
      safeVersion: '1.4.1',
      web3ReadOnly,
    })

    await waitFor(() => expect(result.current[2]).toBe(false))
    expect(result.current[0]).toBeUndefined()
    expect(mockedConnect).not.toHaveBeenCalled()
  })

  it('skips non-setGuard transactions', async () => {
    mockSupportsInterface(() => Promise.resolve(false))
    const tx = {
      data: { to: safeAddress, value: '0', data: '0xdeadbeef', operation: 0 },
    } as unknown as SafeTransaction

    const { result } = renderGuardCheck({ safeTx: tx, safeAddress, safeVersion: '1.3.0', web3ReadOnly })

    await waitFor(() => expect(result.current[2]).toBe(false))
    expect(result.current[0]).toBeUndefined()
    expect(mockedConnect).not.toHaveBeenCalled()
  })

  it('skips when no read-only provider is available', async () => {
    const { result } = renderGuardCheck({
      safeTx: makeSetGuardTx(guard, safeAddress),
      safeAddress,
      safeVersion: '1.3.0',
      web3ReadOnly: undefined,
    })

    await waitFor(() => expect(result.current[2]).toBe(false))
    expect(result.current[0]).toBeUndefined()
    expect(mockedConnect).not.toHaveBeenCalled()
  })
})
