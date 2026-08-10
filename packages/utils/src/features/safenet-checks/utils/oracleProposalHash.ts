import { TypedDataEncoder } from 'ethers'
import type { Hex } from '../types'

/**
 * The EIP-712 oracle-transaction proposal hash. The domain is ONLY
 * `{ chainId, verifyingContract }` — no name/version/salt — and `chainId` is
 * the Safenet chain Consensus is deployed to, NOT the Safe's home chain carried
 * in the event. This hash is both the message the FROST attestation signs and
 * the oracle `requestId`.
 */
export type OracleProposal = {
  chainId: string
  /** The Consensus contract address — the EIP-712 `verifyingContract`. */
  consensus: string
  epoch: string
  oracle: string
  safeTxHash: Hex
}

export const ORACLE_PROPOSAL_TYPES = {
  OracleTransactionProposal: [
    { name: 'epoch', type: 'uint64' },
    { name: 'oracle', type: 'address' },
    { name: 'safeTxHash', type: 'bytes32' },
  ],
}

export const oracleProposalHash = ({ chainId, consensus, epoch, oracle, safeTxHash }: OracleProposal): Hex =>
  TypedDataEncoder.hash({ chainId: BigInt(chainId), verifyingContract: consensus }, ORACLE_PROPOSAL_TYPES, {
    epoch: BigInt(epoch),
    oracle,
    safeTxHash,
  }) as Hex

/**
 * The EIP-712 message a non-oracle `TransactionAttested` signs. Same domain as
 * {@link oracleProposalHash}, one fewer field (no `oracle`).
 */
type PlainProposal = Omit<OracleProposal, 'oracle'> & { oracle?: never }

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
