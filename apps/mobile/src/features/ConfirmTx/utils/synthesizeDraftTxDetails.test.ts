import { faker } from '@faker-js/faker'
import type {
  AddressInfo,
  MultisigExecutionDetails,
  TransactionData,
  TransactionPreview,
  TransferTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { synthesizeDraftTxDetails } from './synthesizeDraftTxDetails'

const owner = (address: string): AddressInfo => ({ value: address, name: null, logoUri: null })

const buildPreview = (): TransactionPreview => ({
  txInfo: {
    type: 'Transfer',
    sender: owner(faker.finance.ethereumAddress()),
    recipient: owner(faker.finance.ethereumAddress()),
    direction: 'OUTGOING',
    transferInfo: {
      type: 'NATIVE_COIN',
      value: '1000',
    },
  } as unknown as TransferTransactionInfo,
  txData: {
    to: owner(faker.finance.ethereumAddress()),
    value: '1000',
    operation: 0,
    trustedDelegateCallTarget: null,
    addressInfoIndex: null,
    tokenInfoIndex: null,
  } as unknown as TransactionData,
})

describe('synthesizeDraftTxDetails', () => {
  const safeAddress = faker.finance.ethereumAddress()
  const ownerA = faker.finance.ethereumAddress()
  const ownerB = faker.finance.ethereumAddress()
  const owners = [owner(ownerA), owner(ownerB)]

  it('builds a TransactionDetails shape that downstream consumers can read', () => {
    const safeTxHash = `0x${faker.string.hexadecimal({ length: 64, prefix: '' })}`
    const preview = buildPreview()

    const details = synthesizeDraftTxDetails({
      safeAddress,
      safeTxHash,
      buildParams: {
        to: faker.finance.ethereumAddress(),
        value: '0',
        data: '0x',
        nonce: 5,
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
      },
      owners,
      threshold: 2,
      preview,
      sender: ownerA,
    })

    expect(details.txId).toBe(safeTxHash)
    expect(details.safeAddress).toBe(safeAddress)
    expect(details.txStatus).toBe('AWAITING_CONFIRMATIONS')
    expect(details.txInfo).toBe(preview.txInfo)
    expect(details.txData).toBe(preview.txData)
    expect(details.txHash).toBeNull()
  })

  it('produces a MultisigExecutionDetails with zero confirmations and every owner listed', () => {
    const safeTxHash = `0x${faker.string.hexadecimal({ length: 64, prefix: '' })}`
    const details = synthesizeDraftTxDetails({
      safeAddress,
      safeTxHash,
      buildParams: { to: faker.finance.ethereumAddress(), value: '0', data: '0x', nonce: 3 },
      owners,
      threshold: 2,
      preview: buildPreview(),
      sender: ownerA,
    })

    const exec = details.detailedExecutionInfo as MultisigExecutionDetails
    expect(exec.type).toBe('MULTISIG')
    expect(exec.nonce).toBe(3)
    expect(exec.confirmations).toEqual([])
    expect(exec.confirmationsRequired).toBe(2)
    expect(exec.signers).toEqual(owners)
    expect(exec.safeTxHash).toBe(safeTxHash)
    expect(exec.trusted).toBe(true)
    expect(exec.rejectors).toEqual([])
  })

  it('marks the sender as the proposer when the sender matches a known owner', () => {
    const details = synthesizeDraftTxDetails({
      safeAddress,
      safeTxHash: `0x${faker.string.hexadecimal({ length: 64, prefix: '' })}`,
      buildParams: { to: faker.finance.ethereumAddress(), value: '0', data: '0x', nonce: 0 },
      owners,
      threshold: 1,
      preview: buildPreview(),
      sender: ownerA,
    })

    const exec = details.detailedExecutionInfo as MultisigExecutionDetails
    expect(exec.proposer?.value.toLowerCase()).toBe(ownerA.toLowerCase())
  })

  it('falls back to a synthetic AddressInfo when the sender is not a known owner', () => {
    const externalSender = faker.finance.ethereumAddress()
    const details = synthesizeDraftTxDetails({
      safeAddress,
      safeTxHash: `0x${faker.string.hexadecimal({ length: 64, prefix: '' })}`,
      buildParams: { to: faker.finance.ethereumAddress(), value: '0', data: '0x', nonce: 0 },
      owners,
      threshold: 1,
      preview: buildPreview(),
      sender: externalSender,
    })

    const exec = details.detailedExecutionInfo as MultisigExecutionDetails
    expect(exec.proposer?.value).toBe(externalSender)
  })

  it('coerces non-numeric gas fields to strings and a non-numeric nonce to a number', () => {
    const details = synthesizeDraftTxDetails({
      safeAddress,
      safeTxHash: `0x${faker.string.hexadecimal({ length: 64, prefix: '' })}`,
      buildParams: {
        to: faker.finance.ethereumAddress(),
        value: '0',
        data: '0x',
        nonce: '7' as unknown as number,
        safeTxGas: 12345n as unknown as string,
        baseGas: 0n as unknown as string,
        gasPrice: 0n as unknown as string,
      },
      owners,
      threshold: 1,
      preview: buildPreview(),
    })

    const exec = details.detailedExecutionInfo as MultisigExecutionDetails
    expect(exec.nonce).toBe(7)
    expect(exec.safeTxGas).toBe('12345')
  })
})
