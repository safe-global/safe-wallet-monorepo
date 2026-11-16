import { faker } from '@faker-js/faker'
import { SupportedChainId, WRAPPED_NATIVE_CURRENCIES } from '@cowprotocol/cow-sdk'
import { Interface, getAddress } from 'ethers'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType, type MetaTransactionData } from '@safe-global/types-kit'
import { ERC20__factory, Multi_send__factory } from '@safe-global/utils/types/contracts'
import type { SwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { COW_DEPLOYMENTS, countNonSwapOrderCalls } from '../swapOrderCalls'

describe('countNonSwapOrderCalls', () => {
  const ERC20_INTERFACE = ERC20__factory.createInterface()
  const MULTISEND_INTERFACE = Multi_send__factory.createInterface()
  const SETTLEMENT_INTERFACE = new Interface(['function setPreSignature(bytes orderUid, bool signed)'])
  const WETH_INTERFACE = new Interface(['function deposit()'])
  const [
    { settlement: SETTLEMENT, vaultRelayer: VAULT_RELAYER },
    { settlement: STAGING_SETTLEMENT, vaultRelayer: STAGING_VAULT_RELAYER },
  ] = COW_DEPLOYMENTS

  const randomAddress = () => getAddress(faker.finance.ethereumAddress())
  const randomAmount = () => faker.number.bigInt({ min: 1n, max: 10n ** 18n }).toString()
  const randomUid = () => faker.string.hexadecimal({ length: 112, casing: 'lower' })

  const CHAIN_ID = String(SupportedChainId.SEPOLIA)
  const WRAPPED_NATIVE = WRAPPED_NATIVE_CURRENCIES[SupportedChainId.SEPOLIA].address

  const order = {
    uid: randomUid(),
    sellToken: { address: WRAPPED_NATIVE },
    sellAmount: randomAmount(),
  } as SwapOrderTransactionInfo
  const erc20Order = { ...order, sellToken: { address: randomAddress() } } as SwapOrderTransactionInfo

  const count = (txData: Parameters<typeof countNonSwapOrderCalls>[0], displayedOrder = order) =>
    countNonSwapOrderCalls(txData, displayedOrder, CHAIN_ID)

  const presign = (overrides: Partial<MetaTransactionData> = {}, uid = order.uid, signed = true) => ({
    to: SETTLEMENT,
    value: '0',
    data: SETTLEMENT_INTERFACE.encodeFunctionData('setPreSignature', [uid, signed]),
    operation: OperationType.Call,
    ...overrides,
  })
  const approve = (token = order.sellToken.address, spender = VAULT_RELAYER): MetaTransactionData => ({
    to: token,
    value: '0',
    data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, randomAmount()]),
    operation: OperationType.Call,
  })
  const wrap = (to = order.sellToken.address, value = order.sellAmount): MetaTransactionData => ({
    to,
    value,
    data: WETH_INTERFACE.encodeFunctionData('deposit'),
    operation: OperationType.Call,
  })
  const erc20Transfer = (): MetaTransactionData => ({
    to: order.sellToken.address,
    value: '0',
    data: ERC20_INTERFACE.encodeFunctionData('transfer', [randomAddress(), randomAmount()]),
    operation: OperationType.Call,
  })
  const nativeTransfer = (): MetaTransactionData => ({
    to: randomAddress(),
    value: randomAmount(),
    data: '0x',
    operation: OperationType.Call,
  })

  const singleCall = (call: MetaTransactionData) => ({
    to: { value: call.to },
    value: call.value,
    hexData: call.data,
    operation: call.operation ?? OperationType.Call,
    trustedDelegateCallTarget: null,
  })
  const batch = (calls: MetaTransactionData[], overrides = {}) => ({
    to: { value: randomAddress() },
    value: '0',
    hexData: MULTISEND_INTERFACE.encodeFunctionData('multiSend', [encodeMultiSendData(calls)]),
    operation: OperationType.DelegateCall,
    trustedDelegateCallTarget: true,
    ...overrides,
  })

  it('returns 0 for the presignature of the order sent to the settlement contract', () => {
    expect(count(singleCall(presign()))).toBe(0)
  })

  it('returns 0 for a batch of sell token approval to the VaultRelayer and presignature', () => {
    expect(count(batch([approve(), presign()]))).toBe(0)
  })

  it('returns 0 for a batch that wraps the sell amount, approves and presigns', () => {
    expect(count(batch([wrap(), approve(), presign()]))).toBe(0)
  })

  it('returns 0 for an order made against the staging contracts', () => {
    const calls = [approve(order.sellToken.address, STAGING_VAULT_RELAYER), presign({ to: STAGING_SETTLEMENT })]
    expect(count(batch(calls))).toBe(0)
  })

  it('counts an approval to the VaultRelayer of the other CoW deployment', () => {
    const calls = [approve(order.sellToken.address, STAGING_VAULT_RELAYER), presign()]
    expect(count(batch(calls))).toBe(1)
  })

  it('counts an approval to the VaultRelayer when the batch has no presignature of the order', () => {
    expect(count(batch([approve(), presign({}, randomUid())]))).toBe(2)
  })

  it('returns 0 when there is no transaction data', () => {
    expect(count({ ...singleCall(presign()), hexData: undefined })).toBe(0)
  })

  it('counts token and native transfers batched with the order', () => {
    expect(count(batch([erc20Transfer(), nativeTransfer(), presign()]))).toBe(2)
  })

  it('counts the presignature of another order', () => {
    expect(count(batch([presign(), presign({}, randomUid())]))).toBe(1)
  })

  it('counts the cancellation of a presignature', () => {
    expect(count(batch([presign(), presign({}, order.uid, false)]))).toBe(1)
  })

  it('counts an approval to a spender other than the VaultRelayer', () => {
    expect(count(batch([approve(order.sellToken.address, randomAddress()), presign()]))).toBe(1)
  })

  it('counts an approval of a token other than the sell token', () => {
    expect(count(batch([approve(randomAddress()), presign()]))).toBe(1)
  })

  it('counts a wrap sent to an address other than the sell token', () => {
    expect(count(batch([wrap(randomAddress()), presign()]))).toBe(1)
  })

  it('counts a wrap of more than the sell amount', () => {
    const value = (BigInt(order.sellAmount) + 1n).toString()
    expect(count(batch([wrap(order.sellToken.address, value), presign()]))).toBe(1)
  })

  it('counts wraps that add up to more than the sell amount', () => {
    const half = BigInt(order.sellAmount) / 2n + 1n
    const calls = [wrap(WRAPPED_NATIVE, half.toString()), wrap(WRAPPED_NATIVE, half.toString()), presign()]
    expect(count(batch(calls))).toBe(1)
  })

  it('counts a wrap when the sell token is not the wrapped native token', () => {
    const calls = [wrap(erc20Order.sellToken.address), approve(erc20Order.sellToken.address), presign()]
    expect(count(batch(calls), erc20Order)).toBe(1)
  })

  it('counts a wrap on a chain without a known wrapped native token', () => {
    const calls = [wrap(), approve(), presign()]
    expect(countNonSwapOrderCalls(batch(calls), order, faker.string.numeric({ length: 12 }))).toBe(1)
  })

  it('counts a presignature sent to an address other than the settlement contract', () => {
    expect(count(singleCall(presign({ to: randomAddress() })))).toBe(1)
  })

  it('counts a presignature that sends value', () => {
    expect(count(singleCall(presign({ value: randomAmount() })))).toBe(1)
  })

  it('counts a presignature made with a delegate call', () => {
    expect(count(batch([presign({ operation: OperationType.DelegateCall })]))).toBe(1)
  })

  it('counts a batch sent to an untrusted delegate call target as one call', () => {
    expect(count(batch([presign()], { trustedDelegateCallTarget: false }))).toBe(1)
  })

  it('counts a batch that is not a delegate call as one call', () => {
    const calls = [presign()]
    expect(count(batch(calls, { operation: OperationType.Call, trustedDelegateCallTarget: null }))).toBe(1)
  })
})
