import { TypedDataEncoder, concat, keccak256, AbiCoder } from 'ethers'
import type { Hex } from '../types'

/**
 * EIP-712 preimages the FROST attestations sign. The domain is ONLY
 * `{ chainId, verifyingContract }` — no name/version/salt — and `chainId` is
 * the Safenet chain Consensus is deployed to, NOT the Safe's home chain
 * carried in the event.
 */

/**
 * The message a non-oracle `TransactionAttested` signs — what live Gnosis
 * beta traffic emits.
 */
export type PlainProposal = {
  chainId: string
  /** The Consensus contract address — the EIP-712 `verifyingContract`. */
  consensus: string
  epoch: string
  safeTxHash: Hex
}

export const PLAIN_PROPOSAL_TYPES = {
  TransactionProposal: [
    { name: 'epoch', type: 'uint64' },
    { name: 'safeTxHash', type: 'bytes32' },
  ],
}

export const plainProposalHash = ({ chainId, consensus, epoch, safeTxHash }: PlainProposal): Hex =>
  TypedDataEncoder.hash({ chainId: BigInt(chainId), verifyingContract: consensus }, PLAIN_PROPOSAL_TYPES, {
    epoch: BigInt(epoch),
    safeTxHash,
  }) as Hex

/**
 * The oracle-transaction proposal hash — one message type for every oracle
 * check, the oracle named inline. `oracleData` is a `bytes` member, so
 * EIP-712 encodes it as its keccak256; the attested event carries exactly
 * that hash (`oracleDataHash`), so the struct hash is built manually instead
 * of through `TypedDataEncoder` (which needs the raw bytes). This hash is the
 * FROST-signed message AND the oracle `requestId`.
 */
export type TransactionProposal = PlainProposal & {
  oracle: string
  oracleDataHash: Hex
}

/** keccak256("TransactionProposal(uint64 epoch,address oracle,bytes oracleData,bytes32 safeTxHash)") */
export const TRANSACTION_PROPOSAL_TYPEHASH = '0x9c6706f5afdb1de99f5ad39011e7770ce471f51d78380634f6cedb21a648b8d0'

const abiCoder = AbiCoder.defaultAbiCoder()

export const transactionProposalHash = ({
  chainId,
  consensus,
  epoch,
  oracle,
  oracleDataHash,
  safeTxHash,
}: TransactionProposal): Hex => {
  const domainSeparator = TypedDataEncoder.hashDomain({ chainId: BigInt(chainId), verifyingContract: consensus })
  const structHash = keccak256(
    abiCoder.encode(
      ['bytes32', 'uint64', 'address', 'bytes32', 'bytes32'],
      [TRANSACTION_PROPOSAL_TYPEHASH, BigInt(epoch), oracle, oracleDataHash, safeTxHash],
    ),
  )
  return keccak256(concat(['0x1901', domainSeparator, structHash])) as Hex
}
