import { ethers } from 'ethers'
import type { SafeTransaction, SafeSignature } from '@safe-global/types-kit'
import { GS026_MESSAGES } from '@safe-global/utils/services/exceptions/contractErrors'
import {
  Gs026PreCheckError,
  isGs026PreCheckError,
  runExecutionPreChecks,
  validateTxSignatures,
} from '../executionPreChecks'
import { getNonces } from '@/services/tx/tx-sender/recommendedNonce'
import { getSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'

jest.mock('@/services/tx/tx-sender/recommendedNonce', () => ({
  getNonces: jest.fn(),
}))

jest.mock('@/hooks/coreSDK/safeCoreSDK', () => ({
  getSafeSDK: jest.fn(),
}))

jest.mock('@/services/exceptions', () => ({
  logError: jest.fn(),
}))

const mockGetNonces = getNonces as jest.MockedFunction<typeof getNonces>
const mockGetSafeSDK = getSafeSDK as jest.MockedFunction<typeof getSafeSDK>

// A real key pair so ECDSA recovery genuinely round-trips
const signerWallet = new ethers.Wallet('0x0123456789012345678901234567890123456789012345678901234567890123')
const SAFE_TX_HASH = ethers.keccak256(ethers.toUtf8Bytes('safeTxHash'))

const validSignature = (): SafeSignature => {
  const sig = signerWallet.signingKey.sign(SAFE_TX_HASH)
  return {
    signer: signerWallet.address,
    data: sig.serialized,
    isContractSignature: false,
    staticPart: () => sig.serialized,
    dynamicPart: () => '',
  }
}

const wrongSignerSignature = (): SafeSignature => ({
  ...validSignature(),
  // Claims to be from a different address than the one that signed
  signer: '0x000000000000000000000000000000000000dEaD',
})

const contractSignature = (): SafeSignature => ({
  signer: '0x000000000000000000000000000000000000bEEF',
  data: '0x',
  isContractSignature: true,
  staticPart: () => '0x',
  dynamicPart: () => '',
})

// Safe's eth_sign encoding: an EIP-191 personal_sign over the safeTxHash bytes,
// with v shifted by +4 (27/28 -> 31/32)
const ethSignSignature = (): SafeSignature => {
  const sig = signerWallet.signMessageSync(ethers.getBytes(SAFE_TX_HASH))
  const shiftedV = parseInt(sig.slice(-2), 16) + 4
  const shiftedSig = `${sig.slice(0, -2)}${shiftedV.toString(16)}`
  return {
    signer: signerWallet.address,
    data: shiftedSig,
    isContractSignature: false,
    staticPart: () => shiftedSig,
    dynamicPart: () => '',
  }
}

// Pre-validated signature: r = padded owner address, s = 0, v = 1
const preValidatedSignature = (): SafeSignature => {
  const staticPart = `0x${'00'.repeat(12)}${signerWallet.address.slice(2)}${'00'.repeat(32)}01`
  return {
    signer: signerWallet.address,
    data: staticPart,
    isContractSignature: false,
    staticPart: () => staticPart,
    dynamicPart: () => '',
  }
}

const createSafeTx = (nonce: number, signatures: SafeSignature[]): SafeTransaction =>
  ({
    data: { nonce },
    signatures: new Map(signatures.map((sig) => [sig.signer.toLowerCase(), sig])),
  }) as unknown as SafeTransaction

const createSafe = ({ threshold = 1, owners = [signerWallet.address], deployed = true } = {}) => ({
  chainId: '1',
  address: { value: '0x0000000000000000000000000000000000005AFE' },
  owners: owners.map((value) => ({ value })),
  threshold,
  deployed,
})

describe('executionPreChecks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetNonces.mockResolvedValue(undefined)
    mockGetSafeSDK.mockReturnValue(undefined)
  })

  describe('validateTxSignatures', () => {
    it('passes a signature that recovers to its claimed signer', () => {
      const safeTx = createSafeTx(0, [validSignature()])
      expect(validateTxSignatures(safeTx, SAFE_TX_HASH)).toBeUndefined()
    })

    it('fails a signature claiming to be from a different signer', () => {
      const safeTx = createSafeTx(0, [wrongSignerSignature()])
      expect(validateTxSignatures(safeTx, SAFE_TX_HASH)).toBe(GS026_MESSAGES.BAD_SIGNATURE)
    })

    it('fails a malformed signature instead of throwing', () => {
      const broken: SafeSignature = {
        ...validSignature(),
        staticPart: () => '0x1b', // v=27 but not a real signature
      }
      const safeTx = createSafeTx(0, [broken])
      expect(validateTxSignatures(safeTx, SAFE_TX_HASH)).toBe(GS026_MESSAGES.BAD_SIGNATURE)
    })

    it('skips contract (EIP-1271) signatures', () => {
      const safeTx = createSafeTx(0, [contractSignature()])
      expect(validateTxSignatures(safeTx, SAFE_TX_HASH)).toBeUndefined()
    })

    it('skips pre-validated signatures — they can only be verified on-chain', () => {
      // Recovery is impossible for a pre-validated signature, so returning
      // undefined proves it was skipped rather than flagged as bad
      const safeTx = createSafeTx(0, [preValidatedSignature()])
      expect(validateTxSignatures(safeTx, SAFE_TX_HASH)).toBeUndefined()
    })

    it('passes an eth_sign signature that recovers to its claimed signer', () => {
      const safeTx = createSafeTx(0, [ethSignSignature()])
      expect(validateTxSignatures(safeTx, SAFE_TX_HASH)).toBeUndefined()
    })

    it('fails an eth_sign signature claiming to be from a different signer', () => {
      const badEthSign: SafeSignature = {
        ...ethSignSignature(),
        signer: '0x000000000000000000000000000000000000dEaD',
      }
      const safeTx = createSafeTx(0, [badEthSign])
      expect(validateTxSignatures(safeTx, SAFE_TX_HASH)).toBe(GS026_MESSAGES.BAD_SIGNATURE)
    })

    it('fails a malformed eth_sign signature instead of throwing', () => {
      const broken: SafeSignature = {
        ...ethSignSignature(),
        staticPart: () => '0x1f', // v=31 but not a real signature
      }
      const safeTx = createSafeTx(0, [broken])
      expect(validateTxSignatures(safeTx, SAFE_TX_HASH)).toBe(GS026_MESSAGES.BAD_SIGNATURE)
    })
  })

  describe('runExecutionPreChecks', () => {
    it('throws STALE_NONCE when another transaction already used the nonce', async () => {
      mockGetNonces.mockResolvedValue({ currentNonce: 5, recommendedNonce: 5 })
      const safeTx = createSafeTx(3, [validSignature()])

      const promise = runExecutionPreChecks({ safeTx, safe: createSafe(), signerAddress: signerWallet.address })

      await expect(promise).rejects.toThrow(GS026_MESSAGES.STALE_NONCE)
      await expect(promise).rejects.toBeInstanceOf(Gs026PreCheckError)
    })

    it('skips the nonce check when the fresh nonce cannot be fetched', async () => {
      mockGetNonces.mockResolvedValue(undefined)
      const safeTx = createSafeTx(3, [validSignature()])

      await expect(
        runExecutionPreChecks({ safeTx, safe: createSafe(), signerAddress: signerWallet.address }),
      ).resolves.toBeUndefined()
    })

    it('does not fetch the nonce for an undeployed Safe', async () => {
      const safeTx = createSafeTx(0, [validSignature()])

      await runExecutionPreChecks({
        safeTx,
        safe: createSafe({ deployed: false }),
        signerAddress: signerWallet.address,
      })

      expect(mockGetNonces).not.toHaveBeenCalled()
    })

    it('throws NOT_SIGNER when an under-signed tx is executed by a non-owner', async () => {
      // 1 signature, threshold 2 -> the executor's own signature is counted
      const safeTx = createSafeTx(0, [validSignature()])
      const safe = createSafe({ threshold: 2 })

      await expect(
        runExecutionPreChecks({ safeTx, safe, signerAddress: '0x000000000000000000000000000000000000dEaD' }),
      ).rejects.toThrow(GS026_MESSAGES.NOT_SIGNER)
    })

    it('allows a non-owner to execute a fully signed tx', async () => {
      const safeTx = createSafeTx(0, [validSignature()])
      const safe = createSafe({ threshold: 1 })

      await expect(
        runExecutionPreChecks({ safeTx, safe, signerAddress: '0x000000000000000000000000000000000000dEaD' }),
      ).resolves.toBeUndefined()
    })

    it('throws BAD_SIGNATURE when a collected signature does not verify', async () => {
      mockGetSafeSDK.mockReturnValue({
        getTransactionHash: jest.fn().mockResolvedValue(SAFE_TX_HASH),
      } as unknown as ReturnType<typeof getSafeSDK>)

      const safeTx = createSafeTx(0, [wrongSignerSignature()])

      await expect(
        runExecutionPreChecks({ safeTx, safe: createSafe(), signerAddress: signerWallet.address }),
      ).rejects.toThrow(GS026_MESSAGES.BAD_SIGNATURE)
    })

    it('resolves when nonce, signer and signatures are all valid', async () => {
      mockGetNonces.mockResolvedValue({ currentNonce: 3, recommendedNonce: 4 })
      mockGetSafeSDK.mockReturnValue({
        getTransactionHash: jest.fn().mockResolvedValue(SAFE_TX_HASH),
      } as unknown as ReturnType<typeof getSafeSDK>)

      const safeTx = createSafeTx(3, [validSignature()])

      await expect(
        runExecutionPreChecks({ safeTx, safe: createSafe(), signerAddress: signerWallet.address }),
      ).resolves.toBeUndefined()
    })
  })

  describe('isGs026PreCheckError', () => {
    it('identifies pre-check errors and rejects others', () => {
      expect(isGs026PreCheckError(new Gs026PreCheckError('STALE_NONCE'))).toBe(true)
      expect(isGs026PreCheckError(new Error(GS026_MESSAGES.STALE_NONCE))).toBe(false)
      expect(isGs026PreCheckError(undefined)).toBe(false)
    })
  })
})
