import { Contract, ZeroAddress, type Signer } from 'ethers'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SAFENET_CONSENSUS_ADDRESS, SAFENET_ORACLE_ADDRESSES } from '@safe-global/utils/features/safenet-checks'
import { TX_TUPLE } from '@safe-global/utils/features/safenet-checks/abi'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'

const CONSENSUS_ABI = [
  `function proposeTransaction(address oracle, bytes oracleData, ${TX_TUPLE} transaction) returns (bytes32)`,
]
const ORACLE_ABI = ['function FEE_TOKEN() view returns (address)', 'function fee() view returns (uint96)']
const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
]

export type ProposeStep = 'approving' | 'proposing'

/** The Safe transaction tuple Consensus hashes, mapped from the gateway's transaction details. */
const toSafenetTransaction = (txDetails: TransactionDetails, chainId: string) => {
  const { txData, detailedExecutionInfo: info } = txDetails
  if (!txData || !isMultisigDetailedExecutionInfo(info)) {
    throw new Error('Only a multisig transaction can be checked')
  }
  const transaction = {
    chainId: BigInt(chainId),
    safe: txDetails.safeAddress,
    to: txData.to.value,
    value: BigInt(txData.value ?? 0),
    data: txData.hexData ?? '0x',
    operation: txData.operation,
    safeTxGas: BigInt(info.safeTxGas),
    baseGas: BigInt(info.baseGas),
    gasPrice: BigInt(info.gasPrice),
    gasToken: info.gasToken,
    refundReceiver: info.refundReceiver.value,
    nonce: BigInt(info.nonce),
  }
  return { transaction, safeTxHash: info.safeTxHash }
}

/**
 * Dev tool: proposes a Safenet check for a Safe transaction from the connected wallet, which pays
 * the Oracle fee. The signer must be on the Safenet chain. Returns the proposal transaction hash.
 */
export const proposeSafenetCheck = async ({
  signer,
  txDetails,
  chainId,
  onStep,
}: {
  signer: Signer
  txDetails: TransactionDetails
  /** The Safe's home chain id. */
  chainId: string
  onStep: (step: ProposeStep) => void
}): Promise<string> => {
  const { transaction, safeTxHash } = toSafenetTransaction(txDetails, chainId)
  const oracleAddress = SAFENET_ORACLE_ADDRESSES[0]
  const oracle = new Contract(oracleAddress, ORACLE_ABI, signer)
  const [feeToken, fee]: [string, bigint] = await Promise.all([oracle.FEE_TOKEN(), oracle.fee()])

  if (feeToken !== ZeroAddress) {
    const token = new Contract(feeToken, ERC20_ABI, signer)
    const allowance: bigint = await token.allowance(await signer.getAddress(), oracleAddress)
    if (allowance < fee) {
      onStep('approving')
      await (await token.approve(oracleAddress, fee)).wait()
    }
  }

  onStep('proposing')
  const consensus = new Contract(SAFENET_CONSENSUS_ADDRESS, CONSENSUS_ABI, signer)
  const args = [oracleAddress, '0x', transaction] as const
  // Consensus returns the safeTxHash it derives. A mismatch means the tuple is wrong (or the Safe
  // predates the chainId domain), and the check would pay for a hash the wallet never reads.
  const derivedHash: string = await consensus.proposeTransaction.staticCall(...args)
  if (derivedHash.toLowerCase() !== safeTxHash.toLowerCase()) {
    throw new Error(`Safenet derives ${derivedHash}, not this transaction's ${safeTxHash}`)
  }

  const tx = await consensus.proposeTransaction(...args)
  const receipt = await tx.wait()
  if (receipt?.status !== 1) throw new Error(`Proposal transaction ${tx.hash} reverted`)
  return tx.hash
}
