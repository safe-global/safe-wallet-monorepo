import { faker } from '@faker-js/faker'
import { getAddress, Interface } from 'ethers'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType, type MetaTransactionData, type SafeTransaction } from '@safe-global/types-kit'
import { SupportedChainId, WRAPPED_NATIVE_CURRENCIES } from '@cowprotocol/cow-sdk'
import { ERC20__factory, Multi_send__factory } from '@safe-global/utils/types/contracts'
import { Severity, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import { COW_DEPLOYMENTS, getSwapWithOtherActionsResult } from '../swapWithOtherActions'

const ERC20_INTERFACE = ERC20__factory.createInterface()
const MULTISEND_INTERFACE = Multi_send__factory.createInterface()
const SETTLEMENT_INTERFACE = new Interface(['function setPreSignature(bytes orderUid, bool signed)'])
const WETH_INTERFACE = new Interface(['function deposit()'])

const CHAIN_ID = String(SupportedChainId.SEPOLIA)
const WRAPPED_NATIVE = WRAPPED_NATIVE_CURRENCIES[SupportedChainId.SEPOLIA].address
const [PRODUCTION, STAGING] = COW_DEPLOYMENTS

const randomAddress = () => getAddress(faker.finance.ethereumAddress())
const randomAmount = () => faker.number.bigInt({ min: 1n, max: 10n ** 18n }).toString()
const randomUid = () => faker.string.hexadecimal({ length: 112, casing: 'lower' })

const presign = (overrides: Partial<MetaTransactionData> = {}, signed = true): MetaTransactionData => ({
  to: PRODUCTION.settlement,
  value: '0',
  data: SETTLEMENT_INTERFACE.encodeFunctionData('setPreSignature', [randomUid(), signed]),
  operation: OperationType.Call,
  ...overrides,
})
const approve = (spender = PRODUCTION.vaultRelayer, token = randomAddress()): MetaTransactionData => ({
  to: token,
  value: '0',
  data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, randomAmount()]),
  operation: OperationType.Call,
})
const wrap = (to = WRAPPED_NATIVE): MetaTransactionData => ({
  to,
  value: randomAmount(),
  data: WETH_INTERFACE.encodeFunctionData('deposit'),
  operation: OperationType.Call,
})
const nativeTransfer = (): MetaTransactionData => ({
  to: randomAddress(),
  value: randomAmount(),
  data: '0x',
  operation: OperationType.Call,
})
const tokenTransfer = (): MetaTransactionData => ({
  to: randomAddress(),
  value: '0',
  data: ERC20_INTERFACE.encodeFunctionData('transfer', [randomAddress(), randomAmount()]),
  operation: OperationType.Call,
})

const singleCall = (call: MetaTransactionData) => ({ data: { ...call } }) as SafeTransaction
const batch = (calls: MetaTransactionData[], operation = OperationType.DelegateCall) =>
  ({
    data: {
      to: randomAddress(),
      value: '0',
      data: MULTISEND_INTERFACE.encodeFunctionData('multiSend', [encodeMultiSendData(calls)]),
      operation,
    },
  }) as SafeTransaction

const check = (safeTx: SafeTransaction | undefined, chainId = CHAIN_ID) =>
  getSwapWithOtherActionsResult(safeTx, chainId)

describe('getSwapWithOtherActionsResult', () => {
  it('returns nothing without a transaction', () => {
    expect(check(undefined)).toBeUndefined()
  })

  it('returns nothing for a transaction without a presignature', () => {
    expect(check(batch([tokenTransfer(), nativeTransfer()]))).toBeUndefined()
  })

  it('returns nothing for a presignature sent to the settlement contract', () => {
    expect(check(singleCall(presign()))).toBeUndefined()
  })

  it('returns nothing for a wrap, an approval to the VaultRelayer and a presignature', () => {
    expect(check(batch([wrap(), approve(), presign()]))).toBeUndefined()
  })

  it('returns nothing for an order made against the staging contracts', () => {
    expect(check(batch([approve(STAGING.vaultRelayer), presign({ to: STAGING.settlement })]))).toBeUndefined()
  })

  it('warns about transfers batched with an order', () => {
    expect(check(batch([tokenTransfer(), nativeTransfer(), presign()]))).toEqual({
      severity: Severity.WARN,
      type: ThreatStatus.SWAP_WITH_OTHER_ACTIONS,
      title: 'Swap bundled with other actions',
      description:
        'This transaction places a swap order and also contains 2 other actions that may move funds, such as transfers. Review every action before you sign.',
    })
  })

  it('counts a second presignature', () => {
    expect(check(batch([presign(), presign()]))?.description).toContain('1 other action ')
  })

  it('counts a cancelled presignature', () => {
    expect(check(batch([presign(), presign({}, false)]))?.description).toContain('1 other action ')
  })

  it('counts an approval to a spender other than the VaultRelayer', () => {
    expect(check(batch([approve(randomAddress()), presign()]))?.description).toContain('1 other action ')
  })

  it('counts an approval to the VaultRelayer of the other deployment', () => {
    expect(check(batch([approve(STAGING.vaultRelayer), presign()]))?.description).toContain('1 other action ')
  })

  it('counts a wrap sent to a contract other than the wrapped native token', () => {
    expect(check(batch([wrap(randomAddress()), presign()]))?.description).toContain('1 other action ')
  })

  it('counts a wrap on a chain without a known wrapped native token', () => {
    const safeTx = batch([wrap(), presign()])
    expect(check(safeTx, faker.string.numeric({ length: 12 }))?.description).toContain('1 other action ')
  })

  it('counts a presignature sent to an address other than the settlement contract', () => {
    expect(check(batch([nativeTransfer(), presign({ to: randomAddress() })]))?.description).toContain('2 other actions')
  })

  it('counts a presignature that sends value', () => {
    expect(check(singleCall(presign({ value: randomAmount() })))?.description).toContain('1 other action ')
  })

  it('counts a presignature made with a delegate call', () => {
    expect(check(batch([presign({ operation: OperationType.DelegateCall })]))?.description).toContain('1 other action ')
  })

  it('treats a batch that is not delegate called as a single call', () => {
    expect(check(batch([nativeTransfer(), presign()], OperationType.Call))?.description).toContain('1 other action ')
  })
})
