import { AbiCoder, Interface, isAddress } from 'ethers'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { RECIPIENT_DATA_TYPE } from '../components/Policies/ERC20TransferPolicy/contracts'
import {
  APPLY_CONFIGURATION_ABI,
  CONFIGURE_IMMEDIATELY_ABI,
  REQUEST_CONFIGURATION_ABI,
  type PolicyConfiguration,
} from '../components/Policies/shared/guardTx'

/**
 * The SafePolicyGuard methods a Safe transaction can carry. `requestConfiguration` only
 * publishes a root — the configurations behind it are not in the calldata — while the
 * other two carry the full array.
 */
export const POLICY_TX_METHODS = ['requestConfiguration', 'applyConfiguration', 'configureImmediately'] as const
export type PolicyTxMethod = (typeof POLICY_TX_METHODS)[number]

export const isPolicyTxMethod = (method?: string | null): method is PolicyTxMethod =>
  !!method && POLICY_TX_METHODS.includes(method as PolicyTxMethod)

const configureIface = new Interface(CONFIGURE_IMMEDIATELY_ABI)
const applyIface = new Interface(APPLY_CONFIGURATION_ABI)
const requestIface = new Interface(REQUEST_CONFIGURATION_ABI)

/** ethers returns Result proxies; normalise to the plain struct the UI works with. */
const toConfigurations = (decoded: unknown): PolicyConfiguration[] =>
  (decoded as Array<[string, string, bigint | number, string, string]>).map((entry) => ({
    target: entry[0],
    selector: entry[1],
    operation: Number(entry[2]),
    policy: entry[3],
    data: entry[4],
  }))

/**
 * The `Configuration[]` a `configureImmediately` / `applyConfiguration` calldata commits to.
 *
 * Decoded from the raw calldata rather than the gateway's `dataDecoded`, so the function
 * selector has to match our ABI — a same-named method on some other contract simply
 * doesn't decode, and the caller falls back to the generic parameter view.
 */
export const decodeConfigurations = (hexData?: string | null): PolicyConfiguration[] | undefined => {
  if (!hexData) return undefined

  for (const iface of [configureIface, applyIface]) {
    try {
      const [configurations] = iface.decodeFunctionData(
        iface === applyIface ? 'applyConfiguration' : 'configureImmediately',
        hexData,
      )
      return toConfigurations(configurations)
    } catch {
      // Not this method; try the next.
    }
  }

  return undefined
}

const SELECTORS: Record<string, PolicyTxMethod> = {
  [requestIface.getFunction('requestConfiguration')!.selector]: 'requestConfiguration',
  [applyIface.getFunction('applyConfiguration')!.selector]: 'applyConfiguration',
  [configureIface.getFunction('configureImmediately')!.selector]: 'configureImmediately',
}

/** The root a `requestConfiguration` calldata publishes. */
export const decodeConfigureRoot = (hexData?: string | null): string | undefined => {
  if (!hexData) return undefined

  try {
    const [root] = requestIface.decodeFunctionData('requestConfiguration', hexData)
    return root as string
  } catch {
    return undefined
  }
}

/**
 * The guard method this calldata calls, from its selector.
 *
 * The gateway's `dataDecoded` can't be relied on — it has no ABI for the guard on most
 * chains, so it reports nothing at all. The selector is ours to check, and a same-named
 * method on another contract wouldn't decode against our ABI anyway.
 */
export const policyTxMethodOf = (hexData?: string | null): PolicyTxMethod | undefined => {
  const method = hexData ? SELECTORS[hexData.slice(0, 10).toLowerCase()] : undefined
  if (!method) return undefined

  // The selector alone isn't proof: the arguments have to decode against our ABI too.
  const decodes = method === 'requestConfiguration' ? !!decodeConfigureRoot(hexData) : !!decodeConfigurations(hexData)

  return decodes ? method : undefined
}

/** Whether this calldata is a policy configuration we can render. */
export const canDecodePolicyTx = (hexData?: string | null): boolean => !!policyTxMethodOf(hexData)

/* ----------------------------- policy payloads ----------------------------- */

export type PolicyPayload =
  /** Allow, Deny and native transfers read no payload. */
  | { kind: 'none' }
  /** ERC20TransferPolicy: `abi.encode(RecipientData[])`. `allowed: false` removes a recipient. */
  | { kind: 'recipients'; recipients: Array<{ address: string; allowed: boolean }> }
  /** CoSignerPolicy: `abi.encode(address cosigner)`. The zero address clears it. */
  | { kind: 'cosigner'; cosigner: string }
  /** Anything we can't attribute — shown as-is rather than guessed at. */
  | { kind: 'raw'; data: string }

const decodeRecipients = (data: string): PolicyPayload | undefined => {
  try {
    const [entries] = AbiCoder.defaultAbiCoder().decode([RECIPIENT_DATA_TYPE], data)
    const recipients = (entries as Array<[string, boolean]>).map((entry) => ({
      address: entry[0],
      allowed: entry[1],
    }))

    return recipients.every((r) => isAddress(r.address)) ? { kind: 'recipients', recipients } : undefined
  } catch {
    return undefined
  }
}

const decodeCosigner = (data: string): PolicyPayload | undefined => {
  try {
    const [cosigner] = AbiCoder.defaultAbiCoder().decode(['address'], data)
    return { kind: 'cosigner', cosigner: cosigner as string }
  } catch {
    return undefined
  }
}

const isEmptyData = (data?: string | null) => !data || data === '0x'

/**
 * What a configuration's `data` means.
 *
 * With the policy type known (from the catalogue or the Safe's active policies) the payload
 * is decoded as that policy defines it. Without it, the shape is tried in order — an
 * `abi.encode(address)` payload and a one-entry `RecipientData[]` are distinguishable, and
 * anything else falls through to raw hex rather than being labelled wrongly.
 */
export const decodePolicyPayload = (data?: string | null, type?: PolicyType): PolicyPayload => {
  if (isEmptyData(data)) return { kind: 'none' }
  const hex = data as string

  if (type === PolicyType.TokenWithdraw) return decodeRecipients(hex) ?? { kind: 'raw', data: hex }
  if (type === PolicyType.Cosigner) return decodeCosigner(hex) ?? { kind: 'raw', data: hex }
  if (type === PolicyType.Allow || type === PolicyType.Deny || type === PolicyType.NativeTransfer) {
    return { kind: 'none' }
  }

  return decodeRecipients(hex) ?? decodeCosigner(hex) ?? { kind: 'raw', data: hex }
}

/** A cleared cosigner reads better than "the zero address". */
export const isClearedCosigner = (payload: PolicyPayload): boolean =>
  payload.kind === 'cosigner' && payload.cosigner.toLowerCase() === ZERO_ADDRESS.toLowerCase()
