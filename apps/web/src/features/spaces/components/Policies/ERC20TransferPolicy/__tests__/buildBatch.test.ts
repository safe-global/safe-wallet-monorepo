import { AbiCoder, Interface } from 'ethers'
import type { Address } from 'viem'
import { buildTokenWithdrawBatch, type BuildTokenWithdrawBatchInput } from '../buildBatch'
import {
  SAFE_SET_GUARD_ABI,
  CONFIGURE_IMMEDIATELY_ABI,
  REQUEST_CONFIGURATION_ABI,
  computeConfigureRoot,
  OPERATION_CALL,
} from '../../shared/guardTx'
import { ERC20_TRANSFER_SELECTOR, ERC20_TRANSFER_FROM_SELECTOR, RECIPIENT_DATA_TYPE } from '../contracts'

const SAFE: Address = '0x1111111111111111111111111111111111111111'
const GUARD: Address = '0x2222222222222222222222222222222222222222'
const POLICY: Address = '0x3333333333333333333333333333333333333333'
const USDC: Address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DAI: Address = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const R1: Address = '0xdead00000000000000000000000000000000de01'
const R2: Address = '0xdead00000000000000000000000000000000de02'
const FOREIGN: Address = '0x9999999999999999999999999999999999999999'

const baseInput = (overrides: Partial<BuildTokenWithdrawBatchInput> = {}): BuildTokenWithdrawBatchInput => ({
  safeAddress: SAFE,
  safePolicyGuard: GUARD,
  policyContract: POLICY,
  allowlist: [{ token: USDC, recipients: [{ address: R1, allowed: true }] }],
  ...overrides,
})

const guardIface = new Interface(CONFIGURE_IMMEDIATELY_ABI)
const safeIface = new Interface(SAFE_SET_GUARD_ABI)
const requestIface = new Interface(REQUEST_CONFIGURATION_ABI)

/** Decode the configureImmediately Configuration[] from a tx's calldata. */
const decodeConfigs = (data: string) => {
  const [configs] = guardIface.decodeFunctionData('configureImmediately', data)
  return configs as Array<[string, string, bigint, string, string]>
}

const decodeRecipients = (dataField: string) =>
  AbiCoder.defaultAbiCoder().decode([RECIPIENT_DATA_TYPE], dataField)[0] as Array<[string, boolean]>

describe('buildTokenWithdrawBatch — immediate path (guard not yet active)', () => {
  it('prepends setGuard when no guard is installed, then configureImmediately', () => {
    const { txs, mode } = buildTokenWithdrawBatch(baseInput({ currentGuard: undefined }))

    expect(mode).toBe('immediate')
    expect(txs).toHaveLength(2)
    expect(txs[0].to).toBe(SAFE)
    const [guardArg] = safeIface.decodeFunctionData('setGuard', txs[0].data)
    expect(guardArg.toLowerCase()).toBe(GUARD.toLowerCase())
    expect(txs[1].to).toBe(GUARD) // configureImmediately targets the guard
  })

  it('throws on an unknown guard unless overwrite is explicitly allowed', () => {
    expect(() => buildTokenWithdrawBatch(baseInput({ currentGuard: FOREIGN }))).toThrow(/different transaction guard/i)

    const { txs, mode } = buildTokenWithdrawBatch(baseInput({ currentGuard: FOREIGN, allowOverwriteGuard: true }))
    expect(mode).toBe('immediate')
    expect(txs).toHaveLength(2) // setGuard overwrites + configure
    expect(txs[1].to).toBe(GUARD)
  })

  it('builds one Configuration per token with the right fields', () => {
    const { txs } = buildTokenWithdrawBatch(baseInput({ currentGuard: undefined }))
    const configs = decodeConfigs(txs[1].data)

    expect(configs).toHaveLength(1)
    const [target, selector, operation, policy] = configs[0]
    expect(target.toLowerCase()).toBe(USDC.toLowerCase())
    expect(selector).toBe(ERC20_TRANSFER_SELECTOR)
    expect(Number(operation)).toBe(0)
    expect(policy.toLowerCase()).toBe(POLICY.toLowerCase())
  })

  it('builds one Configuration per token, order preserved', () => {
    const { txs } = buildTokenWithdrawBatch(
      baseInput({
        currentGuard: undefined,
        allowlist: [
          { token: USDC, recipients: [{ address: R1, allowed: true }] },
          { token: DAI, recipients: [{ address: R2, allowed: true }] },
        ],
      }),
    )
    const configs = decodeConfigs(txs[1].data)
    expect(configs.map((c) => c[0].toLowerCase())).toEqual([USDC.toLowerCase(), DAI.toLowerCase()])
  })

  it('adds a transferFrom Configuration when restrictTransferFrom is set', () => {
    const { txs } = buildTokenWithdrawBatch(baseInput({ currentGuard: undefined, restrictTransferFrom: true }))
    const configs = decodeConfigs(txs[1].data)

    expect(configs).toHaveLength(2)
    expect(configs.map((c) => c[1])).toEqual([ERC20_TRANSFER_SELECTOR, ERC20_TRANSFER_FROM_SELECTOR])
  })

  it('encodes data that decodes back to the exact RecipientData[]', () => {
    const { txs } = buildTokenWithdrawBatch(
      baseInput({
        currentGuard: undefined,
        allowlist: [{ token: USDC, recipients: [{ address: R1, allowed: true }] }],
      }),
    )
    const [, , , , data] = decodeConfigs(txs[1].data)[0]
    const recipients = decodeRecipients(data)

    expect(recipients).toHaveLength(1)
    expect(recipients[0][0].toLowerCase()).toBe(R1.toLowerCase())
    expect(recipients[0][1]).toBe(true)
  })

  it('edit mode: encodes removed recipients as allowed:false, added as true', () => {
    const { txs } = buildTokenWithdrawBatch(
      baseInput({
        currentGuard: undefined,
        allowlist: [
          {
            token: USDC,
            recipients: [
              { address: R1, allowed: true }, // kept/added
              { address: R2, allowed: false }, // removed
            ],
          },
        ],
      }),
    )
    const [, , , , data] = decodeConfigs(txs[1].data)[0]
    const recipients = decodeRecipients(data)
    const byAddr = Object.fromEntries(recipients.map((r) => [r[0].toLowerCase(), r[1]]))

    expect(byAddr[R1.toLowerCase()]).toBe(true)
    expect(byAddr[R2.toLowerCase()]).toBe(false)
  })

  it('de-dupes recipients by address and checksums them', () => {
    const { txs } = buildTokenWithdrawBatch(
      baseInput({
        currentGuard: undefined,
        allowlist: [
          {
            token: USDC,
            recipients: [
              { address: R1.toLowerCase() as Address, allowed: true },
              { address: R1.toLowerCase() as Address, allowed: false }, // same address again — last wins
            ],
          },
        ],
      }),
    )
    const [, , , , data] = decodeConfigs(txs[1].data)[0]
    const recipients = decodeRecipients(data)

    expect(recipients).toHaveLength(1)
    expect(recipients[0][1]).toBe(false) // last write won
    // Encoded address is checksummed, not the lowercase input.
    expect(recipients[0][0]).not.toBe(R1.toLowerCase())
    expect(recipients[0][0].toLowerCase()).toBe(R1.toLowerCase())
  })
})

describe('buildTokenWithdrawBatch — request path (guard already active)', () => {
  it('emits a single requestConfiguration tx when the policy guard is already installed', () => {
    const { txs, mode } = buildTokenWithdrawBatch(baseInput({ currentGuard: GUARD }))

    expect(mode).toBe('request')
    expect(txs).toHaveLength(1)
    expect(txs[0].to).toBe(GUARD)
    expect(() => requestIface.decodeFunctionData('requestConfiguration', txs[0].data)).not.toThrow()
    // It is NOT configureImmediately.
    expect(() => guardIface.decodeFunctionData('configureImmediately', txs[0].data)).toThrow()
  })

  it('takes the request path even when the current guard differs only by case', () => {
    const { txs, mode } = buildTokenWithdrawBatch(
      baseInput({ currentGuard: GUARD.toUpperCase().replace('0X', '0x') as Address }),
    )
    expect(mode).toBe('request')
    expect(txs).toHaveLength(1)
  })

  it('requests the root that matches keccak256(abi.encode(Configuration[]))', () => {
    const { txs } = buildTokenWithdrawBatch(baseInput({ currentGuard: GUARD }))
    const [root] = requestIface.decodeFunctionData('requestConfiguration', txs[0].data)

    // Recompute the expected root from the same Configuration the immediate path
    // would build, and assert the request commits to exactly that.
    const expectedRoot = computeConfigureRoot([
      {
        target: USDC,
        selector: ERC20_TRANSFER_SELECTOR,
        operation: OPERATION_CALL,
        policy: POLICY,
        data: AbiCoder.defaultAbiCoder().encode([RECIPIENT_DATA_TYPE], [[[R1, true]]]),
      },
    ])
    expect(root.toLowerCase()).toBe(expectedRoot.toLowerCase())
  })
})

describe('buildTokenWithdrawBatch — validation (both paths)', () => {
  it('throws on empty tokens or empty recipients', () => {
    expect(() => buildTokenWithdrawBatch(baseInput({ allowlist: [] }))).toThrow(/at least one token/i)
    expect(() => buildTokenWithdrawBatch(baseInput({ allowlist: [{ token: USDC, recipients: [] }] }))).toThrow(
      /at least one recipient/i,
    )
  })

  it('throws when guard or policy address is missing/invalid', () => {
    // Deliberately-invalid inputs: cast past the Address type to exercise the runtime guard.
    expect(() => buildTokenWithdrawBatch(baseInput({ safePolicyGuard: '' as Address }))).toThrow(/SafePolicyGuard/i)
    expect(() => buildTokenWithdrawBatch(baseInput({ policyContract: 'not-an-address' as Address }))).toThrow(
      /ERC20TransferPolicy/i,
    )
  })

  it('throws on an invalid token address', () => {
    expect(() =>
      buildTokenWithdrawBatch(
        baseInput({
          currentGuard: undefined,
          allowlist: [{ token: '0xnope' as Address, recipients: [{ address: R1, allowed: true }] }],
        }),
      ),
    ).toThrow(/token address/i)
  })

  it('throws on an invalid recipient address', () => {
    expect(() =>
      buildTokenWithdrawBatch(
        baseInput({
          currentGuard: undefined,
          allowlist: [{ token: USDC, recipients: [{ address: '0xbad' as Address, allowed: true }] }],
        }),
      ),
    ).toThrow(/recipient address/i)
  })
})
