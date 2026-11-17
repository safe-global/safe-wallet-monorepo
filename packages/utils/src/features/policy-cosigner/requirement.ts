import { Interface, ZeroAddress, isError } from 'ethers'
import { decodeMultiSendData } from '@safe-global/protocol-kit'
import { COSIGNER_POLICY_ABI, POLICY_GUARD_GET_POLICY_ABI } from './constants'

export type EthCall = (tx: { to: string; data: string }) => Promise<string>

type CheckedCall = { to: string; data: string; operation: number }

export type CosignerRequirement =
  { mode: 'none' } | { mode: 'single'; cosigner: string; policy: string; access: bigint } | { mode: 'perAction' }

const DELEGATE_CALL = 1
const MULTI_SEND_SELECTOR = '0x8d80ff0a'

const guardInterface = new Interface(POLICY_GUARD_GET_POLICY_ABI)
const cosignerInterface = new Interface(COSIGNER_POLICY_ABI)

const isMultiSend = ({ data, operation }: CheckedCall): boolean =>
  operation === DELEGATE_CALL && data.toLowerCase().startsWith(MULTI_SEND_SELECTOR)

const isRevertOrBadData = (error: unknown): boolean => isError(error, 'CALL_EXCEPTION') || isError(error, 'BAD_DATA')

const getPolicy = async (call: EthCall, guard: string, safe: string, tx: CheckedCall) => {
  const result = await call({
    to: guard,
    data: guardInterface.encodeFunctionData('getPolicy', [safe, tx.to, tx.data, tx.operation]),
  })
  const [access, policy] = guardInterface.decodeFunctionResult('getPolicy', result)
  return { access: access as bigint, policy: policy as string }
}

// A policy without `getCoSigner` reverts or returns no data, which means it is not a CoSignerPolicy
const getCoSigner = async (call: EthCall, guard: string, safe: string, policy: string, access: bigint) => {
  try {
    const result = await call({
      to: policy,
      data: cosignerInterface.encodeFunctionData('getCoSigner', [guard, safe, access]),
    })
    const [cosigner] = cosignerInterface.decodeFunctionResult('getCoSigner', result)
    return cosigner === ZeroAddress ? undefined : (cosigner as string)
  } catch (error) {
    if (isRevertOrBadData(error)) {
      return undefined
    }
    throw error
  }
}

const ACCESS_OPERATION_MASK = 0xffn << 216n

// AccessSelector packs `selector(4) | operation(1) | target(20)`; a fallback carries only the operation
const isFallbackAccess = (access: bigint): boolean => (access & ~ACCESS_OPERATION_MASK) === 0n

/**
 * Reads from the guard which policy checks `tx` and whether that policy is a CoSignerPolicy.
 * A batch whose `multiSend` access has a policy of its own (MultiSendPolicy) is checked per action,
 * so each action routed to a CoSignerPolicy needs its own co-signature.
 */
export const resolveCosignerRequirement = async (
  call: EthCall,
  guard: string,
  safe: string,
  tx: CheckedCall,
): Promise<CosignerRequirement> => {
  const { access, policy } = await getPolicy(call, guard, safe, tx)
  if (policy === ZeroAddress) {
    return { mode: 'none' }
  }

  const cosigner = await getCoSigner(call, guard, safe, policy, access)
  if (cosigner) {
    return { mode: 'single', cosigner, policy, access }
  }

  // MultiSendPolicy can only be bound to the specific `multiSend` access, never to a fallback
  if (!isMultiSend(tx) || isFallbackAccess(access)) {
    return { mode: 'none' }
  }

  for (const action of decodeMultiSendData(tx.data)) {
    const actionTx = {
      to: action.to === ZeroAddress ? safe : action.to,
      data: action.data,
      operation: action.operation ?? 0,
    }
    const actionPolicy = await getPolicy(call, guard, safe, actionTx)
    if (actionPolicy.policy === ZeroAddress) {
      continue
    }
    if (await getCoSigner(call, guard, safe, actionPolicy.policy, actionPolicy.access)) {
      return { mode: 'perAction' }
    }
  }

  return { mode: 'none' }
}
