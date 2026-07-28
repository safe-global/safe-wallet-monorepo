import { TypedDataEncoder } from 'ethers'
import type { Hex } from '../types'

/**
 * The EIP-712 oracle-transaction proposal hash — ported from
 * `repos/safenet/validator/src/consensus/verify/oracleTx/hashing.ts` (viem
 * `hashTypedData`) onto ethers' `TypedDataEncoder`.
 *
 * The domain is ONLY `{ chainId, verifyingContract }` (no name/version/salt).
 * This hash is both the message the FROST attestation signs AND the oracle
 * `requestId` — so deriving it gives the read layer request-id correlation for
 * free (verified live: it equals the onchain `requestId`).
 */
export type OracleProposal = {
  /** The Safenet chain id (feeds the EIP-712 domain). */
  chainId: string | number | bigint
  /** The Consensus contract address — the EIP-712 `verifyingContract`. */
  consensus: string
  epoch: string | number | bigint
  oracle: string
  safeTxHash: Hex
}

const ORACLE_PROPOSAL_TYPES = {
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

/** Alias: the oracle-proposal hash IS the oracle request id. */
export const deriveRequestId = oracleProposalHash

/**
 * The EIP-712 message a **non-oracle** `TransactionAttested` signs — the
 * attestation produced when the validator set runs its own deterministic checks
 * with no sentinel oracle involved. Same domain as
 * {@link oracleProposalHash}, one fewer field (no `oracle`).
 *
 * Source: `contracts/src/libraries/ConsensusMessages.sol`
 * (`TRANSACTION_PROPOSAL_TYPEHASH` = `keccak256("TransactionProposal(uint64
 * epoch,bytes32 safeTxHash)")`).
 */
export type PlainProposal = Omit<OracleProposal, 'oracle'>

const PLAIN_PROPOSAL_TYPES = {
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
