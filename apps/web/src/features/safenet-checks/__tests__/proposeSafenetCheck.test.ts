import { ZeroAddress, type Signer } from 'ethers'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SAFENET_CONSENSUS_ADDRESS, SAFENET_ORACLE_ADDRESSES } from '@safe-global/utils/features/safenet-checks'
import { txInfoBuilder } from '@/tests/builders/safeTx'
import { proposeSafenetCheck, type ProposeStep } from '../proposeSafenetCheck'

const mockContracts: Record<string, Record<string, unknown>> = {}
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  Contract: jest.fn((address: string) => mockContracts[address]),
}))

const ORACLE = SAFENET_ORACLE_ADDRESSES[0]
const FEE_TOKEN = '0x3b1cFcfa89A19F6CDf8995ee8AE35D7D585e7025'
const FEE = 400_000_000_000_000_000n
const SAFE = '0xB208Ab829C73B8226Cade5Cc3126966ef0F81ee9'
const TO = '0xfc0233Bc3e33d58C0a8A40F19eFcF0e04dd55622'
const SAFE_TX_HASH = `0x${'ab'.repeat(32)}`
const signer = { getAddress: () => Promise.resolve(TO) } as unknown as Signer

const multisigTx = (): TransactionDetails => ({
  safeAddress: SAFE,
  txId: `multisig_${SAFE}_${SAFE_TX_HASH}`,
  txStatus: 'AWAITING_EXECUTION',
  txInfo: txInfoBuilder().build(),
  txData: { to: { value: TO }, value: null, hexData: null, operation: 0 },
  detailedExecutionInfo: {
    type: 'MULTISIG',
    submittedAt: 0,
    nonce: 7,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: ZeroAddress,
    fee: '0',
    payment: '0',
    refundReceiver: { value: ZeroAddress },
    safeTxHash: SAFE_TX_HASH,
    signers: [],
    confirmationsRequired: 1,
    confirmations: [],
    rejectors: [],
    trusted: true,
  },
})

const setup = ({ allowance = FEE, derivedHash = SAFE_TX_HASH, feeToken = FEE_TOKEN } = {}) => {
  const wait = jest.fn().mockResolvedValue({ status: 1 })
  const approve = jest.fn().mockResolvedValue({ wait })
  const allowanceOf = jest.fn().mockResolvedValue(allowance)
  const proposeTransaction = Object.assign(jest.fn().mockResolvedValue({ hash: '0xproposal', wait }), {
    staticCall: jest.fn().mockResolvedValue(derivedHash),
  })
  mockContracts[ORACLE] = { FEE_TOKEN: () => Promise.resolve(feeToken), fee: () => Promise.resolve(FEE) }
  mockContracts[FEE_TOKEN] = { allowance: allowanceOf, approve }
  mockContracts[SAFENET_CONSENSUS_ADDRESS] = { proposeTransaction }
  return { approve, allowanceOf, proposeTransaction }
}

const propose = (txDetails = multisigTx()) => {
  const steps: ProposeStep[] = []
  const result = proposeSafenetCheck({ signer, txDetails, chainId: '100', onStep: (s) => steps.push(s) })
  return { result, steps }
}

describe('proposeSafenetCheck', () => {
  it("proposes the Safe's own tuple and skips the approval when the allowance covers the fee", async () => {
    const { approve, proposeTransaction } = setup({ allowance: FEE })

    const { result, steps } = propose()

    await expect(result).resolves.toBe('0xproposal')
    expect(approve).not.toHaveBeenCalled()
    expect(steps).toEqual(['proposing'])
    expect(proposeTransaction).toHaveBeenCalledWith(ORACLE, '0x', {
      chainId: 100n,
      safe: SAFE,
      to: TO,
      value: 0n,
      data: '0x',
      operation: 0,
      safeTxGas: 0n,
      baseGas: 0n,
      gasPrice: 0n,
      gasToken: ZeroAddress,
      refundReceiver: ZeroAddress,
      nonce: 7n,
    })
  })

  it('approves exactly the fee before proposing when the allowance is short', async () => {
    const { approve, proposeTransaction } = setup({ allowance: FEE - 1n })

    const { result, steps } = propose()

    await expect(result).resolves.toBe('0xproposal')
    expect(approve).toHaveBeenCalledWith(ORACLE, FEE)
    expect(steps).toEqual(['approving', 'proposing'])
    expect(approve.mock.invocationCallOrder[0]).toBeLessThan(proposeTransaction.mock.invocationCallOrder[0])
  })

  it('refuses to send when Consensus derives a different safeTxHash', async () => {
    const { proposeTransaction } = setup({ derivedHash: `0x${'cd'.repeat(32)}` })

    await expect(propose().result).rejects.toThrow(/not this transaction's/)
    expect(proposeTransaction).not.toHaveBeenCalled()
  })

  it('skips the allowance when the Oracle charges no fee token', async () => {
    const { allowanceOf, proposeTransaction } = setup({ feeToken: ZeroAddress })

    await expect(propose().result).resolves.toBe('0xproposal')
    expect(allowanceOf).not.toHaveBeenCalled()
    expect(proposeTransaction).toHaveBeenCalled()
  })

  it('rejects a module transaction before touching any contract', async () => {
    const { proposeTransaction } = setup()
    const moduleTx = { ...multisigTx(), detailedExecutionInfo: { type: 'MODULE' as const, address: { value: TO } } }

    await expect(propose(moduleTx).result).rejects.toThrow('Only a multisig transaction can be checked')
    expect(proposeTransaction.staticCall).not.toHaveBeenCalled()
  })
})
