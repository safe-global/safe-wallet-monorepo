/**
 * Registry of known custom-error selectors (WA-3005 / GS013).
 *
 * A GS013 revert means the Safe transaction's inner call failed. When the
 * failure comes from a module or guard it often surfaces as a bare 4-byte
 * custom-error selector we can't write copy for. This registry derives the
 * selectors of every custom error declared by the module/guard ABIs vendored
 * in the repo, so the support reference can name the error (e.g.
 * `UnapprovedHash (Hypernative guard)`) instead of showing raw hex. Selectors
 * we cannot decode stay as raw hex in the support reference — never in the
 * user-facing message.
 */
import { Interface, isCallException, type InterfaceAbi } from 'ethers'
import { BaseError as ViemBaseError, ContractFunctionRevertedError } from 'viem'
import { ContractAbis } from '@gnosis.pm/zodiac'
import { Safe4337Module__factory } from '@safe-global/utils/types/contracts/factories/@safe-global/safe-modules-deployments/dist/assets/safe-4337-module/v0.3.0/Safe4337Module__factory'
import { SafeWebauthnSharedSigner__factory } from '@safe-global/utils/types/contracts/factories/@safe-global/safe-modules-deployments/dist/assets/safe-passkey-module/v0.2.1/SafeWebauthnSharedSigner__factory'
import { HypernativeGuardAbi, HypernativeGuardV2Abi } from '@/features/hypernative/services'

export type KnownCustomError = {
  name: string
  source: string
}

export type DecodedCustomError = {
  selector: string
  name?: string
  source?: string
}

/**
 * Solidity's built-in revert selectors: `Error(string)` and `Panic(uint256)`.
 * These are string/panic reverts (e.g. the "GS013" require itself), not
 * module/guard custom errors, so they carry no decodable name.
 */
const STANDARD_ERROR_SELECTORS = new Set(['0x08c379a0', '0x4e487b71'])

const ABI_SOURCES: ReadonlyArray<{ source: string; abi: InterfaceAbi }> = [
  { source: 'Hypernative guard', abi: HypernativeGuardAbi as InterfaceAbi },
  { source: 'Hypernative guard', abi: HypernativeGuardV2Abi as InterfaceAbi },
  { source: 'Zodiac Roles module', abi: ContractAbis.roles_v2 as InterfaceAbi },
  { source: 'Zodiac Roles module', abi: ContractAbis.roles_v1 as InterfaceAbi },
  { source: 'Zodiac Roles module', abi: ContractAbis.permissions as InterfaceAbi },
  { source: 'Zodiac Meta guard', abi: ContractAbis.metaGuard as InterfaceAbi },
  { source: 'Safe 4337 module', abi: Safe4337Module__factory.abi as InterfaceAbi },
  { source: 'Safe passkey signer', abi: SafeWebauthnSharedSigner__factory.abi as InterfaceAbi },
]

const CUSTOM_ERROR_REGISTRY: ReadonlyMap<string, KnownCustomError> = (() => {
  const registry = new Map<string, KnownCustomError>()

  for (const { source, abi } of ABI_SOURCES) {
    try {
      const iface = new Interface(abi)
      iface.forEachError((fragment) => {
        const selector = fragment.selector.toLowerCase()
        // First registration wins on selector collisions (identical fragments
        // across Roles versions); the registry tests pin the expected entries.
        if (!registry.has(selector)) {
          registry.set(selector, { name: fragment.name, source })
        }
      })
    } catch {
      // A malformed vendored ABI must not break error rendering
    }
  }

  return registry
})()

/** Look a 4-byte selector up against the known module/guard custom errors. */
export const getKnownCustomError = (selector: string): KnownCustomError | undefined =>
  CUSTOM_ERROR_REGISTRY.get(selector.toLowerCase())

// A 4-byte selector in message text is only trusted when explicitly framed as
// a custom error / revert signature. A bare 8-hex token in revert text can be
// a coincidence (gas price, nonce, block number), and the lookahead alone only
// rejects LONGER hex blobs (addresses, hashes, calldata) — not those.
const MESSAGE_SELECTOR_RE = /(?:custom error|following signature:?)[\s'"]*(0x[0-9a-f]{8})(?![0-9a-f])/i

/**
 * Extract the 4-byte selector of the revert data carried by an error, if any.
 * Prefers structured fields (ethers `CALL_EXCEPTION` data, viem revert cause)
 * over message text; the message fallback only applies when the message talks
 * about a revert at all.
 */
export const extractRevertSelector = (error: unknown): string | undefined => {
  if (!error) return undefined

  // ethers CALL_EXCEPTION carries the raw revert bytes in `data`
  if (isCallException(error as Error)) {
    const data = (error as { data?: unknown }).data
    if (typeof data === 'string' && data.startsWith('0x') && data.length >= 10) {
      return data.slice(0, 10).toLowerCase()
    }
  }

  // viem wraps the revert bytes in a ContractFunctionRevertedError cause
  if (error instanceof ViemBaseError) {
    const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError) as
      | ContractFunctionRevertedError
      | undefined
    const raw = reverted?.raw
    if (typeof raw === 'string' && raw.length >= 10) {
      return raw.slice(0, 10).toLowerCase()
    }
  }

  // Message fallback, only when the selector is explicitly framed as one
  const message = (error as { message?: string }).message
  if (typeof message === 'string') {
    const match = message.match(MESSAGE_SELECTOR_RE)
    if (match) {
      return match[1].toLowerCase()
    }
  }
}

/**
 * Decode an error's custom-error revert, if it has one. Returns undefined for
 * plain string/panic reverts (e.g. the "GS013" require itself) — only genuine
 * module/guard custom errors are surfaced, decoded when the selector is known.
 */
export const decodeCustomError = (error: unknown): DecodedCustomError | undefined => {
  const selector = extractRevertSelector(error)

  if (!selector || STANDARD_ERROR_SELECTORS.has(selector)) {
    return undefined
  }

  return { selector, ...getKnownCustomError(selector) }
}
